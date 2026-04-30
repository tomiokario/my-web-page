import { PublicationMasterFields } from "../types/publicationMaster";
import { ContributorSlot, FieldPresence } from "./researchmapImportTypes";

const importedFieldPresence = new WeakMap<PublicationMasterFields, FieldPresence>();
const importedContributorSlots = new WeakMap<PublicationMasterFields, ContributorSlot[]>();

export function rememberImportedFieldMetadata(
  fields: PublicationMasterFields,
  presence: FieldPresence,
  contributorSlots: ContributorSlot[] | undefined
): void {
  importedFieldPresence.set(fields, presence);
  if (contributorSlots) {
    importedContributorSlots.set(fields, contributorSlots);
  }
}

export function getImportedFieldPresence(fields: PublicationMasterFields): FieldPresence {
  return importedFieldPresence.get(fields) || new Set<string>();
}

export function getImportedContributorSlots(
  fields: PublicationMasterFields
): ContributorSlot[] | undefined {
  return importedContributorSlots.get(fields);
}
