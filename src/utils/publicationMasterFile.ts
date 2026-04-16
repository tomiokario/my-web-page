import * as fs from "fs";

import {
  csvRowsToPublicationMaster,
  parseCsvContent,
  publicationMasterToWebPublications,
} from "./publicationMaster";
import { Publication } from "../types";
import { PublicationMasterRecord } from "../types/publicationMaster";

export function csvToPublicationMaster(csvFilePath: string): PublicationMasterRecord[] {
  const csvData = fs.readFileSync(csvFilePath, "utf8");
  return csvRowsToPublicationMaster(parseCsvContent(csvData));
}

export function publicationMasterToJson(publications: PublicationMasterRecord[]): string {
  return JSON.stringify(publications, null, 2);
}

export function publicationWebDataToJson(publications: Publication[]): string {
  return JSON.stringify(publications, null, 2);
}

export function publicationMasterFileToWebPublications(csvFilePath: string): Publication[] {
  return publicationMasterToWebPublications(csvToPublicationMaster(csvFilePath));
}
