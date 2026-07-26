// build_invoice_pk.js — Permakultur-Konzepte Rechnungsgenerator
// Rekonstruiert aus früheren Chats ("Kosten für Stefanie Pietschmann", 12.07.2026).
// Struktur, BRAND-Konstanten, Helper-Funktionen 1:1 aus den damaligen Tool-Calls übernommen.
// Kleinere Verbindungsstellen (v.a. Tabellenzeilen-Aufbau im Detail), wo die
// Chat-Fragmente abgeschnitten waren, wurden konsistent zu den übrigen cell()-Aufrufen ergänzt.

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, ShadingType, AlignmentType, BorderStyle,
  VerticalAlign, TableLayoutType, ImageRun,
} = require("docx");

// ============================================================
// 1. RECHNUNGSDATEN — HIER PRO RECHNUNG ANPASSEN
// ============================================================
const INVOICE_DATA = {
  empfaenger: {
    name: "Kathrin und Matthias Kiesel",
    strasse: "Weg zur Neuen Welt 20",
    plzOrt: "97082 Würzburg",
    email: null,
  },
  rechnungsdatum: "2026-07-26",       // YYYY-MM-DD
  leistungszeitraum: "20.07.2026 – 24.07.2026",
  positionen: [
    { leistung: "Beratungsgespräch, Konzeptarbeit und Angebotserstellung", menge: "pauschal", einzelpreis: null, gesamtpreis: 475.00 },
  ],
  ustHinweis: "Umsatzsteuerfreie Leistung gemäß § 19 UStG.",
};

// ============================================================
// 2. MARKEN-KONSTANTEN (nur ändern, wenn sich das CI ändert)
// ============================================================
// Sensible Daten (Adresse, IBAN, Steuernummer) liegen NICHT hier im öffentlichen
// Script, sondern in config.local.js (per .gitignore vom Commit ausgeschlossen).
// Siehe config.local.example.js für die benötigte Struktur.
const localConfig = require("./config.local.js");

const BRAND = {
  green: "1C4A2A",
  greenMid: "2D6B3F",
  amber: "C9921A",
  creamDark: "EDE5D0",
  text: "1A2A1E",
  textLight: "6B7D6E",
  fontHead: "Playfair Display",
  fontBody: "Jost",
  logoPath: path.join(__dirname, "logo.png"),
  absender: localConfig.absender,
  iban: localConfig.iban,
  bic: localConfig.bic,
};

const OUTPUT_DIR = path.join(__dirname, "output");

// ============================================================
// 3. AUTOMATISCHE RECHNUNGSNUMMER
// ============================================================
function formatDateDDMMYY(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}`;
}

function formatDateDisplay(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function generateRechnungsnummer(isoDate) {
  const base = "P" + formatDateDDMMYY(isoDate);
  if (!fs.existsSync(OUTPUT_DIR)) return base;
  const existing = fs.readdirSync(OUTPUT_DIR).filter((f) => f.includes(base));
  if (existing.length === 0) return base;
  // Es gibt bereits eine Rechnung mit dieser Nummer -> Suffix anhängen
  let suffix = 2;
  while (existing.some((f) => f.includes(`${base}-${suffix}`))) suffix++;
  return `${base}-${suffix}`;
}

function slugify(text) {
  return text
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "") // Umlaute etc. entfernen
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function calendarWeek(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = target - firstThursday;
  return 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
}

function fmtEuro(n) {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

// ============================================================
// 4. AUTOMATISCHE SPALTENBREITEN (an Inhalt angepasst)
// ============================================================
const TABLE_WIDTH = 9640;
const MIN_WIDTHS = { pos: 700, menge: 1100, einzelpreis: 1650, gesamtpreis: 1850 };

function calcColumnWidths(positionen) {
  const posMax = Math.max(3, ...positionen.map((_, i) => String(i + 1).length));
  const mengeMax = Math.max(5, ...positionen.map((p) => String(p.menge).length));
  const posW = Math.max(MIN_WIDTHS.pos, posMax * 140 + 300);
  const mengeW = Math.max(MIN_WIDTHS.menge, mengeMax * 110 + 300);
  const einzelW = MIN_WIDTHS.einzelpreis;
  const gesamtW = MIN_WIDTHS.gesamtpreis;
  const leistungW = TABLE_WIDTH - posW - mengeW - einzelW - gesamtW;
  return [posW, leistungW, mengeW, einzelW, gesamtW];
}

// ============================================================
// 5. DOKUMENT-BAU (Layout unverändert zur freigegebenen Vorlage)
// ============================================================
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const cellNoBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function cell(text, { bold = false, align = AlignmentType.LEFT, shade = null, color = BRAND.text, size = 20, width, font = BRAND.fontBody } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: shade ? { type: ShadingType.CLEAR, color: "auto", fill: shade } : undefined,
    borders: cellNoBorders,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 110, bottom: 110, left: 130, right: 130 },
    children: [new Paragraph({ alignment: align, children: [new TextRun({ text, bold, size, color, font })] })],
  });
}

function infoLine(label, value) {
  return new Paragraph({
    spacing: { after: 50 },
    children: [
      new TextRun({ text: label, bold: true, size: 20, color: BRAND.text, font: BRAND.fontBody }),
      new TextRun({ text: value, size: 20, color: BRAND.text, font: BRAND.fontBody }),
    ],
  });
}

function eyebrow(text) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text: text.toUpperCase(), size: 20, color: BRAND.greenMid, font: BRAND.fontBody, bold: true, characterSpacing: 30 })],
  });
}

function buildInvoiceTable(positionen) {
  const [posW, leistungW, mengeW, einzelW, gesamtW] = calcColumnWidths(positionen);

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      cell("Pos.", { bold: true, align: AlignmentType.CENTER, shade: BRAND.green, color: "FFFFFF", width: posW, size: 20 }),
      cell("Leistung", { bold: true, shade: BRAND.green, color: "FFFFFF", width: leistungW, size: 20 }),
      cell("Menge", { bold: true, align: AlignmentType.CENTER, shade: BRAND.green, color: "FFFFFF", width: mengeW, size: 20 }),
      cell("Einzelpreis", { bold: true, align: AlignmentType.RIGHT, shade: BRAND.green, color: "FFFFFF", width: einzelW, size: 20 }),
      cell("Gesamtpreis", { bold: true, align: AlignmentType.RIGHT, shade: BRAND.green, color: "FFFFFF", width: gesamtW, size: 20 }),
    ],
  });

  const dataRows = positionen.map((p, i) => new TableRow({
    children: [
      cell(String(i + 1), { align: AlignmentType.CENTER, shade: BRAND.creamDark, width: posW }),
      cell(p.leistung, { shade: BRAND.creamDark, width: leistungW }),
      cell(String(p.menge), { align: AlignmentType.CENTER, shade: BRAND.creamDark, width: mengeW }),
      cell(p.einzelpreis != null ? fmtEuro(p.einzelpreis) : "—", { align: AlignmentType.RIGHT, shade: BRAND.creamDark, width: einzelW }),
      cell(fmtEuro(p.gesamtpreis), { align: AlignmentType.RIGHT, shade: BRAND.creamDark, width: gesamtW }),
    ],
  }));

  const gesamtbetrag = positionen.reduce((s, p) => s + p.gesamtpreis, 0);
  const totalRow = new TableRow({
    children: [
      cell("", { width: posW }),
      cell("", { width: leistungW }),
      cell("", { width: mengeW }),
      cell("Gesamtbetrag", { bold: true, align: AlignmentType.RIGHT, width: einzelW }),
      cell(fmtEuro(gesamtbetrag), { bold: true, align: AlignmentType.RIGHT, width: gesamtW, color: BRAND.green }),
    ],
  });

  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [posW, leistungW, mengeW, einzelW, gesamtW],
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...dataRows, totalRow],
  });
}

function buildHeaderTable() {
  return new Table({
    width: { size: 9640, type: WidthType.DXA },
    columnWidths: [1450, 4650, 3540],
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 1450, type: WidthType.DXA },
            borders: cellNoBorders,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 0, bottom: 0, left: 0, right: 90 },
            children: [new Paragraph({ children: [new ImageRun({ type: "png", data: fs.readFileSync(BRAND.logoPath), transformation: { width: 80, height: 80 } })] })],
          }),
          new TableCell({
            width: { size: 4650, type: WidthType.DXA },
            borders: cellNoBorders,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({ children: [new TextRun({ text: "Permakultur-Konzepte", bold: true, size: 30, color: BRAND.green, font: BRAND.fontHead })] }),
              new Paragraph({ spacing: { before: 50 }, children: [new TextRun({ text: "für regenerative Flächennutzung", size: 20, color: BRAND.textLight, font: BRAND.fontBody, characterSpacing: 16 })] }),
            ],
          }),
          new TableCell({
            width: { size: 3540, type: WidthType.DXA },
            borders: cellNoBorders,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: BRAND.absender.name, size: 18, color: BRAND.textLight, font: BRAND.fontBody })] }),
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: BRAND.absender.strasse, size: 18, color: BRAND.textLight, font: BRAND.fontBody })] }),
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: BRAND.absender.plzOrt, size: 18, color: BRAND.textLight, font: BRAND.fontBody })] }),
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: BRAND.absender.email, size: 18, color: BRAND.textLight, font: BRAND.fontBody })] }),
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "permakultur-konzepte.de", size: 18, color: BRAND.textLight, font: BRAND.fontBody })] }),
            ],
          }),
        ],
      }),
    ],
  });
}

function buildDocument(data, rechnungsnummer) {
  return new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 900, bottom: 900, left: 1100, right: 1100 } },
        },
        children: [
          buildHeaderTable(),
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BRAND.amber, space: 4 } },
            spacing: { after: 260, before: 100 },
            children: [],
          }),

          // Empfänger
          new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: data.empfaenger.name, bold: true, size: 22, font: BRAND.fontBody })] }),
          new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: data.empfaenger.strasse, size: 22, font: BRAND.fontBody })] }),
          new Paragraph({ spacing: { after: 600 }, children: [new TextRun({ text: data.empfaenger.plzOrt, size: 22, font: BRAND.fontBody })] }),

          eyebrow("Rechnung"),
          new Paragraph({
            spacing: { after: 220 },
            children: [new TextRun({ text: `Nr. ${rechnungsnummer}`, bold: true, size: 32, color: BRAND.green, font: BRAND.fontBody })],
          }),

          infoLine("Rechnungsdatum: ", formatDateDisplay(data.rechnungsdatum)),
          infoLine("Leistungszeitraum: ", data.leistungszeitraum),

          new Paragraph({ spacing: { before: 514, after: 300 }, children: [new TextRun({ text: "Herzlichen Dank für den Auftrag. Meine Leistungen berechne ich wie folgt:", size: 22, font: BRAND.fontBody })] }),

          buildInvoiceTable(data.positionen),

          new Paragraph({ spacing: { before: 300, after: 60 }, children: [new TextRun({ text: data.ustHinweis, size: 19, color: BRAND.textLight, font: BRAND.fontBody })] }),
          new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: `Steuernummer: ${localConfig.steuernummer}`, size: 19, color: BRAND.textLight, font: BRAND.fontBody })] }),
          new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: localConfig.finanzamt, size: 19, color: BRAND.textLight, font: BRAND.fontBody })] }),

          new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 8 } }, spacing: { before: 100, after: 220 }, children: [] }),

          new Paragraph({ spacing: { after: 70 }, children: [new TextRun({ text: "Bitte überweisen Sie den Gesamtbetrag auf folgendes Konto:", size: 20, font: BRAND.fontBody })] }),
          infoLine("IBAN: ", BRAND.iban),
          infoLine("BIC: ", BRAND.bic),

          new Paragraph({ spacing: { before: 400, after: 60 }, children: [new TextRun({ text: "Vielen Dank.", size: 22, font: BRAND.fontBody })] }),
          new Paragraph({ spacing: { before: 200, after: 0 }, children: [new TextRun({ text: "Freundliche Grüße", size: 22, font: BRAND.fontBody })] }),
          new Paragraph({ children: [new TextRun({ text: "Vincent Hahn", size: 24, bold: true, color: BRAND.green, font: BRAND.fontHead })] }),
        ],
      },
    ],
  });
}

// ============================================================
// 6. AUSFÜHRUNG
// ============================================================
async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const rechnungsnummer = generateRechnungsnummer(INVOICE_DATA.rechnungsdatum);
  const kw = calendarWeek(INVOICE_DATA.rechnungsdatum);
  const kundenSlug = slugify(INVOICE_DATA.empfaenger.name);
  const filename = `KW${kw}_Rechnung_${rechnungsnummer}_${kundenSlug}.docx`;
  const outputPath = path.join(OUTPUT_DIR, filename);

  const doc = buildDocument(INVOICE_DATA, rechnungsnummer);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);

  console.log(`Rechnung erstellt: ${outputPath}`);
  console.log(`Rechnungsnummer:   ${rechnungsnummer}`);
  console.log(`Gesamtbetrag:      ${fmtEuro(INVOICE_DATA.positionen.reduce((s, p) => s + p.gesamtpreis, 0))}`);

  // PDF zusätzlich erzeugen (benötigt LibreOffice/soffice im PATH)
  try {
    execSync(`soffice --headless --convert-to pdf --outdir "${OUTPUT_DIR}" "${outputPath}"`, { stdio: "pipe" });
    const pdfPath = outputPath.replace(/\.docx$/, ".pdf");
    if (fs.existsSync(pdfPath)) {
      console.log(`PDF erstellt:      ${pdfPath}`);
    } else {
      console.warn("PDF-Konvertierung meldete Erfolg, aber Datei wurde nicht gefunden.");
    }
  } catch (err) {
    console.warn("PDF-Export fehlgeschlagen (LibreOffice/soffice nicht gefunden?). docx wurde trotzdem erstellt.");
  }
}

main();
