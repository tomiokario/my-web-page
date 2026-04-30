import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

import { ImportHistoryFile } from "./researchmapImportTypes";

export interface JsonlLineEntry {
  line: string;
  lineNumber: number;
}

export function splitJsonlContent(inputContent: string): JsonlLineEntry[] {
  return inputContent
    .split(/\r?\n/)
    .map((line, lineIndex) => ({
      line: line.trim(),
      lineNumber: lineIndex + 1,
    }))
    .filter((entry) => entry.line.length > 0);
}

export function hashContent(inputContent: string): string {
  return crypto.createHash("sha256").update(inputContent).digest("hex");
}

export function hashJsonlLine(line: string): string {
  return crypto.createHash("sha256").update(line).digest("hex");
}

export function archiveImportedFile(
  sourcePath: string,
  archiveDirPath: string,
  fileHash: string,
  importedAt: string
): string {
  fs.mkdirSync(archiveDirPath, { recursive: true });
  const sourceExt = path.extname(sourcePath) || ".jsonl";
  const sourceBaseName = path.basename(sourcePath, sourceExt);
  const timestamp = importedAt.replace(/[:.]/g, "-");
  const archivedPath = path.join(
    archiveDirPath,
    `${sourceBaseName}-${timestamp}-${fileHash.slice(0, 8)}${sourceExt}`
  );

  try {
    fs.renameSync(sourcePath, archivedPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EXDEV") {
      throw error;
    }

    fs.copyFileSync(sourcePath, archivedPath);
    fs.unlinkSync(sourcePath);
  }

  return archivedPath;
}

export function readImportHistory(historyFilePath: string): ImportHistoryFile {
  if (!fs.existsSync(historyFilePath)) {
    return {
      version: 1,
      entries: [],
    };
  }

  const parsed = JSON.parse(fs.readFileSync(historyFilePath, "utf8")) as ImportHistoryFile;
  return {
    version: 1,
    entries: Array.isArray(parsed.entries) ? parsed.entries : [],
  };
}

export function writeImportHistory(historyFilePath: string, history: ImportHistoryFile): void {
  fs.mkdirSync(path.dirname(historyFilePath), { recursive: true });
  fs.writeFileSync(historyFilePath, `${JSON.stringify(history, null, 2)}\n`, "utf8");
}
