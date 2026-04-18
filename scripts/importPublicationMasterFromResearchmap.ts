import * as fs from "fs";
import * as path from "path";

import { importPublicationMasterFromResearchmap } from "../src/utils/researchmapImport";

interface CliOptions {
  inputFilePath: string;
  dryRun: boolean;
  archiveDirPath?: string;
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const masterJsonFilePath = path.join(__dirname, "../src/data/publication_master.json");
    const webJsonFilePath = path.join(__dirname, "../src/data/publications.json");

    if (!fs.existsSync(options.inputFilePath)) {
      throw new Error(`入力ファイルが見つかりません: ${options.inputFilePath}`);
    }

    const report = importPublicationMasterFromResearchmap(
      options.inputFilePath,
      {
        masterJsonFilePath,
        webJsonFilePath,
      },
      {
        dryRun: options.dryRun,
        archiveDirPath: options.archiveDirPath,
      }
    );

    console.log(JSON.stringify(report, null, 2));

    if (report.summary.ambiguous > 0 || report.summary.invalid > 0) {
      process.exit(2);
    }

    process.exit(0);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function parseArgs(args: string[]): CliOptions {
  let inputFilePath = "";
  let dryRun = false;
  let archiveDirPath: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--input") {
      inputFilePath = args[index + 1] || "";
      index += 1;
      continue;
    }

    if (arg === "--archive-dir") {
      archiveDirPath = args[index + 1] || "";
      index += 1;
      continue;
    }

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
  }

  if (!inputFilePath) {
    throw new Error(
      "使用方法: npm run import-publications-researchmap -- --input <path-to-rm_jsonl> [--dry-run] [--archive-dir <dir>]"
    );
  }

  return {
    inputFilePath: path.resolve(inputFilePath),
    dryRun,
    archiveDirPath: archiveDirPath ? path.resolve(archiveDirPath) : undefined,
  };
}

main();
