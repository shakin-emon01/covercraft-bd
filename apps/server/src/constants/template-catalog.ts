export type TemplateCategory = 'ASSIGNMENT' | 'LAB_REPORT' | 'BOTH';

export interface CoverTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  supportsLogo: boolean;
  customizableFields: string[];
}

export interface ColorPalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

export const TEMPLATE_CATALOG: CoverTemplate[] = [
  {
    id: '1',
    name: 'Academic Precision',
    description: 'Formal serif layout inspired by classic printed university covers.',
    category: 'BOTH',
    supportsLogo: true,
    customizableFields: ['coverType', 'topicNo', 'topicName', 'courseCode', 'courseTitle'],
  },
  {
    id: '2',
    name: 'Sophisticated Student',
    description: 'Soft elegant wave-based layout with refined academic spacing.',
    category: 'BOTH',
    supportsLogo: true,
    customizableFields: ['coverType', 'topicNo', 'topicName', 'courseCode', 'courseTitle'],
  },
  {
    id: '3',
    name: 'Polished Modern Tech',
    description: 'Modern geometric styling with structured cards and balanced contrast.',
    category: 'BOTH',
    supportsLogo: true,
    customizableFields: ['coverType', 'topicNo', 'topicName', 'courseCode', 'courseTitle'],
  },
  {
    id: '4',
    name: 'Classic Scholarly Frame',
    description: 'Traditional framed composition with deep scholarly aesthetics.',
    category: 'BOTH',
    supportsLogo: true,
    customizableFields: ['coverType', 'topicNo', 'topicName', 'courseCode', 'courseTitle'],
  },
  {
    id: '5',
    name: 'Minimal Academic Prestige',
    description: 'Double-line clean presentation for minimal but premium print output.',
    category: 'BOTH',
    supportsLogo: true,
    customizableFields: ['coverType', 'topicNo', 'topicName', 'courseCode', 'courseTitle'],
  },
  {
    id: '6',
    name: 'Modern Luxury Academic',
    description: 'Luxurious minimal heading structure with subtle decorative accents.',
    category: 'BOTH',
    supportsLogo: true,
    customizableFields: ['coverType', 'topicNo', 'topicName', 'courseCode', 'courseTitle'],
  },
  {
    id: '7',
    name: 'Bold Geometric Academic',
    description: 'Angular, high-impact visual hierarchy for modern academic branding.',
    category: 'BOTH',
    supportsLogo: true,
    customizableFields: ['coverType', 'topicNo', 'topicName', 'courseCode', 'courseTitle'],
  },
  {
    id: '8',
    name: 'Organic Academic Elegance',
    description: 'Nature-inspired smooth curves blended with formal academic structure.',
    category: 'BOTH',
    supportsLogo: true,
    customizableFields: ['coverType', 'topicNo', 'topicName', 'courseCode', 'courseTitle'],
  },
  {
    id: '9',
    name: 'Southeast Ribbon',
    description: 'Blue bordered assignment style with bold title ribbon and clean subject boxes.',
    category: 'BOTH',
    supportsLogo: true,
    customizableFields: ['coverType', 'topicNo', 'topicName', 'courseCode', 'courseTitle'],
  },
  {
    id: '10',
    name: 'Dhaka Heritage',
    description: 'Classic monochrome composition with center alignment and formal typography.',
    category: 'BOTH',
    supportsLogo: true,
    customizableFields: ['coverType', 'topicNo', 'topicName', 'courseCode', 'courseTitle'],
  },
  {
    id: '11',
    name: 'Rajshahi Split Panel',
    description: 'Two-column submitted-by/submitted-to table layout with compact hierarchy.',
    category: 'BOTH',
    supportsLogo: true,
    customizableFields: ['coverType', 'topicNo', 'topicName', 'courseCode', 'courseTitle'],
  },
  {
    id: '12',
    name: 'Leading Emerald',
    description: 'Green framed layout with alternating information cards and bright title badge.',
    category: 'BOTH',
    supportsLogo: true,
    customizableFields: ['coverType', 'topicNo', 'topicName', 'courseCode', 'courseTitle'],
  },
  {
    id: '13',
    name: 'Minimal Gray Print',
    description: 'Soft gray printable structure for assignment and lab report covers.',
    category: 'BOTH',
    supportsLogo: true,
    customizableFields: ['coverType', 'topicNo', 'topicName', 'courseCode', 'courseTitle'],
  },
];

export const COLOR_PALETTES: ColorPalette[] = [
  { id: 'blue', name: 'Royal Blue', primary: '#1a3a6b', secondary: '#2563eb', accent: '#60a5fa', background: '#f0f5ff' },
  { id: 'green', name: 'Forest Green', primary: '#14532d', secondary: '#16a34a', accent: '#4ade80', background: '#f0fdf4' },
  { id: 'maroon', name: 'Maroon Gold', primary: '#7f1d1d', secondary: '#b91c1c', accent: '#fbbf24', background: '#fff7ed' },
  { id: 'purple', name: 'Deep Purple', primary: '#3b0764', secondary: '#7c3aed', accent: '#c084fc', background: '#faf5ff' },
  { id: 'teal', name: 'Teal Steel', primary: '#134e4a', secondary: '#0d9488', accent: '#2dd4bf', background: '#f0fdfa' },
  { id: 'navy', name: 'Navy Crimson', primary: '#0f172a', secondary: '#1e3a5f', accent: '#ef4444', background: '#f8fafc' },
  { id: 'brown', name: 'Chocolate', primary: '#451a03', secondary: '#92400e', accent: '#f59e0b', background: '#fffbeb' },
  { id: 'slate', name: 'Slate Gray', primary: '#1e293b', secondary: '#475569', accent: '#94a3b8', background: '#f1f5f9' },
];

export const ALLOWED_TEMPLATE_IDS = new Set(TEMPLATE_CATALOG.map((template) => template.id));
export const ALLOWED_PALETTE_IDS = new Set(COLOR_PALETTES.map((palette) => palette.id));
