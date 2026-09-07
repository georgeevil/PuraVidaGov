import PDFDocument from 'pdfkit';
import { AGENCY_LABELS, type WorkflowTransaction } from '@pvg/shared';

// Built-in Helvetica (WinAnsi) has no ₡ glyph, so amounts are written as "CRC 85 000".
const NUM = new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 });
const CRC = { format: (n: number) => `CRC ${NUM.format(n)}` };
const DATE = new Intl.DateTimeFormat('es-CR', { dateStyle: 'long', timeZone: 'America/Costa_Rica' });

function fmtDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  return Number.isNaN(d.getTime()) ? iso : DATE.format(d);
}

const REGIME: Record<string, string> = { simplified: 'Simplificado', traditional: 'Tradicional' };
const REGISTRATION: Record<string, string> = { employer: 'Patrono', 'self-employed': 'Trabajador independiente' };
const BUSINESS_TYPE: Record<string, string> = { natural: 'Persona física', legal: 'Persona jurídica' };

/**
 * Renders the registration summary as a letter-size PDF (Costa Rica uses carta, not A4).
 * The document is returned un-ended; the caller pipes it and calls `end()`.
 */
export function renderSummaryPdf(txn: WorkflowTransaction): PDFKit.PDFDocument {
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
  const row = (label: string, value: string | number | undefined) => {
    doc.font('Helvetica-Bold').fontSize(10).text(`${label}: `, { continued: true });
    doc.font('Helvetica').text(value === undefined || value === '' ? '—' : String(value));
  };

  // Title
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#0b3d2e').text('PuraVidaGov — Constancia de inscripción de negocio');
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

  const r = txn.result;
  const c = r?.citizen;
  const req = txn.request;

  heading('Datos de la persona');
  row('Nombre completo', c?.fullName);
  row('Cédula', c?.id ?? txn.citizenId);
  row('Fecha de nacimiento', fmtDate(c?.dateOfBirth));
  row('Nacionalidad', c?.nationality === 'CR' ? 'Costarricense' : c?.nationality);
  row('Dirección', c?.address);
  row('Provincia / cantón / distrito', c ? `${c.province} / ${c.canton} / ${c.district}` : undefined);

  heading('Datos del negocio');
  row('Nombre comercial', req.businessName);
  row('Tipo', BUSINESS_TYPE[req.businessType] ?? req.businessType);
  row('Actividad', r ? `${r.tax.activityCode} — ${r.tax.activityDescription}` : req.activityCode);
  row('Dirección del negocio', req.address);
  row('Cantón de la patente', r?.municipality.municipality ?? req.municipality);
  row('Empleados estimados', req.estimatedEmployees);

  const stepOf = (agency: string) => txn.steps.find((s) => s.agency === agency);

  heading(AGENCY_LABELS.registro);
  row('Identidad validada', c ? 'Sí' : 'No');
  row('Referencia de intercambio', stepOf('registro')?.exchangeId);

  heading(AGENCY_LABELS.tributacion);
  row('NITE', r?.tax.nite);
  row('Régimen', r ? REGIME[r.tax.taxRegime] ?? r.tax.taxRegime : undefined);
  row('Estado', r?.tax.status === 'active' ? 'Activo' : r?.tax.status);
  row('Fecha de inscripción', fmtDate(r?.tax.registrationDate));
  row('Referencia de intercambio', stepOf('tributacion')?.exchangeId);

  heading(AGENCY_LABELS.ccss);
  row('Número patronal', r?.ccss.employerNumber);
  row('Tipo de inscripción', r ? REGISTRATION[r.ccss.registrationType] ?? r.ccss.registrationType : undefined);
  row('Fecha de inscripción', fmtDate(r?.ccss.registrationDate));
  row('Cuota mensual estimada', r ? CRC.format(r.ccss.monthlyContributionRateCrc) : undefined);
  row('Referencia de intercambio', stepOf('ccss')?.exchangeId);

  heading(`${AGENCY_LABELS.municipalidad}${r ? ` de ${r.municipality.municipality}` : ''}`);
  row('Número de patente', r?.municipality.patenteNumber);
  row('Fecha de emisión', fmtDate(r?.municipality.issueDate));
  row('Vence el', fmtDate(r?.municipality.expiryDate));
  row('Tarifa anual', r ? CRC.format(r.municipality.annualFeeCrc) : undefined);
  row('Referencia de intercambio', stepOf('municipalidad')?.exchangeId);

  heading('Beneficios estimados del trámite en línea');
  row('Visitas presenciales evitadas', r?.benefits.tripsAvoided);
  row('Horas ahorradas', r?.benefits.hoursSaved);
  row('Costo evitado', r ? CRC.format(r.benefits.costSavedCrc) : undefined);
  doc.moveDown(0.3).font('Helvetica').fontSize(9).fillColor('#444')
    .text(`Datos reutilizados sin volver a digitarlos (principio «una sola vez»): ${r ? r.onceOnly.length : 0} campos.`)
    .fillColor('#000');

  heading('Referencias de auditoría');
  doc.font('Helvetica').fontSize(9).fillColor('#444')
    .text('Cada intercambio de datos entre instituciones pasó por el bus de interoperabilidad y quedó registrado con el identificador siguiente.')
    .fillColor('#000').moveDown(0.3);
  for (const s of txn.steps) {
    doc.font('Helvetica').fontSize(10).text(`• ${s.exchangeId ?? '—'}  —  ${AGENCY_LABELS[s.agency]} · ${s.label} · ${fmtDate(s.finishedAt)}`);
  }

  doc.moveDown(1.5).font('Helvetica-Oblique').fontSize(8).fillColor('#666')
    .text('PuraVidaGov es una demostración técnica. No es un sistema del Gobierno de Costa Rica.', { align: 'center' });

  return doc;
}
