/**
 * Workflow registry. Data, not code: add a life event by writing `<id>.ts` and listing it here.
 * Catalogue-only entries (`available:false`) keep a legal note so the dashboard and /marco-legal can
 * explain what it would take, but have no fields, no steps and cannot be started.
 */
import type { WorkflowDefinition } from '@pvg/shared';
import { z } from 'zod';
import { startBusiness } from './start-business.js';
import { newborn } from './newborn.js';
import { construction } from './construction.js';
import { move } from './move.js';
import { toDefinition, type WorkflowSpec } from './types.js';

const driverLicense: WorkflowSpec = {
  id: 'driver-license',
  title: 'Renovar licencia de conducir',
  titleEn: 'Renew driving licence',
  description:
    'Renovación con verificación de identidad y del dictamen médico sin presentar documentos. Todavía no disponible: COSEVI exige cita presencial.',
  descriptionEn:
    'Renewal with identity and medical-certificate checks without presenting documents. Not yet available: COSEVI requires an in-person appointment.',
  available: false,
  agencies: ['registro', 'municipalidad'],
  legal: {
    status: 'parcial',
    today:
      'COSEVI ya permite pagar la renovación en línea y consultar el estado de la licencia, y la identidad se valida con la cédula y la firma digital (Ley 8454). Pero la Ley 9078 exige un dictamen médico que hoy se entrega en papel y una cita presencial para la fotografía, aunque el Registro Civil ya tiene la foto de la cédula.',
    todayEn:
      'COSEVI already lets you pay the renewal online and check the licence status, and identity is validated with the cédula and the digital signature (Ley 8454). But Ley 9078 requires a medical certificate delivered on paper and an in-person appointment for the photo, even though the Civil Registry already holds the cédula photo.',
    gap: 'Un reglamento que acepte el dictamen médico firmado digitalmente por el médico y reutilice la fotografía del Registro Civil, al estilo del perfil MyInfo de Singapur, donde la agencia toma los datos que el Estado ya tiene.',
    gapEn: 'A regulation accepting the medical certificate digitally signed by the doctor and reusing the Civil Registry photo, in the style of Singapore\'s MyInfo profile, where the agency takes the data the State already holds.',
    basis: ['cr-9078', 'cr-8454'],
    model: ['sg-myinfo'],
  },
  fields: [],
  steps: [],
  benefits: { tripsAvoided: 2, hoursSaved: 4, costSavedCrc: 15000, daysTraditional: 15, daysDigital: 1 },
  traditional: 'Consultorio médico para el dictamen, banco para el pago y sede de COSEVI para la fotografía: tres filas y una cita que puede tardar semanas.',
  traditionalEn: 'A doctor for the certificate, a bank for the payment and a COSEVI office for the photo: three queues and an appointment that can take weeks.',
  consentText: 'Al continuar, usted autorizaría compartir sus datos con el Registro Civil y COSEVI únicamente para renovar su licencia.',
  inputSchema: z.object({}),
  result: () => ({ headline: '', headlineEn: '', summary: '', cards: [], onceOnly: [] }),
};

const pension: WorkflowSpec = {
  id: 'pension',
  title: 'Solicitar pensión',
  titleEn: 'Apply for a pension',
  description:
    'Solicitud de pensión IVM con el historial de cuotas que la CCSS ya tiene y el saldo del ROP de su operadora. Todavía no disponible.',
  descriptionEn:
    'IVM pension application using the contribution history the CCSS already holds and the ROP balance from your operator. Not yet available.',
  available: false,
  agencies: ['registro', 'ccss', 'tributacion'],
  legal: {
    status: 'parcial',
    today:
      'La CCSS resuelve la pensión IVM con su propio historial de cuotas (Ley 17) y el ROP lo administra la operadora bajo la Ley 7983. Hoy la persona debe presentarse en la sucursal con la cédula y constancias que la propia CCSS emitió, y pedir aparte el retiro del ROP a la operadora.',
    todayEn:
      'The CCSS decides the IVM pension from its own contribution history (Ley 17) and the ROP is run by the operator under Ley 7983. Today the person must show up at a branch with the cédula and certificates the CCSS itself issued, and separately request the ROP withdrawal from the operator.',
    gap: 'Un mandato de intercambio entre la CCSS, las operadoras (SUPEN) y el Registro Civil para que la solicitud se inicie con un clic y los datos viajen entre registros, como el «una sola vez» estonio y el evento de vida «me jubilo» de LifeSG.',
    gapEn: 'A data-sharing mandate between the CCSS, the pension operators (SUPEN) and the Civil Registry so the application starts with one click and data travels between registries, as in Estonia\'s once-only rule and LifeSG\'s "retiring" life event.',
    basis: ['cr-7983', 'cr-17'],
    model: ['ee-pia', 'sg-myinfo'],
  },
  fields: [],
  steps: [],
  benefits: { tripsAvoided: 3, hoursSaved: 6, costSavedCrc: 20000, daysTraditional: 90, daysDigital: 5 },
  traditional: 'Sucursal de la CCSS con cédula y constancias, más un trámite aparte con la operadora de pensiones: dos ventanillas y hasta tres meses de espera.',
  traditionalEn: 'A CCSS branch with the cédula and certificates, plus a separate procedure with the pension operator: two windows and up to three months of waiting.',
  consentText: 'Al continuar, usted autorizaría compartir sus datos con el Registro Civil, la CCSS y su operadora de pensiones únicamente para tramitar su pensión.',
  inputSchema: z.object({}),
  result: () => ({ headline: '', headlineEn: '', summary: '', cards: [], onceOnly: [] }),
};

export const WORKFLOWS: WorkflowSpec[] = [startBusiness, newborn, construction, move, driverLicense, pension];

export function getWorkflow(id: string): WorkflowSpec | undefined {
  return WORKFLOWS.find((w) => w.id === id);
}

export function listDefinitions(): WorkflowDefinition[] {
  return WORKFLOWS.map(toDefinition);
}
