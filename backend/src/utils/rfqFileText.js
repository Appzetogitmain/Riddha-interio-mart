const path = require('path');
const AdmZip = require('adm-zip');

/**
 * Requirement A §1.2 — pull readable text out of an uploaded RFQ/BOQ file so
 * `rfqAiService.parseRFQInput` has something to work with.
 *
 * Handled server-side: .txt, .csv, .xlsx/.xlsm (an xlsx is a zip of XML, which
 * adm-zip — already a dependency — can read without a spreadsheet library).
 *
 * Not handled server-side: .pdf, .dwg and images. There is no text extractor
 * for those in this project's dependency set, so the file is still stored as an
 * attachment and `supported` comes back false; the caller then falls back to
 * whatever text the customer typed. The frontend, which bundles SheetJS, may
 * also send pre-extracted text as `fileSummary`.
 */

const MAX_EXTRACTED_CHARS = 20000;

const decodeXmlEntities = (s) => String(s)
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
  .replace(/&amp;/g, '&');

/** Strip tags but keep the text of each <t> run in a shared string. */
const sharedStringText = (siXml) => {
  const runs = siXml.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [];
  return decodeXmlEntities(runs.map((r) => r.replace(/<[^>]+>/g, '')).join(''));
};

const columnIndex = (cellRef) => {
  const letters = String(cellRef || '').replace(/\d+/g, '');
  let index = 0;
  for (const ch of letters) index = index * 26 + (ch.charCodeAt(0) - 64);
  return index - 1;
};

/**
 * Read the first worksheet of an xlsx buffer into tab-separated text lines.
 * Rows become one line each, which is exactly the shape the RFQ parser wants.
 */
const extractXlsxText = (buffer) => {
  const zip = new AdmZip(buffer);

  const sharedEntry = zip.getEntry('xl/sharedStrings.xml');
  const shared = [];
  if (sharedEntry) {
    const xml = sharedEntry.getData().toString('utf8');
    for (const si of xml.match(/<si>[\s\S]*?<\/si>/g) || []) {
      shared.push(sharedStringText(si));
    }
  }

  const sheetEntry = zip.getEntries()
    .filter((e) => /^xl\/worksheets\/sheet\d+\.xml$/.test(e.entryName))
    .sort((a, b) => a.entryName.localeCompare(b.entryName))[0];
  if (!sheetEntry) return '';

  const sheetXml = sheetEntry.getData().toString('utf8');
  const lines = [];

  for (const rowXml of sheetXml.match(/<row[^>]*>[\s\S]*?<\/row>/g) || []) {
    const cells = [];
    for (const cellXml of rowXml.match(/<c[^>]*\/>|<c[^>]*>[\s\S]*?<\/c>/g) || []) {
      const refMatch = cellXml.match(/r="([A-Z]+\d+)"/);
      const typeMatch = cellXml.match(/t="([^"]+)"/);
      const valueMatch = cellXml.match(/<v>([\s\S]*?)<\/v>/);
      const inlineMatch = cellXml.match(/<is>[\s\S]*?<\/is>/);

      let value = '';
      if (inlineMatch) {
        value = sharedStringText(inlineMatch[0]);
      } else if (valueMatch) {
        const raw = decodeXmlEntities(valueMatch[1]);
        value = typeMatch && typeMatch[1] === 's' ? (shared[Number(raw)] || '') : raw;
      }

      const col = refMatch ? columnIndex(refMatch[1]) : cells.length;
      while (cells.length < col) cells.push('');
      cells[col] = value;
    }

    const line = cells.join('\t').trim();
    if (line) lines.push(line);
  }

  return lines.join('\n');
};

/**
 * @returns {{ text: string, supported: boolean, note: string }}
 */
const extractText = (buffer, filename = '', mimeType = '') => {
  const ext = path.extname(filename).toLowerCase();

  try {
    if (ext === '.txt' || ext === '.csv' || mimeType === 'text/plain' || mimeType === 'text/csv') {
      return {
        text: buffer.toString('utf8').slice(0, MAX_EXTRACTED_CHARS),
        supported: true,
        note: ''
      };
    }

    if (ext === '.xlsx' || ext === '.xlsm') {
      const text = extractXlsxText(buffer).slice(0, MAX_EXTRACTED_CHARS);
      return {
        text,
        supported: text.length > 0,
        note: text.length > 0 ? '' : 'The spreadsheet had no readable cells on its first sheet.'
      };
    }

    if (ext === '.xls') {
      return {
        text: '',
        supported: false,
        note: 'Legacy .xls files cannot be read automatically — please re-save as .xlsx or paste the line items as text.'
      };
    }

    if (ext === '.pdf') {
      return {
        text: '',
        supported: false,
        note: 'PDF text cannot be extracted automatically — the file is attached for the seller, please also type or paste the key line items.'
      };
    }

    return {
      text: '',
      supported: false,
      note: `"${filename || 'This file'}" is attached for the seller to review but cannot be read automatically. Please type or paste the line items.`
    };
  } catch (err) {
    console.error('[RFQ FILE TEXT] extraction failed:', err.message);
    return {
      text: '',
      supported: false,
      note: 'The file could not be read automatically. It is still attached for the seller.'
    };
  }
};

module.exports = { extractText, extractXlsxText, MAX_EXTRACTED_CHARS };
