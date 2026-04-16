import * as fs from "fs";
import * as http from "http";
import * as path from "path";

import {
  readPublicationMasterFile,
  writePublicationArtifacts,
} from "../src/utils/publicationMasterFile";

const HOST = "127.0.0.1";
const PORT = Number(process.env.PUBLICATIONS_EDITOR_PORT || "4318");
const STATIC_DIR = path.join(__dirname, "../tools/publications-editor");
const ARTIFACT_PATHS = {
  masterJsonFilePath: path.join(__dirname, "../src/data/publication_master.json"),
  webJsonFilePath: path.join(__dirname, "../src/data/publications.json"),
};

const STATIC_FILES: Record<string, { filePath: string; contentType: string }> = {
  "/": {
    filePath: path.join(STATIC_DIR, "index.html"),
    contentType: "text/html; charset=utf-8",
  },
  "/app.js": {
    filePath: path.join(STATIC_DIR, "app.js"),
    contentType: "text/javascript; charset=utf-8",
  },
  "/styles.css": {
    filePath: path.join(STATIC_DIR, "styles.css"),
    contentType: "text/css; charset=utf-8",
  },
};

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", `http://${HOST}:${PORT}`);

    if (request.method === "GET" && requestUrl.pathname === "/api/publications/master") {
      const records = readPublicationMasterFile(ARTIFACT_PATHS.masterJsonFilePath);
      sendJson(response, 200, {
        records,
        masterJsonPath: ARTIFACT_PATHS.masterJsonFilePath,
        webJsonPath: ARTIFACT_PATHS.webJsonFilePath,
      });
      return;
    }

    if (request.method === "PUT" && requestUrl.pathname === "/api/publications/master") {
      const requestBody = await readRequestBody(request);
      const parsedBody = JSON.parse(requestBody) as { records?: unknown } | unknown;
      const records =
        typeof parsedBody === "object" &&
        parsedBody !== null &&
        !Array.isArray(parsedBody) &&
        "records" in parsedBody
          ? (parsedBody as { records?: unknown }).records
          : parsedBody;
      const webPublications = writePublicationArtifacts(
        records,
        ARTIFACT_PATHS
      );

      sendJson(response, 200, {
        saved: true,
        recordCount: Array.isArray(records) ? records.length : 0,
        webRecordCount: webPublications.length,
      });
      return;
    }

    if (request.method === "GET" && STATIC_FILES[requestUrl.pathname]) {
      const asset = STATIC_FILES[requestUrl.pathname];
      response.writeHead(200, {
        "Content-Type": asset.contentType,
        "Cache-Control": "no-store",
      });
      response.end(fs.readFileSync(asset.filePath));
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendJson(response, 500, { error: message });
  }
});

server.listen(PORT, HOST, () => {
  console.log("Publication editor bridge is running.");
  console.log(`Open http://${HOST}:${PORT} in your browser.`);
  console.log(`Master JSON: ${ARTIFACT_PATHS.masterJsonFilePath}`);
  console.log(`Web JSON: ${ARTIFACT_PATHS.webJsonFilePath}`);
});

process.on("SIGINT", () => {
  server.close(() => {
    process.exit(0);
  });
});

function readRequestBody(request: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    request.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    request.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    request.on("error", reject);
  });
}

function sendJson(
  response: http.ServerResponse,
  statusCode: number,
  payload: Record<string, unknown>
): void {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}
