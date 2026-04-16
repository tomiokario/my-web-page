import React, {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Badge,
  Button,
  Checkbox,
  Divider,
  Group,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  UnstyledButton,
} from "@mantine/core";

import publicationMasterData from "../data/publication_master.json";
import { useLanguage } from "../contexts/LanguageContext";
import locales from "../locales";
import {
  LocalizedLanguage,
  LocalizedPeople,
  LocalizedText,
  PublicationMasterRecord,
  PublicationMasterResearchmapFields,
} from "../types/publicationMaster";
import {
  getLocalizedTextValue,
  getPublicationTitle,
  getPublicationVenueText,
  stringifyPeople,
} from "../utils/publicationMaster";

type LocalFileHandle = {
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<{
    write: (contents: string) => Promise<void>;
    close: () => Promise<void>;
  }>;
};

type PickerWindow = Window & {
  showOpenFilePicker?: (options?: unknown) => Promise<LocalFileHandle[]>;
};

const INITIAL_RECORDS = publicationMasterData as PublicationMasterRecord[];

function PublicationAdmin() {
  const { language } = useLanguage();
  const messages = locales[language] ?? locales.en;

  const [records, setRecords] = useState<PublicationMasterRecord[]>(() => cloneRecords(INITIAL_RECORDS));
  const [selectedId, setSelectedId] = useState<string>(INITIAL_RECORDS[0]?.id ?? "");
  const [draft, setDraft] = useState<PublicationMasterRecord | null>(() =>
    INITIAL_RECORDS[0] ? cloneRecord(INITIAL_RECORDS[0]) : null
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [fileHandle, setFileHandle] = useState<LocalFileHandle | null>(null);
  const [fileName, setFileName] = useState("");

  const deferredSearch = useDeferredValue(search);
  const canUseFileSystemAccess = typeof window !== "undefined" &&
    Boolean((window as PickerWindow).showOpenFilePicker);

  const filteredRecords = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    if (!query) {
      return records;
    }

    return records.filter((record) => {
      const title = getPublicationTitle(record.researchmapFields);
      const haystack = [
        record.id,
        getLocalizedTextValue(title, "en"),
        getLocalizedTextValue(title, "ja"),
        getPublicationVenueText(record.researchmapFields),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [deferredSearch, records]);

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedId) ?? null,
    [records, selectedId]
  );
  const isDirty =
    Boolean(draft && selectedRecord) &&
    JSON.stringify(draft) !== JSON.stringify(selectedRecord);
  const titleFieldKey =
    draft?.researchmapFields.type === "presentations" ? "presentation_title" : "paper_title";
  const peopleFieldKey =
    draft?.researchmapFields.type === "presentations" ? "presenters" : "authors";
  const venueFieldKey =
    draft?.researchmapFields.type === "presentations" ? "event" : "publication_name";

  useEffect(() => {
    if (!filteredRecords.some((record) => record.id === selectedId) && filteredRecords[0]) {
      startTransition(() => {
        setSelectedId(filteredRecords[0].id);
      });
    }
  }, [filteredRecords, selectedId]);

  useEffect(() => {
    if (!selectedRecord) {
      setDraft(null);
      return;
    }

    setDraft(cloneRecord(selectedRecord));
  }, [selectedRecord]);

  const handleOpenFile = async () => {
    const picker = (window as PickerWindow).showOpenFilePicker;

    if (!picker) {
      setStatus(messages.publicationAdmin.unsupported);
      return;
    }

    try {
      const [handle] = await picker({
        multiple: false,
        types: [
          {
            description: "JSON",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
      });
      const file = await handle.getFile();
      const nextRecords = JSON.parse(await file.text()) as PublicationMasterRecord[];

      if (!Array.isArray(nextRecords)) {
        throw new Error("Invalid publication master data.");
      }

      setFileHandle(handle);
      setFileName(file.name);
      setRecords(cloneRecords(nextRecords));
      startTransition(() => {
        setSelectedId(nextRecords[0]?.id ?? "");
      });
      setStatus(messages.publicationAdmin.openSuccess);
    } catch (error) {
      console.error(error);
      setStatus(messages.publicationAdmin.openError);
    }
  };

  const handleSave = async () => {
    if (!draft || !fileHandle) {
      return;
    }

    try {
      const nextRecords = records.map((record) =>
        record.id === draft.id ? cloneRecord(draft) : record
      );
      const writable = await fileHandle.createWritable();

      await writable.write(`${JSON.stringify(nextRecords, null, 2)}\n`);
      await writable.close();

      setRecords(nextRecords);
      setStatus(messages.publicationAdmin.saveSuccess);
    } catch (error) {
      console.error(error);
      setStatus(messages.publicationAdmin.saveError);
    }
  };

  const updateDraft = (updater: (record: PublicationMasterRecord) => void) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const next = cloneRecord(current);
      updater(next);
      return next;
    });
  };

  return (
    <Stack gap="lg">
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2}>{messages.publicationAdmin.title}</Title>
            <Text size="sm" c="dimmed">
              {messages.publicationAdmin.description}
            </Text>
            <Text size="sm" c="dimmed">
              {messages.publicationAdmin.localOnly}
            </Text>
          </div>
          <Group>
            <Button onClick={handleOpenFile} variant="light" disabled={!canUseFileSystemAccess}>
              {messages.publicationAdmin.openFile}
            </Button>
            <Button onClick={handleSave} disabled={!fileHandle || !draft || !isDirty}>
              {messages.publicationAdmin.save}
            </Button>
          </Group>
        </Group>

        <Text size="sm">
          <strong>{messages.publicationAdmin.selectedFile}:</strong>{" "}
          {fileName || messages.publicationAdmin.openFileHint}
        </Text>
        {!fileHandle && (
          <Text size="sm" c="dimmed">
            {messages.publicationAdmin.saveDisabled}
          </Text>
        )}
        {!canUseFileSystemAccess && (
          <Text size="sm" c="red">
            {messages.publicationAdmin.unsupported}
          </Text>
        )}
        {status && (
          <Text size="sm" c="dimmed">
            {status}
          </Text>
        )}
        <Text size="sm" c="dimmed">
          {messages.publicationAdmin.regenHint}
        </Text>
      </Stack>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 360px) minmax(0, 1fr)",
          gap: "1rem",
          alignItems: "start",
        }}
      >
        <Paper withBorder radius="md" p="md">
          <Stack gap="md">
            <div>
              <Title order={4}>{messages.publicationAdmin.listTitle}</Title>
              <TextInput
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder={messages.publicationAdmin.search}
                mt="sm"
              />
            </div>

            <ScrollArea h={720} type="always">
              <Stack gap="xs">
                {filteredRecords.map((record) => {
                  const title = getPublicationTitle(record.researchmapFields);
                  const venue = getPublicationVenueText(record.researchmapFields);
                  const isSelected = record.id === selectedId;

                  return (
                    <UnstyledButton
                      key={record.id}
                      onClick={() =>
                        startTransition(() => {
                          setSelectedId(record.id);
                        })
                      }
                      style={{
                        border: isSelected ? "1px solid #228be6" : "1px solid #dee2e6",
                        borderRadius: "0.75rem",
                        padding: "0.9rem",
                        textAlign: "left",
                        background: isSelected ? "#eef7ff" : "#ffffff",
                      }}
                    >
                      <Stack gap={6}>
                        <Group justify="space-between" align="flex-start" wrap="nowrap">
                          <Text fw={600} size="sm">
                            {getLocalizedTextValue(title, language)}
                          </Text>
                          <Badge variant="light" color="gray">
                            {record.researchmapFields.type}
                          </Badge>
                        </Group>
                        {venue && (
                          <Text size="xs" c="dimmed">
                            {venue}
                          </Text>
                        )}
                        <Text size="xs" c="dimmed">
                          {record.id}
                        </Text>
                      </Stack>
                    </UnstyledButton>
                  );
                })}
                {filteredRecords.length === 0 && (
                  <Text size="sm" c="dimmed">
                    {messages.publicationAdmin.noResults}
                  </Text>
                )}
              </Stack>
            </ScrollArea>
          </Stack>
        </Paper>

        <Paper withBorder radius="md" p="md">
          {!draft && (
            <Text size="sm" c="dimmed">
              {messages.publicationAdmin.noSelection}
            </Text>
          )}

          {draft && (
            <Stack gap="md">
              <div>
                <Title order={4}>{messages.publicationAdmin.editTitle}</Title>
                <Text size="sm" c="dimmed">
                  {draft.id}
                </Text>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "1rem",
                }}
              >
                <Select
                  label="researchmapFields.type"
                  data={[
                    { value: "published_papers", label: "published_papers" },
                    { value: "presentations", label: "presentations" },
                    { value: "misc", label: "misc" },
                  ]}
                  value={draft.researchmapFields.type}
                  onChange={(value) => {
                    if (!value) {
                      return;
                    }

                    updateDraft((next) => {
                      next.researchmapFields = switchResearchmapType(
                        next.researchmapFields,
                        value as PublicationMasterResearchmapFields["type"]
                      );
                    });
                  }}
                />
                <TextInput
                  label="researchmapFields.subtype"
                  value={draft.researchmapFields.subtype || ""}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.researchmapFields.subtype = emptyToUndefined(event.currentTarget.value);
                    })
                  }
                />
                <TextInput
                  label="researchmapFields.publication_date"
                  value={draft.researchmapFields.publication_date || ""}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.researchmapFields.publication_date = emptyToUndefined(
                        event.currentTarget.value
                      );
                    })
                  }
                />
                <TextInput
                  label="researchmapFields.from_event_date"
                  value={draft.researchmapFields.from_event_date || ""}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.researchmapFields.from_event_date = emptyToUndefined(
                        event.currentTarget.value
                      );
                    })
                  }
                />
                <TextInput
                  label="researchmapFields.to_event_date"
                  value={draft.researchmapFields.to_event_date || ""}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.researchmapFields.to_event_date = emptyToUndefined(
                        event.currentTarget.value
                      );
                    })
                  }
                />
                <TextInput
                  label="researchmapFields.presentation_type"
                  value={draft.researchmapFields.presentation_type || ""}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.researchmapFields.presentation_type = emptyToUndefined(
                        event.currentTarget.value
                      );
                    })
                  }
                />
                <TextInput
                  label="researchmapFields.volume"
                  value={draft.researchmapFields.volume || ""}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.researchmapFields.volume = emptyToUndefined(event.currentTarget.value);
                    })
                  }
                />
                <TextInput
                  label="researchmapFields.number"
                  value={draft.researchmapFields.number || ""}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.researchmapFields.number = emptyToUndefined(event.currentTarget.value);
                    })
                  }
                />
                <TextInput
                  label="researchmapFields.starting_page"
                  value={draft.researchmapFields.starting_page || ""}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.researchmapFields.starting_page = emptyToUndefined(
                        event.currentTarget.value
                      );
                    })
                  }
                />
                <TextInput
                  label="researchmapFields.ending_page"
                  value={draft.researchmapFields.ending_page || ""}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.researchmapFields.ending_page = emptyToUndefined(
                        event.currentTarget.value
                      );
                    })
                  }
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "1rem",
                }}
              >
                <TextInput
                  label={`researchmapFields.${titleFieldKey}.ja`}
                  value={getLocalizedTextValue(draft.researchmapFields[titleFieldKey], "ja")}
                  onChange={(event) =>
                    updateDraft((next) => {
                      setLocalizedValue(
                        next.researchmapFields,
                        titleFieldKey,
                        "ja",
                        event.currentTarget.value
                      );
                    })
                  }
                />
                <TextInput
                  label={`researchmapFields.${titleFieldKey}.en`}
                  value={getLocalizedTextValue(draft.researchmapFields[titleFieldKey], "en")}
                  onChange={(event) =>
                    updateDraft((next) => {
                      setLocalizedValue(
                        next.researchmapFields,
                        titleFieldKey,
                        "en",
                        event.currentTarget.value
                      );
                    })
                  }
                />
                <Textarea
                  label={`researchmapFields.${peopleFieldKey}.ja`}
                  value={stringifyPeople(draft.researchmapFields[peopleFieldKey], "ja")}
                  minRows={4}
                  onChange={(event) =>
                    updateDraft((next) => {
                      setPeopleValue(
                        next.researchmapFields,
                        peopleFieldKey,
                        "ja",
                        event.currentTarget.value
                      );
                    })
                  }
                />
                <Textarea
                  label={`researchmapFields.${peopleFieldKey}.en`}
                  value={stringifyPeople(draft.researchmapFields[peopleFieldKey], "en")}
                  minRows={4}
                  onChange={(event) =>
                    updateDraft((next) => {
                      setPeopleValue(
                        next.researchmapFields,
                        peopleFieldKey,
                        "en",
                        event.currentTarget.value
                      );
                    })
                  }
                />
                <TextInput
                  label={`researchmapFields.${venueFieldKey}.ja`}
                  value={getLocalizedTextValue(draft.researchmapFields[venueFieldKey], "ja")}
                  onChange={(event) =>
                    updateDraft((next) => {
                      setLocalizedValue(
                        next.researchmapFields,
                        venueFieldKey,
                        "ja",
                        event.currentTarget.value
                      );
                    })
                  }
                />
                <TextInput
                  label={`researchmapFields.${venueFieldKey}.en`}
                  value={getLocalizedTextValue(draft.researchmapFields[venueFieldKey], "en")}
                  onChange={(event) =>
                    updateDraft((next) => {
                      setLocalizedValue(
                        next.researchmapFields,
                        venueFieldKey,
                        "en",
                        event.currentTarget.value
                      );
                    })
                  }
                />
                <TextInput
                  label="researchmapFields.location.ja"
                  value={getLocalizedTextValue(draft.researchmapFields.location, "ja")}
                  onChange={(event) =>
                    updateDraft((next) => {
                      setLocalizedValue(
                        next.researchmapFields,
                        "location",
                        "ja",
                        event.currentTarget.value
                      );
                    })
                  }
                />
                <TextInput
                  label="researchmapFields.location.en"
                  value={getLocalizedTextValue(draft.researchmapFields.location, "en")}
                  onChange={(event) =>
                    updateDraft((next) => {
                      setLocalizedValue(
                        next.researchmapFields,
                        "location",
                        "en",
                        event.currentTarget.value
                      );
                    })
                  }
                />
                <TextInput
                  label="researchmapFields.identifiers.doi[0]"
                  value={draft.researchmapFields.identifiers?.doi?.[0] || ""}
                  onChange={(event) =>
                    updateDraft((next) => {
                      setSingleDoi(next.researchmapFields, event.currentTarget.value);
                    })
                  }
                />
                <TextInput
                  label='researchmapFields.see_also[0]["@id"]'
                  value={draft.researchmapFields.see_also?.[0]?.["@id"] || ""}
                  onChange={(event) =>
                    updateDraft((next) => {
                      setPrimaryLink(next.researchmapFields, event.currentTarget.value);
                    })
                  }
                />
              </div>

              <Group>
                <Checkbox
                  label="researchmapFields.referee"
                  checked={Boolean(draft.researchmapFields.referee)}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.researchmapFields.referee = event.currentTarget.checked;
                    })
                  }
                />
                <Checkbox
                  label="researchmapFields.invited"
                  checked={Boolean(draft.researchmapFields.invited)}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.researchmapFields.invited = event.currentTarget.checked;
                    })
                  }
                />
                <Checkbox
                  label="localMeta.hasEmptyFields"
                  checked={draft.localMeta.hasEmptyFields}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.localMeta.hasEmptyFields = event.currentTarget.checked;
                    })
                  }
                />
              </Group>

              <Textarea
                label="researchmapFields.description.ja"
                value={getLocalizedTextValue(draft.researchmapFields.description, "ja")}
                minRows={3}
                onChange={(event) =>
                  updateDraft((next) => {
                    setLocalizedValue(
                      next.researchmapFields,
                      "description",
                      "ja",
                      event.currentTarget.value
                    );
                  })
                }
              />
              <Textarea
                label="researchmapFields.description.en"
                value={getLocalizedTextValue(draft.researchmapFields.description, "en")}
                minRows={4}
                onChange={(event) =>
                  updateDraft((next) => {
                    setLocalizedValue(
                      next.researchmapFields,
                      "description",
                      "en",
                      event.currentTarget.value
                    );
                  })
                }
              />

              <Divider />

              <div>
                <Title order={5}>{messages.publicationAdmin.rawCitation}</Title>
              </div>
              <Textarea
                label="localMeta.rawCitation.ja"
                value={getLocalizedTextValue(draft.localMeta.rawCitation, "ja")}
                minRows={3}
                onChange={(event) =>
                  updateDraft((next) => {
                    setLocalizedMetaValue(next.localMeta.rawCitation, "ja", event.currentTarget.value);
                  })
                }
              />
              <Textarea
                label="localMeta.rawCitation.en"
                value={getLocalizedTextValue(draft.localMeta.rawCitation, "en")}
                minRows={4}
                onChange={(event) =>
                  updateDraft((next) => {
                    setLocalizedMetaValue(next.localMeta.rawCitation, "en", event.currentTarget.value);
                  })
                }
              />
              <Textarea
                label="localMeta.notes"
                value={draft.localMeta.notes}
                minRows={3}
                onChange={(event) =>
                  updateDraft((next) => {
                    next.localMeta.notes = event.currentTarget.value;
                  })
                }
              />

              <Divider />

              <div>
                <Title order={5}>{messages.publicationAdmin.compatibility}</Title>
              </div>
              <TextInput
                label="localMeta.legacyHints.authorship"
                value={(draft.localMeta.legacyHints?.authorship || []).join(", ")}
                onChange={(event) =>
                  updateDraft((next) => {
                    setLegacyHints(next, "authorship", event.currentTarget.value);
                  })
                }
              />
              <TextInput
                label="localMeta.legacyHints.presentationType"
                value={(draft.localMeta.legacyHints?.presentationType || []).join(", ")}
                onChange={(event) =>
                  updateDraft((next) => {
                    setLegacyHints(next, "presentationType", event.currentTarget.value);
                  })
                }
              />
            </Stack>
          )}
        </Paper>
      </div>
    </Stack>
  );
}

function switchResearchmapType(
  fields: PublicationMasterResearchmapFields,
  nextType: PublicationMasterResearchmapFields["type"]
): PublicationMasterResearchmapFields {
  if (fields.type === nextType) {
    return fields;
  }

  const nextFields = { ...fields, type: nextType };

  if (nextType === "presentations") {
    nextFields.presentation_title = nextFields.presentation_title || nextFields.paper_title;
    nextFields.presenters = nextFields.presenters || nextFields.authors;
    nextFields.event = nextFields.event || nextFields.publication_name;
    delete nextFields.paper_title;
    delete nextFields.authors;
    delete nextFields.publication_name;
  } else {
    nextFields.paper_title = nextFields.paper_title || nextFields.presentation_title;
    nextFields.authors = nextFields.authors || nextFields.presenters;
    nextFields.publication_name = nextFields.publication_name || nextFields.event;
    delete nextFields.presentation_title;
    delete nextFields.presenters;
    delete nextFields.event;
  }

  return nextFields;
}

function setLocalizedValue(
  fields: PublicationMasterResearchmapFields,
  key: "paper_title" | "presentation_title" | "publication_name" | "event" | "location" | "description",
  language: LocalizedLanguage,
  value: string
) {
  const nextValue = ensureLocalizedText(fields[key]);
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    delete nextValue[language];
  } else {
    nextValue[language] = normalizedValue;
  }

  fields[key] = Object.keys(nextValue).length > 0 ? nextValue : undefined;
}

function setLocalizedMetaValue(
  value: LocalizedText,
  language: LocalizedLanguage,
  input: string
) {
  const normalizedValue = input.trim();

  if (!normalizedValue) {
    delete value[language];
  } else {
    value[language] = normalizedValue;
  }
}

function setPeopleValue(
  fields: PublicationMasterResearchmapFields,
  key: "authors" | "presenters",
  language: LocalizedLanguage,
  input: string
) {
  const nextValue = ensureLocalizedPeople(fields[key]);
  const names = input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name) => ({ name }));

  if (names.length === 0) {
    delete nextValue[language];
  } else {
    nextValue[language] = names;
  }

  fields[key] = Object.keys(nextValue).length > 0 ? nextValue : undefined;
}

function setSingleDoi(fields: PublicationMasterResearchmapFields, value: string) {
  const normalizedValue = emptyToUndefined(value);

  if (!normalizedValue) {
    fields.identifiers = undefined;
    return;
  }

  fields.identifiers = { doi: [normalizedValue] };
}

function setPrimaryLink(fields: PublicationMasterResearchmapFields, value: string) {
  const normalizedValue = emptyToUndefined(value);

  if (!normalizedValue) {
    fields.see_also = undefined;
    return;
  }

  fields.see_also = [{ "@id": normalizedValue, label: "url" }];
}

function setLegacyHints(
  record: PublicationMasterRecord,
  key: "authorship" | "presentationType",
  value: string
) {
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const nextLegacyHints = record.localMeta.legacyHints || {
    authorship: [],
    presentationType: [],
  };

  nextLegacyHints[key] = items;
  record.localMeta.legacyHints =
    nextLegacyHints.authorship.length > 0 || nextLegacyHints.presentationType.length > 0
      ? nextLegacyHints
      : undefined;
}

function ensureLocalizedText(value: LocalizedText | undefined): LocalizedText {
  return value ? { ...value } : {};
}

function ensureLocalizedPeople(value: LocalizedPeople | undefined): LocalizedPeople {
  return value ? { ...value } : {};
}

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function cloneRecord(record: PublicationMasterRecord): PublicationMasterRecord {
  return JSON.parse(JSON.stringify(record)) as PublicationMasterRecord;
}

function cloneRecords(records: PublicationMasterRecord[]): PublicationMasterRecord[] {
  return records.map((record) => cloneRecord(record));
}

export default PublicationAdmin;
