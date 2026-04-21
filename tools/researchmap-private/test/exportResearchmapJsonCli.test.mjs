import fs from 'fs';
import os from 'os';
import path from 'path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(packageRoot, 'scripts/exportResearchmapJson.mjs');

test('CLI rejects non-master JSON inputs even when extension is .json', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'researchmap-export-cli-'));
  const invalidJsonPath = path.join(tempDir, 'publications.json');

  try {
    fs.writeFileSync(
      invalidJsonPath,
      JSON.stringify([{ year: 2025, title: 'wrong-shape' }], null, 2),
      'utf8'
    );

    const result = spawnSync('node', [scriptPath, '--input', invalidJsonPath], {
      cwd: packageRoot,
      encoding: 'utf8',
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /publication_master\.json/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('CLI accepts publication_master.json input with master record schema', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'researchmap-export-cli-valid-'));
  const masterPath = path.join(tempDir, 'publication_master.json');
  const outputDir = path.join(tempDir, 'out');

  try {
    fs.writeFileSync(
      masterPath,
      JSON.stringify(
        [
          {
            id: 'pub-2025-valid-master',
            fields: {
              type: 'published_papers',
              subtype: 'scientific_journal',
              title: {
                en: 'Valid Master Input',
              },
              contributors: [
                {
                  role: 'author',
                  name: {
                    en: 'Rio Tomioka',
                  },
                },
              ],
              dates: {
                published: '2025-01-01',
              },
            },
            localMeta: {
              hasEmptyFields: false,
              notes: 'cli-sidecar-note',
            },
            sync: {},
          },
        ],
        null,
        2
      ),
      'utf8'
    );

    const result = spawnSync(
      'node',
      [scriptPath, '--input', masterPath, '--output-dir', outputDir, '--researchmap-user-id', 'R123456789'],
      {
        cwd: packageRoot,
        encoding: 'utf8',
      }
    );

    assert.equal(result.status, 0);
    assert.ok(fs.existsSync(path.join(outputDir, 'import.jsonl')));
    const reversibleExport = JSON.parse(fs.readFileSync(path.join(outputDir, 'reversible-export.json'), 'utf8'));
    assert.doesNotMatch(reversibleExport.rows[0].rawLine, /"notes":\s*"cli-sidecar-note"/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('CLI removes stale merge artifacts when rerun without --existing-jsonl', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'researchmap-export-cli-cleanup-'));
  const masterPath = path.join(tempDir, 'publication_master.json');
  const outputDir = path.join(tempDir, 'out');
  const existingJsonlPath = path.join(tempDir, 'existing.jsonl');

  try {
    fs.writeFileSync(
      masterPath,
      JSON.stringify(
        [
          {
            id: 'pub-2025-valid-master',
            fields: {
              type: 'published_papers',
              subtype: 'scientific_journal',
              title: {
                en: 'Valid Master Input',
              },
              contributors: [
                {
                  role: 'author',
                  name: {
                    en: 'Aki Example',
                  },
                },
              ],
              dates: {
                published: '2025-01-01',
              },
            },
            localMeta: {
              hasEmptyFields: false,
              notes: '',
            },
            sync: {},
          },
        ],
        null,
        2
      ),
      'utf8'
    );
    fs.writeFileSync(
      existingJsonlPath,
      [
        JSON.stringify({
          insert: { type: 'researchers', id: 'R123456789' },
          merge: { permalink: 'sample-researcher' },
        }),
      ].join('\n'),
      'utf8'
    );

    const firstRun = spawnSync(
      'node',
      [
        scriptPath,
        '--input',
        masterPath,
        '--output-dir',
        outputDir,
        '--researchmap-user-id',
        'R123456789',
        '--existing-jsonl',
        existingJsonlPath,
      ],
      {
        cwd: packageRoot,
        encoding: 'utf8',
      }
    );
    assert.equal(firstRun.status, 0);
    assert.ok(fs.existsSync(path.join(outputDir, 'merge-review.json')));
    assert.ok(fs.existsSync(path.join(outputDir, 'quarantine.jsonl')));

    const secondRun = spawnSync(
      'node',
      [scriptPath, '--input', masterPath, '--output-dir', outputDir, '--researchmap-user-id', 'R123456789'],
      {
        cwd: packageRoot,
        encoding: 'utf8',
      }
    );

    assert.equal(secondRun.status, 0);
    assert.equal(fs.existsSync(path.join(outputDir, 'merge-review.json')), false);
    assert.equal(fs.existsSync(path.join(outputDir, 'quarantine.jsonl')), false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
