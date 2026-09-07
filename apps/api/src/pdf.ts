import PDFDocument from 'pdfkit';
import { AGENCY_LABELS, LEGAL_STATUS_LABELS, type Citizen, type FormField, type WorkflowTransaction } from '@pvg/shared';

// Built-in Helvetica (WinAnsi) has no ₡ glyph, so amounts are written as "CRC 85 000".
const NUM = new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 });
const CRC = (n: number) => `CRC ${NUM.format(n)}`;
const DATE = new Intl.DateTimeFormat('es-CR', { dateStyle: 'long', timeZone: 'America/Costa_Rica' });

function fmtDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  return Number.isNaN(d.getTime()) ? iso : DATE.format(d);
}

/** Card values may carry "₡12 345"; Helvetica cannot render the colón sign. */
function safe(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  return String(value).replace(/₡\s?/g, 'CRC ');
}

/** Renders an input value for the PDF using the field definition when there is one. */
function inputValue(field: FormField | undefined, value: unknown): string {
  if (field?.options) {
    const opt = field.options.find((o) => o.value === String(value));
    if (opt) return opt.label;
  }
  if (typeof value === 'number') return NUM.format(value);
  return safe(value);
}

/**
 * Generic constancia for any workflow, rendered from `result.cards` (letter size — Costa Rica uses carta, not A4).
 * The document is returned un-ended; the caller pipes it and calls `end()`.
 */
export function renderSummaryPdf(txn: WorkflowTransaction, fields: FormField[] = []): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 54, bottom: 54, left: 54, right: 54 },
    info: { Title: `PuraVidaGov — Constancia ${txn.txnId}`, Author: 'PuraVidaGov (demostración)' },
  });
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const left = doc.page.margins.left;

  const heading = (text: string) => {
    doc.moveDown(0.8).font('Helvetica-Bold').fontSize(13).fillColor('#0b3d2e').text(text);
    doc.moveTo(left, doc.y + 2).lineTo(left + width, doc.y + 2).lineWidth(0.5).strokeColor('#0b3d2e').stroke();
    doc.moveDown(0.4).fillColor('#000');
  };
  const row = (label: string, value: unknown) => {
    doc.font('Helvetica-Bold').fontSize(10).text(`${label}: `, { continued: true });
    doc.font('Helvetica').text(safe(value));
  };
  const note = (text: string) => {
    doc.font('Helvetica').fontSize(9).fillColor('#444').text(text).fillColor('#000');
  };

  // Title
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#0b3d2e').text(`PuraVidaGov — Constancia: ${txn.workflowTitle}`);
  doc.font('Helvetica').fontSize(9).fillColor('#444').text(`Transacción ${txn.txnId} · emitida el ${fmtDate(txn.completedAt ?? txn.createdAt)}`);
  doc.moveDown(0.6);

  // DEMO disclaimer box
  const boxTop = doc.y;
  const boxText = 'DEMOSTRACIÓN — datos ficticios. Este documento no tiene validez legal.';
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#7a1f1f');
  const textH = doc.heightOfString(boxText, { width: width - 20 });
  doc.rect(left, boxTop, width, textH + 16).lineWidth(1.5).strokeColor('#7a1f1f').stroke();
  doc.text(boxText, left + 10, boxTop + 8, { width: width - 20, align: 'center' });
  doc.y = boxTop + textH + 16;
  doc.x = left;
  doc.fillColor('#000');

  const result = txn.result;
  if (result) {
    doc.moveDown(0.8).font('Helvetica-Bold').fontSize(14).fillColor('#000').text(safe(result.headline));
    note(result.summary);
  }

  // Citizen block: from the identity step's result (fetched from the Registro Civil, never typed by the person).
  const identity = txn.steps.find((s) => s.id === 'identidad');
  const c = identity?.result as Citizen | undefined;
  heading('Datos de la persona (Registro Civil)');
  row('Nombre completo', c?.fullName);
  row('Cédula', c?.id ?? txn.citizenId);
  row('Fecha de nacimiento', fmtDate(c?.dateOfBirth));
  row('Nacionalidad', c?.nationality === 'CR' ? 'Costarricense' : c?.nationality);
  row('Dirección', c?.address);
  row('Provincia / cantón / distrito', c ? `${c.province} / ${c.canton} / ${c.district}` : undefined);

  // Input block: what the person actually typed.
  const inputEntries = Object.entries(txn.input).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (inputEntries.length) {
    heading('Datos aportados por la persona');
    for (const [name, value] of inputEntries) {
      const field = fields.find((f) => f.name === name);
      row(field?.label ?? name, inputValue(field, value));
    }
  }

  // Result cards
  for (const card of result?.cards ?? []) {
    heading(`${card.title} — ${AGENCY_LABELS[card.agency]}`);
    for (const r of card.rows) row(r.label, r.value);
    if (card.exchangeId) row('Referencia de intercambio', card.exchangeId);
  }

  // Per-step legal status
  heading('¿Se puede hoy? Estado legal de cada paso');
  note('Para cada intercambio: si ya es posible con la normativa costarricense vigente, si lo es parcialmente o si requiere una ley.');
  doc.moveDown(0.3);
  for (const s of txn.steps) {
    const status = LEGAL_STATUS_LABELS[s.legal.status]?.es ?? s.legal.status;
    const flag = s.legal.status === 'hoy' ? 'Hoy' : s.legal.status === 'parcial' ? 'Parcial' : 'Requiere ley';
    doc.font('Helvetica-Bold').fontSize(10).text(`${flag} — `, { continued: true });
    doc.font('Helvetica').text(`${s.label} (${AGENCY_LABELS[s.agency]})${s.skipped ? ' · omitido' : ''} · ${status}`);
  }

  // Benefits
  if (result) {
    heading('Beneficios estimados del trámite en línea');
    row('Visitas presenciales evitadas', result.benefits.tripsAvoided);
    row('Horas ahorradas', result.benefits.hoursSaved);
    row('Costo evitado', CRC(result.benefits.costSavedCrc));
    if (result.benefits.daysTraditional !== undefined && result.benefits.daysDigital !== undefined) {
      row('Días calendario', `${result.benefits.daysTraditional} en el proceso tradicional · ${result.benefits.daysDigital} en línea`);
    }
    doc.moveDown(0.3);
    note(`Datos reutilizados sin volver a digitarlos (principio «una sola vez»): ${result.onceOnly.length} campos.`);
  }

  // Audit references
  heading('Referencias de auditoría');
  note('Cada intercambio de datos entre instituciones pasó por el bus de interoperabilidad y quedó registrado con el identificador siguiente.');
  doc.moveDown(0.3);
  for (const s of txn.steps) {
    const ref = s.skipped ? 'omitido' : (s.exchangeId ?? '—');
    doc.font('Helvetica').fontSize(10).text(`• ${ref}  —  ${AGENCY_LABELS[s.agency]} · ${s.label} · ${fmtDate(s.finishedAt)}`);
  }

  doc.moveDown(1.5).font('Helvetica-Oblique').fontSize(8).fillColor('#666')
    .text('PuraVidaGov es una demostración técnica. No es un sistema del Gobierno de Costa Rica.', { align: 'center' });

  return doc;
}
