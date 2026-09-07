/** Small CIIU-inspired activity catalogue used by the demo (Tributación + Municipalidad). */
export interface Activity {
  code: string;
  description: string; // es-CR
  descriptionEn: string;
  /** Annual municipal patente fee in CRC used by the municipal mock. */
  baseFeeCrc: number;
}

export const ACTIVITIES: Activity[] = [
  { code: '5610', description: 'Restaurantes, cafeterías y sodas', descriptionEn: 'Restaurants and cafés', baseFeeCrc: 85000 },
  { code: '4711', description: 'Venta al por menor en pulperías y minisúper', descriptionEn: 'Retail in convenience stores', baseFeeCrc: 60000 },
  { code: '5510', description: 'Hospedaje: hoteles, cabinas y hostales', descriptionEn: 'Accommodation', baseFeeCrc: 120000 },
  { code: '6201', description: 'Desarrollo de software y consultoría informática', descriptionEn: 'Software development', baseFeeCrc: 45000 },
  { code: '9602', description: 'Salones de belleza y barberías', descriptionEn: 'Beauty salons and barbers', baseFeeCrc: 40000 },
  { code: '4923', description: 'Transporte de carga por carretera', descriptionEn: 'Road freight transport', baseFeeCrc: 95000 },
  { code: '0111', description: 'Cultivo de granos, hortalizas y frutas', descriptionEn: 'Crop farming', baseFeeCrc: 30000 },
  { code: '7911', description: 'Agencias de viajes y tour operadores', descriptionEn: 'Travel agencies and tour operators', baseFeeCrc: 70000 },
];

export function findActivity(code: string): Activity | undefined {
  return ACTIVITIES.find((a) => a.code === code);
}
