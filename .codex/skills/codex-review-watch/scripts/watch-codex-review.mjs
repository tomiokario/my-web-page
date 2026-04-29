#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const DEFAULT_AUTHOR_PATTERN = "codex|openai";

function parseArgs(argv) {
  const options = {
    authorPattern: DEFAULT_AUTHOR_PATTERN,
    intervalSeconds: 30,
    timeoutSeconds: 1800,
    once: false,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) {
        throw new Error(`${arg} requires a value`);
      }
      return argv[index];
    };

    if (arg === "--pr") options.prNumber = Number(next());
    else if (arg === "--repo") options.repo = next();
    else if (arg === "--interval") options.intervalSeconds = Number(next());
    else if (arg === "--timeout") options.timeoutSeconds = Number(next());
    else if (arg === "--author-pattern") options.authorPattern = next();
    else if (arg === "--state") options.statePath = next();
    else if (arg === "--once") options.once = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }

  if (!Number.isFinite(options.intervalSeconds) || options.intervalSeconds < 5) {
    throw new Error("--interval must be at least 5 seconds");
  }
  if (!Number.isFinite(options.timeoutSeconds) || options.timeoutSeconds < 5) {
    throw new Error("--timeout must be at least 5 seconds");
  }
  if (options.prNumber !== undefined && (!Number.isInteger(options.prNumber) || options.prNumber < 1)) {
    throw new Error("--pr must be a positive integer");
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node watch-codex-review.mjs [options]

Options:
  --pr <number>              Pull Request number. Defaults to the current branch PR.
  --repo <owner/name>        Repository. Defaults to gh repo view.
  --interval <seconds>       Poll interval. Default: 30.
  --timeout <seconds>        Timeout. Default: 1800.
  --author-pattern <regex>   Reviewer author matcher. Default: ${DEFAULT_AUTHOR_PATTERN}.
  --state <path>             State file for seen comment IDs.
  --once                     Check once and exit.
  --json                     Print JSON output.
`);
}

function gh(args) {
  const env = { ...process.env };
  delete env.CODEX_SANDBOX_NETWORK_DISABLED;

  return execFileSync("gh", args, {
    encoding: "utf8",
    env,
    maxBuffer: 16 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function ghJson(args) {
  const output = gh(["api", "--paginate", "--slurp", "-H", "Accept: application/vnd.github+json", ...args]);
  if (!output) return null;

  const parsed = JSON.parse(output);
  if (Array.isArray(parsed) && parsed.every((item) => Array.isArray(item))) {
    return parsed.flat();
  }
  if (Array.isArray(parsed) && parsed.length === 1 && !Array.isArray(parsed[0])) {
    return parsed[0];
  }
  return parsed;
}

function getRepo() {
  return gh(["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"]);
}

function getCurrentPrNumber() {
  return Number(gh(["pr", "view", "--json", "number", "-q", ".number"]));
}

function readState(path) {
  if (!path || !existsSync(path)) {
    return { seenCommentKeys: [] };
  }

  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return {
      seenCommentKeys: Array.isArray(parsed.seenCommentKeys) ? parsed.seenCommentKeys : [],
    };
  } catch {
    return { seenCommentKeys: [] };
  }
}

function writeState(path, state) {
  if (!path) return;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(`${path}.tmp`, `${JSON.stringify(state, null, 2)}\n`);
  renameSync(`${path}.tmp`, path);
}

function normalizeAuthor(item) {
  const userLogin = item.user?.login;
  const appSlug = item.app?.slug;
  const authorAssociation = item.author_association;
  return [userLogin, appSlug, authorAssociation].filter(Boolean).join(" ");
}

function isCodexAuthored(item, authorRegex) {
  return authorRegex.test(normalizeAuthor(item));
}

function summarizeReactions(reactions, authorRegex, approvalSince) {
  const codexReactions = reactions.filter((reaction) => isCodexAuthored(reaction, authorRegex));
  const freshCodexReactions = codexReactions.filter((reaction) => {
    const createdAt = Date.parse(reaction.created_at || "");
    return Number.isFinite(createdAt) && createdAt >= approvalSince;
  });

  return {
    eyes: codexReactions.some((reaction) => reaction.content === "eyes"),
    thumbsUp: freshCodexReactions.some((reaction) => reaction.content === "+1"),
    authors: [...new Set(freshCodexReactions.map(normalizeAuthor).filter(Boolean))],
  };
}

function findLatestPushTime(events, branchName, headSha) {
  const refName = `refs/heads/${branchName}`;
  const matchingPush = events.find((event) => {
    return event.type === "PushEvent" && event.payload?.ref === refName && event.payload?.head === headSha;
  });
  const pushedAt = Date.parse(matchingPush?.created_at || "");
  return Number.isFinite(pushedAt) ? pushedAt : null;
}

function findLatestSignalTime(statuses, checkRuns) {
  const statusTimes = (statuses || []).map((status) => Date.parse(status.created_at || ""));
  const checkTimes = (checkRuns || []).map((checkRun) => Date.parse(checkRun.started_at || checkRun.created_at || ""));
  const validTimes = [...statusTimes, ...checkTimes].filter(Number.isFinite);
  return validTimes.length > 0 ? Math.min(...validTimes) : null;
}

function toCommentRecord(kind, comment) {
  return {
    key: `${kind}:${comment.id}`,
    id: comment.id,
    kind,
    author: normalizeAuthor(comment),
    url: comment.html_url || comment.pull_request_url || comment.issue_url || null,
    path: comment.path || null,
    line: comment.line || comment.original_line || null,
    state: comment.state || null,
    body: comment.body || "",
    createdAt: comment.created_at || null,
    updatedAt: comment.updated_at || null,
  };
}

function fetchReviewState({ repo, prNumber, authorRegex, watchStartedAt }) {
  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    throw new Error(`Invalid repo: ${repo}`);
  }

  const base = `/repos/${owner}/${name}`;
  const pull = ghJson([`${base}/pulls/${prNumber}`]);
  const issueComments = ghJson([`${base}/issues/${prNumber}/comments?per_page=100`]) || [];
  const reviews = ghJson([`${base}/pulls/${prNumber}/reviews?per_page=100`]) || [];
  const reviewComments = ghJson([`${base}/pulls/${prNumber}/comments?per_page=100`]) || [];
  const commits = ghJson([`${base}/pulls/${prNumber}/commits?per_page=100`]) || [];
  const events = ghJson([`${base}/events?per_page=100`]) || [];
  const reactions = ghJson([`${base}/issues/${prNumber}/reactions?per_page=100`]) || [];
  const latestCommit = commits[commits.length - 1];
  const headSha = pull?.head?.sha || latestCommit?.sha;
  const branchName = pull?.head?.ref;
  const status = headSha ? ghJson([`${base}/commits/${headSha}/status`]) : null;
  const checkRuns = headSha ? ghJson([`${base}/commits/${headSha}/check-runs?per_page=100`]) : null;
  const latestPushAt = branchName && headSha ? findLatestPushTime(events, branchName, headSha) : null;
  const latestSignalAt = findLatestSignalTime(status?.statuses, checkRuns?.check_runs);
  const approvalSince = latestPushAt || latestSignalAt || watchStartedAt;

  const reactionSummary = summarizeReactions(reactions, authorRegex, approvalSince);
  const codexComments = [
    ...issueComments.filter((comment) => isCodexAuthored(comment, authorRegex)).map((comment) => toCommentRecord("issue-comment", comment)),
    ...reviews
      .filter((review) => isCodexAuthored(review, authorRegex))
      .filter((review) => (review.body || "").trim().length > 0)
      .map((review) => toCommentRecord("pull-review", review)),
    ...reviewComments
      .filter((comment) => isCodexAuthored(comment, authorRegex))
      .map((comment) => toCommentRecord("review-comment", comment)),
  ];

  return {
    repo,
    prNumber,
    reactionSummary,
    codexComments,
    checkedAt: new Date().toISOString(),
  };
}

function classifyResult(snapshot, state) {
  const seen = new Set(state.seenCommentKeys);
  const newComments = snapshot.codexComments.filter((comment) => !seen.has(comment.key));

  if (newComments.length > 0) {
    return { status: "comments", exitCode: 2, newComments };
  }

  if (snapshot.reactionSummary.thumbsUp) {
    return { status: "approved", exitCode: 0, newComments: [] };
  }

  if (snapshot.reactionSummary.eyes) {
    return { status: "reviewing", exitCode: null, newComments: [] };
  }

  return { status: "pending", exitCode: null, newComments: [] };
}

function markSeen(state, comments) {
  return {
    ...state,
    seenCommentKeys: [...new Set([...state.seenCommentKeys, ...comments.map((comment) => comment.key)])],
  };
}

function printResult(result, snapshot, json) {
  const payload = {
    status: result.status,
    repo: snapshot.repo,
    prNumber: snapshot.prNumber,
    checkedAt: snapshot.checkedAt,
    reactions: snapshot.reactionSummary,
    comments: result.newComments,
  };

  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  if (result.status === "approved") {
    console.log(`Codex Review completed for ${snapshot.repo}#${snapshot.prNumber}: thumbs-up reaction found.`);
    return;
  }

  if (result.status === "comments") {
    console.log(`Codex Review comments found for ${snapshot.repo}#${snapshot.prNumber}:\n`);
    for (const comment of result.newComments) {
      const location = comment.path ? `${comment.path}${comment.line ? `:${comment.line}` : ""}` : comment.kind;
      console.log(`- ${location}`);
      if (comment.url) console.log(`  URL: ${comment.url}`);
      console.log(`  Author: ${comment.author || "unknown"}`);
      console.log("");
      console.log(comment.body.trim() || "(empty comment)");
      console.log("\n---\n");
    }
    return;
  }

  console.log(`Codex Review ${result.status} for ${snapshot.repo}#${snapshot.prNumber}.`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return 0;
  }

  const repo = options.repo || getRepo();
  const prNumber = options.prNumber || getCurrentPrNumber();
  const statePath = options.statePath || `tmp/codex-review-watch/pr-${prNumber}.json`;
  const authorRegex = new RegExp(options.authorPattern, "i");
  let state = readState(statePath);
  const startedAt = Date.now();

  while (true) {
    const snapshot = fetchReviewState({ repo, prNumber, authorRegex, watchStartedAt: startedAt });
    const result = classifyResult(snapshot, state);

    if (result.status === "comments") {
      state = markSeen(state, result.newComments);
      writeState(statePath, state);
      printResult(result, snapshot, options.json);
      return result.exitCode;
    }

    if (result.status === "approved") {
      writeState(statePath, state);
      printResult(result, snapshot, options.json);
      return result.exitCode;
    }

    if (options.once) {
      printResult(result, snapshot, options.json);
      return 1;
    }

    if (Date.now() - startedAt > options.timeoutSeconds * 1000) {
      printResult({ ...result, status: "timeout", newComments: [] }, snapshot, options.json);
      return 3;
    }

    if (!options.json) {
      console.error(`Codex Review ${result.status}; checking again in ${options.intervalSeconds}s...`);
    }
    await sleep(options.intervalSeconds * 1000);
  }
}

main()
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error) => {
    const message = error.stderr?.toString?.() || error.message || String(error);
    console.error(`Failed to watch Codex Review: ${message.trim()}`);
    process.exitCode = 4;
  });
