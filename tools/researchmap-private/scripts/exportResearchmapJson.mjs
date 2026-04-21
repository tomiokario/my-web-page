import fs from 'fs';
import path from 'path';
import { loadMasterPublications } from '../src/masterToPublications.mjs';
import { generateResearchmapExport } from '../src/researchmapExport.mjs';
import { mergeWithExistingResearchmapExport } from '../src/researchmapMerge.mjs';
import { buildReversibleExport } from '../src/researchmapReversibleExport.mjs';

function parseArgs(argv) {
  const options = {
    input: '',
    outputDir: path.resolve('tmp/researchmap'),
    researchmapUserId: undefined,
    existingJsonl: undefined,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];
    if (current === '--input' && next) {
      options.input = path.resolve(next);
      index += 1;
    } else if (current === '--output-dir' && next) {
      options.outputDir = path.resolve(next);
      index += 1;
    } else if (current === '--researchmap-user-id' && next) {
      options.researchmapUserId = next.trim();
      index += 1;
    } else if (current === '--existing-jsonl' && next) {
      options.existingJsonl = path.resolve(next);
      index += 1;
    }
  }
  return options;
}

const options = parseArgs(process.argv.slice(2));
if (!options.input) {
  console.error('エラー: --input で publication_master.json のパスを指定してください');
  process.exit(1);
}
if (!fs.existsSync(options.input)) {
  console.error(`エラー: 入力ファイル ${options.input} が見つかりません`);
  process.exit(1);
}
if (!options.input.endsWith('.json')) {
  console.error('エラー: researchmap export の正規入力は publication_master.json のみです');
  process.exit(1);
}
try {
  validateMasterInput(options.input);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
if (options.existingJsonl && !fs.existsSync(options.existingJsonl)) {
  console.error(`エラー: 既存JSONL ${options.existingJsonl} が見つかりません`);
  process.exit(1);
}

const sourceMetadata = loadMasterPublications(options.input);
const publications = sourceMetadata.publications;
const result = generateResearchmapExport(sourceMetadata.records, { researchmapUserId: options.researchmapUserId });
let importLines = result.importLines;
let quarantineLines = [];
let mergeReview = undefined;
let reversibleLines = result.importLines;

if (options.existingJsonl) {
  const existingRecords = fs
    .readFileSync(options.existingJsonl, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const merged = mergeWithExistingResearchmapExport(existingRecords, result.importLines);
  importLines = merged.mergedLines;
  quarantineLines = merged.quarantineLines;
  mergeReview = merged.mergeReview;
  reversibleLines = merged.reversibleLines;
}

fs.mkdirSync(options.outputDir, { recursive: true });
const importPath = path.join(options.outputDir, 'import.jsonl');
const quarantinePath = path.join(options.outputDir, 'quarantine.jsonl');
const reviewPath = path.join(options.outputDir, 'manual-review.json');
const summaryPath = path.join(options.outputDir, 'summary.json');
const mergeReviewPath = path.join(options.outputDir, 'merge-review.json');
const reversiblePath = path.join(options.outputDir, 'reversible-export.json');

fs.writeFileSync(importPath, `${importLines.join('\n')}\n`, 'utf8');
fs.writeFileSync(reviewPath, JSON.stringify(result.manualReviewItems, null, 2), 'utf8');
if (mergeReview) {
  fs.writeFileSync(
    quarantinePath,
    quarantineLines.length > 0 ? `${quarantineLines.join('\n')}\n` : '',
    'utf8'
  );
  fs.writeFileSync(mergeReviewPath, JSON.stringify(mergeReview, null, 2), 'utf8');
} else {
  removeIfExists(quarantinePath);
  removeIfExists(mergeReviewPath);
}
fs.writeFileSync(
  reversiblePath,
  JSON.stringify(buildReversibleExport(publications, reversibleLines, sourceMetadata), null, 2),
  'utf8'
);
fs.writeFileSync(
  summaryPath,
  JSON.stringify(
    {
      totalPublications: publications.length,
      generatedLines: importLines.length,
      quarantinedLines: quarantineLines.length,
      manualReviewCount: result.manualReviewItems.length,
      researchmapUserId: options.researchmapUserId || '__RESEARCHMAP_USER_ID__',
      mergedWithExistingJsonl: Boolean(options.existingJsonl),
      existingJsonlPath: options.existingJsonl || null,
    },
    null,
    2
  ),
  'utf8'
);

console.log(`researchmap 用 JSONL を生成しました: ${importPath}`);
console.log(`要確認項目を出力しました: ${reviewPath}`);
if (mergeReview) {
  console.log(`既存 researchmap エクスポートとのマージ結果を出力しました: ${mergeReviewPath}`);
  console.log(`review / quarantine 行を出力しました: ${quarantinePath}`);
}
console.log(`可逆復元用データを出力しました: ${reversiblePath}`);
console.log(`サマリーを出力しました: ${summaryPath}`);

function validateMasterInput(inputPath) {
  if (path.basename(inputPath) !== 'publication_master.json') {
    throw new Error('エラー: researchmap export の正規入力ファイル名は publication_master.json です');
  }

  const parsed = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  if (!Array.isArray(parsed)) {
    throw new Error('エラー: publication_master.json は配列である必要があります');
  }

  const hasInvalidRecord = parsed.some((record) => {
    return (
      !record ||
      typeof record !== 'object' ||
      typeof record.id !== 'string' ||
      !record.fields
    );
  });

  if (hasInvalidRecord) {
    throw new Error(
      'エラー: publication_master.json には id と canonical fields を持つ record が必要です'
    );
  }
}

function removeIfExists(targetPath) {
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
  }
}
