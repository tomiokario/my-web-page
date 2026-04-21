import fs from 'fs';

export function csvToPublications(csvFilePath) {
  return loadCsvPublications(csvFilePath).publications;
}

export function loadCsvPublications(csvFilePath) {
  const rawCsvData = fs.readFileSync(csvFilePath, 'utf8');
  const hasBom = rawCsvData.startsWith('\uFEFF');
  const csvData = rawCsvData.replace(/^\uFEFF/, '');
  const lines = csvData.split(/\r?\n/);
  const rawHeaderLine = lines[0];
  const headers = parseCSVLine(lines[0]).map((header) => header.trim());
  const publications = [];
  const sourceRows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) continue;

    try {
      const values = parseCSVLine(line);
      const rawValueCount = values.length;
      while (values.length < headers.length) values.push('');
      if (rawValueCount < headers.length - 1 || !values[1] || values[1].trim() === '') continue;

      const abstractHeaderIndex = headers.findIndex((header) =>
        ['abstract', 'Abstract', '要旨', '概要'].includes(header)
      );
      const processedDate = processDate((values[9] || '').trim());
      const publication = {
        id: i,
        hasEmptyFields: (values[0] || '').trim() === 'Yes',
        name: (values[1] || '').trim(),
        japanese: (values[2] || '').trim(),
        abstract: abstractHeaderIndex >= 0 ? (values[abstractHeaderIndex] || '').trim() : '',
        type: (values[3] || '').trim(),
        review: (values[4] || '').trim(),
        authorship: processCommaSeparatedValue(values[5]),
        presentationType: processCommaSeparatedValue(values[6]),
        doi: (values[7] || '').trim(),
        webLink: (values[8] || '').trim(),
        date: (values[9] || '').trim(),
        startDate: processedDate.startDate,
        endDate: processedDate.endDate,
        sortableDate: processedDate.sortableDate,
        others: (values[10] || '').trim(),
        site: (values[11] || '').trim(),
        journalConference: (values[12] || '').trim(),
      };

      publications.push(publication);
      sourceRows.push({
        id: publication.id,
        lineNumber: i + 1,
        rawLine,
      });
    } catch {
      // Skip malformed rows.
    }
  }

  return {
    headers,
    rawHeaderLine,
    hasBom,
    publications,
    sourceRows,
  };
}

function processCommaSeparatedValue(value) {
  const trimmedValue = (value || '').trim();
  if (trimmedValue.includes(',')) {
    return trimmedValue.split(',').map((item) => item.trim());
  }
  return trimmedValue;
}

function processDate(dateString) {
  if (!dateString) return { startDate: '', endDate: '', sortableDate: '' };
  const rangeMatch = dateString.match(/(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s*→\s*(\d{4})年(\d{1,2})月(\d{1,2})日)?/);
  if (rangeMatch) {
    const startDate = `${rangeMatch[1]}-${rangeMatch[2].padStart(2, '0')}-${rangeMatch[3].padStart(2, '0')}`;
    const endDate = rangeMatch[4]
      ? `${rangeMatch[4]}-${rangeMatch[5].padStart(2, '0')}-${rangeMatch[6].padStart(2, '0')}`
      : startDate;
    return { startDate, endDate, sortableDate: startDate };
  }

  const yearMonthMatch = dateString.match(/(\d{4})年(\d{1,2})月/);
  if (yearMonthMatch) {
    const date = `${yearMonthMatch[1]}-${yearMonthMatch[2].padStart(2, '0')}-01`;
    return { startDate: date, endDate: date, sortableDate: date };
  }

  return { startDate: dateString, endDate: dateString, sortableDate: dateString };
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}
