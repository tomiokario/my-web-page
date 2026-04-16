const state = {
  records: [],
  selectedId: "",
  search: "",
};

const elements = {
  statusText: document.querySelector("#status-text"),
  pathText: document.querySelector("#path-text"),
  recordList: document.querySelector("#record-list"),
  reloadButton: document.querySelector("#reload-button"),
  saveButton: document.querySelector("#save-button"),
  searchInput: document.querySelector("#search-input"),
  recordId: document.querySelector("#record-id"),
  typeSelect: document.querySelector("#type-select"),
  subtypeInput: document.querySelector("#subtype-input"),
  publicationDateInput: document.querySelector("#publication-date-input"),
  fromDateInput: document.querySelector("#from-date-input"),
  toDateInput: document.querySelector("#to-date-input"),
  presentationTypeInput: document.querySelector("#presentation-type-input"),
  refereeCheckbox: document.querySelector("#referee-checkbox"),
  invitedCheckbox: document.querySelector("#invited-checkbox"),
  titleJaInput: document.querySelector("#title-ja-input"),
  titleEnInput: document.querySelector("#title-en-input"),
  peopleJaInput: document.querySelector("#people-ja-input"),
  peopleEnInput: document.querySelector("#people-en-input"),
  venueJaInput: document.querySelector("#venue-ja-input"),
  venueEnInput: document.querySelector("#venue-en-input"),
  locationJaInput: document.querySelector("#location-ja-input"),
  locationEnInput: document.querySelector("#location-en-input"),
  doiInput: document.querySelector("#doi-input"),
  webLinkInput: document.querySelector("#web-link-input"),
  volumeInput: document.querySelector("#volume-input"),
  numberInput: document.querySelector("#number-input"),
  startingPageInput: document.querySelector("#starting-page-input"),
  endingPageInput: document.querySelector("#ending-page-input"),
  rawCitationJaInput: document.querySelector("#raw-citation-ja-input"),
  rawCitationEnInput: document.querySelector("#raw-citation-en-input"),
  notesInput: document.querySelector("#notes-input"),
  titleJaLabel: document.querySelector("#title-ja-label"),
  titleEnLabel: document.querySelector("#title-en-label"),
  peopleJaLabel: document.querySelector("#people-ja-label"),
  peopleEnLabel: document.querySelector("#people-en-label"),
  venueJaLabel: document.querySelector("#venue-ja-label"),
  venueEnLabel: document.querySelector("#venue-en-label"),
};

initialize();

function initialize() {
  elements.reloadButton.addEventListener("click", loadRecords);
  elements.saveButton.addEventListener("click", saveRecords);
  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.currentTarget.value.trim().toLowerCase();
    renderRecordList();
  });
  elements.typeSelect.addEventListener("change", () => {
    updateDraft((record) => {
      record.researchmapFields.type = elements.typeSelect.value;
    });
    syncFieldMode();
  });

  for (const [key, element] of Object.entries(elements)) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) {
      continue;
    }
    if (["searchInput", "recordId", "typeSelect"].includes(key)) {
      continue;
    }
    element.addEventListener("input", applyFormToDraft);
    if (element instanceof HTMLInputElement && element.type === "checkbox") {
      element.addEventListener("change", applyFormToDraft);
    }
  }

  loadRecords();
}

async function loadRecords() {
  setStatus("Loading publication master data...");
  try {
    const response = await fetch("/api/publications/master", { cache: "no-store" });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Failed to load publication master data.");
    }

    state.records = payload.records;
    state.selectedId = payload.records[0]?.id || "";
    elements.pathText.textContent =
      `Master: ${payload.masterJsonPath} | Web: ${payload.webJsonPath}`;

    renderRecordList();
    renderEditor();
    setStatus(`Loaded ${payload.records.length} publication records.`);
  } catch (error) {
    setStatus(error.message || "Failed to load publication master data.");
  }
}

function renderRecordList() {
  const filteredRecords = state.records.filter((record) => {
    if (!state.search) {
      return true;
    }

    const haystack = [
      record.id,
      deriveTitle(record),
      deriveVenue(record),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(state.search);
  });

  if (filteredRecords.length === 0) {
    elements.recordList.innerHTML = '<div class="empty-state">No matching records.</div>';
    return;
  }

  elements.recordList.innerHTML = "";
  filteredRecords.forEach((record) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `record-card${record.id === state.selectedId ? " is-selected" : ""}`;
    button.innerHTML = `
      <strong>${escapeHtml(deriveTitle(record))}</strong>
      <span>${escapeHtml(deriveVenue(record) || record.id)}</span>
      <span>${escapeHtml(record.id)}</span>
    `;
    button.addEventListener("click", () => {
      state.selectedId = record.id;
      renderRecordList();
      renderEditor();
    });
    elements.recordList.appendChild(button);
  });
}

function renderEditor() {
  const record = getSelectedRecord();

  if (!record) {
    elements.recordId.value = "";
    setStatus("No record selected.");
    return;
  }

  const fields = record.researchmapFields || {};
  const titleKey = fields.type === "presentations" ? "presentation_title" : "paper_title";
  const peopleKey = fields.type === "presentations" ? "presenters" : "authors";
  const venueKey = fields.type === "presentations" ? "event" : "publication_name";

  elements.recordId.value = record.id || "";
  elements.typeSelect.value = fields.type || "published_papers";
  elements.subtypeInput.value = fields.subtype || "";
  elements.publicationDateInput.value = fields.publication_date || "";
  elements.fromDateInput.value = fields.from_event_date || "";
  elements.toDateInput.value = fields.to_event_date || "";
  elements.presentationTypeInput.value = fields.presentation_type || "";
  elements.refereeCheckbox.checked = Boolean(fields.referee);
  elements.invitedCheckbox.checked = Boolean(fields.invited);
  elements.titleJaInput.value = getLocalizedText(fields[titleKey], "ja");
  elements.titleEnInput.value = getLocalizedText(fields[titleKey], "en");
  elements.peopleJaInput.value = stringifyPeople(fields[peopleKey], "ja");
  elements.peopleEnInput.value = stringifyPeople(fields[peopleKey], "en");
  elements.venueJaInput.value = getLocalizedText(fields[venueKey], "ja");
  elements.venueEnInput.value = getLocalizedText(fields[venueKey], "en");
  elements.locationJaInput.value = getLocalizedText(fields.location, "ja");
  elements.locationEnInput.value = getLocalizedText(fields.location, "en");
  elements.doiInput.value = fields.identifiers?.doi?.[0] || "";
  elements.webLinkInput.value = fields.see_also?.[0]?.["@id"] || "";
  elements.volumeInput.value = fields.volume || "";
  elements.numberInput.value = fields.number || "";
  elements.startingPageInput.value = fields.starting_page || "";
  elements.endingPageInput.value = fields.ending_page || "";
  elements.rawCitationJaInput.value = record.localMeta?.rawCitation?.ja || "";
  elements.rawCitationEnInput.value = record.localMeta?.rawCitation?.en || "";
  elements.notesInput.value = record.localMeta?.notes || "";

  syncFieldMode();
}

function syncFieldMode() {
  const isPresentation = elements.typeSelect.value === "presentations";

  elements.titleJaLabel.textContent = `researchmapFields.${isPresentation ? "presentation_title" : "paper_title"}.ja`;
  elements.titleEnLabel.textContent = `researchmapFields.${isPresentation ? "presentation_title" : "paper_title"}.en`;
  elements.peopleJaLabel.textContent = `researchmapFields.${isPresentation ? "presenters" : "authors"}.ja`;
  elements.peopleEnLabel.textContent = `researchmapFields.${isPresentation ? "presenters" : "authors"}.en`;
  elements.venueJaLabel.textContent = `researchmapFields.${isPresentation ? "event" : "publication_name"}.ja`;
  elements.venueEnLabel.textContent = `researchmapFields.${isPresentation ? "event" : "publication_name"}.en`;
}

function applyFormToDraft() {
  updateDraft((record) => {
    const fields = record.researchmapFields || {};
    const isPresentation = fields.type === "presentations";
    const titleKey = isPresentation ? "presentation_title" : "paper_title";
    const peopleKey = isPresentation ? "presenters" : "authors";
    const venueKey = isPresentation ? "event" : "publication_name";

    fields.subtype = emptyToUndefined(elements.subtypeInput.value);
    fields.publication_date = emptyToUndefined(elements.publicationDateInput.value);
    fields.from_event_date = emptyToUndefined(elements.fromDateInput.value);
    fields.to_event_date = emptyToUndefined(elements.toDateInput.value);
    fields.presentation_type = emptyToUndefined(elements.presentationTypeInput.value);
    fields.referee = elements.refereeCheckbox.checked;
    fields.invited = elements.invitedCheckbox.checked;
    fields.volume = emptyToUndefined(elements.volumeInput.value);
    fields.number = emptyToUndefined(elements.numberInput.value);
    fields.starting_page = emptyToUndefined(elements.startingPageInput.value);
    fields.ending_page = emptyToUndefined(elements.endingPageInput.value);

    setLocalizedText(fields, titleKey, "ja", elements.titleJaInput.value);
    setLocalizedText(fields, titleKey, "en", elements.titleEnInput.value);
    setLocalizedPeople(fields, peopleKey, "ja", elements.peopleJaInput.value);
    setLocalizedPeople(fields, peopleKey, "en", elements.peopleEnInput.value);
    setLocalizedText(fields, venueKey, "ja", elements.venueJaInput.value);
    setLocalizedText(fields, venueKey, "en", elements.venueEnInput.value);
    setLocalizedText(fields, "location", "ja", elements.locationJaInput.value);
    setLocalizedText(fields, "location", "en", elements.locationEnInput.value);
    setSingleDoi(fields, elements.doiInput.value);
    setPrimaryLink(fields, elements.webLinkInput.value);

    if (isPresentation) {
      delete fields.paper_title;
      delete fields.authors;
      delete fields.publication_name;
    } else {
      delete fields.presentation_title;
      delete fields.presenters;
      delete fields.event;
    }

    record.localMeta = record.localMeta || { hasEmptyFields: false, rawCitation: {}, notes: "" };
    record.localMeta.rawCitation = record.localMeta.rawCitation || {};
    setLocalizedText(record.localMeta, "rawCitation", "ja", elements.rawCitationJaInput.value);
    setLocalizedText(record.localMeta, "rawCitation", "en", elements.rawCitationEnInput.value);
    record.localMeta.notes = elements.notesInput.value.trim();
  });
}

function updateDraft(mutator) {
  const index = state.records.findIndex((record) => record.id === state.selectedId);

  if (index < 0) {
    return;
  }

  const nextRecord = JSON.parse(JSON.stringify(state.records[index]));
  mutator(nextRecord);
  state.records[index] = nextRecord;
}

async function saveRecords() {
  applyFormToDraft();
  setStatus("Saving through the local bridge...");

  try {
    const response = await fetch("/api/publications/master", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: state.records }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Save failed.");
    }

    setStatus(
      `Saved ${payload.recordCount} master records and regenerated ${payload.webRecordCount} web records.`
    );
    await loadRecords();
  } catch (error) {
    setStatus(error.message || "Save failed.");
  }
}

function getSelectedRecord() {
  return state.records.find((record) => record.id === state.selectedId) || null;
}

function deriveTitle(record) {
  const fields = record.researchmapFields || {};
  return (
    fields.paper_title?.ja ||
    fields.paper_title?.en ||
    fields.presentation_title?.ja ||
    fields.presentation_title?.en ||
    record.localMeta?.rawCitation?.ja ||
    record.localMeta?.rawCitation?.en ||
    record.id
  );
}

function deriveVenue(record) {
  const fields = record.researchmapFields || {};
  return (
    fields.publication_name?.ja ||
    fields.publication_name?.en ||
    fields.event?.ja ||
    fields.event?.en ||
    ""
  );
}

function getLocalizedText(value, language) {
  return value?.[language] || "";
}

function stringifyPeople(value, language) {
  return (value?.[language] || []).map((person) => person.name).join("\n");
}

function setLocalizedText(target, key, language, value) {
  const trimmed = value.trim();
  target[key] = target[key] || {};

  if (trimmed) {
    target[key][language] = trimmed;
  } else if (target[key]) {
    delete target[key][language];
  }

  if (target[key] && Object.keys(target[key]).length === 0) {
    delete target[key];
  }
}

function setLocalizedPeople(target, key, language, value) {
  const lines = value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((name) => ({ name }));

  target[key] = target[key] || {};

  if (lines.length > 0) {
    target[key][language] = lines;
  } else if (target[key]) {
    delete target[key][language];
  }

  if (target[key] && Object.keys(target[key]).length === 0) {
    delete target[key];
  }
}

function setSingleDoi(fields, value) {
  const trimmed = emptyToUndefined(value);

  if (!trimmed) {
    if (fields.identifiers) {
      delete fields.identifiers.doi;
      if (Object.keys(fields.identifiers).length === 0) {
        delete fields.identifiers;
      }
    }
    return;
  }

  fields.identifiers = fields.identifiers || {};
  fields.identifiers.doi = [trimmed];
}

function setPrimaryLink(fields, value) {
  const trimmed = emptyToUndefined(value);

  if (!trimmed) {
    delete fields.see_also;
    return;
  }

  fields.see_also = [{ "@id": trimmed, label: "url" }];
}

function emptyToUndefined(value) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function setStatus(message) {
  elements.statusText.textContent = message;
}
