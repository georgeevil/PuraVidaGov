import type { AgencyName } from '@pvg/shared';

export interface LifeEvent {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  available: boolean;
  /** Agencies the event orchestrates (or would orchestrate) through the bus. */
  agencies: AgencyName[];
}

/** Life-event catalogue shown on the dashboard. Data, not code: add events here. */
export const SERVICES: LifeEvent[] = [
  {
    id: 'start-business',
    title: 'Iniciar un negocio',
    titleEn: 'Start a business',
    description:
      'Inscriba su negocio ante Tributación, la CCSS y la municipalidad en un solo trámite, sin volver a digitar sus datos personales.',
    descriptionEn:
      'Register your business with the tax authority, social security and the municipality in one procedure, without retyping your personal data.',
    available: true,
    agencies: ['registro', 'tributacion', 'ccss', 'municipalidad'],
  },
  {
    id: 'newborn',
    title: 'Registrar un recién nacido',
    titleEn: 'Register a newborn',
    description: 'Inscripción de nacimiento, aseguramiento en la CCSS y cédula de menor en un solo paso.',
    descriptionEn: 'Birth registration, CCSS coverage and minor ID in one step.',
    available: false,
    agencies: ['registro', 'ccss'],
  },
  {
    id: 'move',
    title: 'Cambiar de domicilio',
    titleEn: 'Change of address',
    description: 'Actualice su dirección una sola vez y notifique al Registro Civil, Tributación y la municipalidad.',
    descriptionEn: 'Update your address once and notify the civil registry, tax authority and municipality.',
    available: false,
    agencies: ['registro', 'tributacion', 'municipalidad'],
  },
  {
    id: 'driver-license',
    title: 'Renovar licencia de conducir',
    titleEn: 'Renew driving licence',
    description: 'Renovación con verificación de identidad y de deudas municipales sin presentar documentos.',
    descriptionEn: 'Renewal with identity and municipal-debt checks without presenting documents.',
    available: false,
    agencies: ['registro', 'municipalidad'],
  },
  {
    id: 'pension',
    title: 'Solicitar pensión',
    titleEn: 'Apply for a pension',
    description: 'Solicitud de pensión con historial de cotizaciones de la CCSS y verificación de identidad.',
    descriptionEn: 'Pension application using CCSS contribution history and identity verification.',
    available: false,
    agencies: ['registro', 'ccss', 'tributacion'],
  },
];
