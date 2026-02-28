"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_PALETTE_IDS = exports.ALLOWED_TEMPLATE_IDS = exports.COLOR_PALETTES = exports.TEMPLATE_CATALOG = void 0;
exports.TEMPLATE_CATALOG = [
    { id: '1', name: 'Academic Precision', description: 'Formal serif cover inspired by classic printed style' },
    { id: '2', name: 'Sophisticated Wave', description: 'Soft elegant wave and premium academic composition' },
    { id: '3', name: 'Classic Scholarly Frame', description: 'Framed scholarly look with heritage aesthetics' },
    { id: '4', name: 'Minimal Academic Prestige', description: 'Double-line minimal premium print layout' },
    { id: '5', name: 'Organic Elegance', description: 'Nature-inspired smooth curves and soft structure' },
    { id: '6', name: 'Southeast Ribbon', description: 'Bordered assignment style with bold title ribbon' },
    { id: '7', name: 'Dhaka Heritage', description: 'Classic monochrome composition with center alignment' },
    { id: '8', name: 'Rajshahi Panel', description: 'Two-column submitted-by/to table layout' },
    { id: '9', name: 'Minimal Gray Print', description: 'Soft gray printable structure for lab reports' },
    { id: '10', name: 'DU Official', description: 'Exact replica of Dhaka University formal standard format' },
    { id: '11', name: 'DIU Official', description: 'Exact replica of Daffodil International University format' },
    { id: '12', name: 'JU Official', description: 'Exact replica of Jahangirnagar University rounded format' },
    { id: '13', name: 'Polished Modern Tech', description: 'Angled geometric overlays with sleek sans-serif typography' },
    { id: '14', name: 'Modern Luxury', description: 'Minimalist layout with elegant fonts and gold accents' },
    { id: '15', name: 'Bold Geometric', description: 'Strong colored geometric header and footer blocks' },
];
exports.COLOR_PALETTES = [
    { id: "blue", name: "Royal Blue", primary: "#1a3a6b", secondary: "#2563eb", accent: "#60a5fa", bg: "#f0f5ff" },
    { id: "green", name: "Forest Green", primary: "#14532d", secondary: "#16a34a", accent: "#4ade80", bg: "#f0fdf4" },
    { id: "maroon", name: "Maroon Gold", primary: "#7f1d1d", secondary: "#b91c1c", accent: "#fbbf24", bg: "#fff7ed" },
    { id: "purple", name: "Deep Purple", primary: "#3b0764", secondary: "#7c3aed", accent: "#c084fc", bg: "#faf5ff" },
    { id: "teal", name: "Teal Steel", primary: "#134e4a", secondary: "#0d9488", accent: "#2dd4bf", bg: "#f0fdfa" },
    { id: "navy", name: "Navy Crimson", primary: "#0f172a", secondary: "#1e3a5f", accent: "#ef4444", bg: "#f8fafc" },
    { id: "brown", name: "Chocolate", primary: "#451a03", secondary: "#92400e", accent: "#f59e0b", bg: "#fffbeb" },
    { id: "slate", name: "Slate Gray", primary: "#1e293b", secondary: "#475569", accent: "#94a3b8", bg: "#f1f5f9" },
];
// Dynamically generate sets for validation (so it automatically supports up to 15)
exports.ALLOWED_TEMPLATE_IDS = new Set(exports.TEMPLATE_CATALOG.map(t => t.id));
exports.ALLOWED_PALETTE_IDS = new Set(exports.COLOR_PALETTES.map(p => p.id));
