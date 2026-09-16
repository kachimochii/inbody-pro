export type FoodCategory = 'verdura' | 'proteina' | 'carbo' | 'grasa' | 'otro';

export interface FoodItem {
  id: string;
  name: string;
  cal: number;
  sub: string;
  category: FoodCategory;
}

export interface MealSection {
  id: MealId;
  name: string;
}

export type MealId = 'desayuno' | 'almuerzo' | 'merienda' | 'snack';

export interface SelectedFood {
  qty: number;
  cal: number;
  sub: string;
  category?: FoodCategory;
}

export type MealData = Record<MealId, Record<string, SelectedFood>>;

export const MEAL_SECTIONS: MealSection[] = [
  { id: 'desayuno', name: 'Desayuno' },
  { id: 'almuerzo', name: 'Almuerzo' },
  { id: 'merienda', name: 'Merienda' },
  { id: 'snack', name: 'Snack / Apetito (Opcional)' },
];

export const EMPTY_MEAL_DATA = (): MealData => ({
  desayuno: {},
  almuerzo: {},
  merienda: {},
  snack: {},
});

export const FOOD_CATEGORY_META: Record<
  FoodCategory,
  { label: string; color: string; chip: string; bar: string }
> = {
  verdura: {
    label: 'Verdura',
    color: '#10B981',
    chip: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    bar: 'bg-emerald-500',
  },
  proteina: {
    label: 'Proteína',
    color: '#3B82F6',
    chip: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    bar: 'bg-blue-500',
  },
  carbo: {
    label: 'Carbo',
    color: '#F59E0B',
    chip: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    bar: 'bg-amber-500',
  },
  grasa: {
    label: 'Grasa',
    color: '#EC4899',
    chip: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    bar: 'bg-pink-500',
  },
  otro: {
    label: 'Otro',
    color: '#94A3B8',
    chip: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    bar: 'bg-slate-500',
  },
};

function slugId(name: string, i: number): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return `food-${base || 'item'}-${i}`;
}

const RAW: Array<[string, number, string, FoodCategory]> = [
  // PANES Y DULCES → carbo / grasa
  ['Pan de agua', 140, '1 unidad (50g)', 'carbo'],
  ['Pan de leche', 140, '1 unidad (50g)', 'carbo'],
  ['Pan de mesa', 140, '1 unidad (50g)', 'carbo'],
  ['Pan de chocolate', 210, '1 unidad (60g)', 'carbo'],
  ['Dona', 210, '1 unidad (60g)', 'carbo'],
  ['Empanada de viento', 220, '1 unidad', 'carbo'],
  ['Empanada chilena', 220, '1 unidad', 'carbo'],
  ['Empanada de crema', 220, '1 unidad', 'carbo'],
  ['Bastón de hojaldre', 190, '1 unidad', 'carbo'],
  ['Bastón con chocolate', 190, '1 unidad', 'carbo'],
  ['Pancake', 160, '1 unidad', 'carbo'],
  ['Moncaiba', 160, '1 unidad', 'carbo'],
  ['Cortada con mermelada', 160, '1 unidad', 'carbo'],
  ['Tres leches', 220, '1 porción', 'grasa'],
  ['Flan', 220, '1 porción', 'grasa'],
  ['Helado', 220, '1 porción', 'grasa'],
  ['Gelatina con crema chantilly', 220, '1 porción', 'grasa'],
  ['Buñuelos con queso y miel', 280, '1 porción', 'carbo'],
  ['Galletas empaquetadas', 150, '1 paquete', 'carbo'],
  ['Canguil', 110, '1 porción', 'carbo'],
  ['Tapioca', 110, '1 porción', 'carbo'],

  // PROTEÍNAS Y PLATOS
  ['Arroz marinero', 420, 'Porción 250g', 'proteina'],
  ['Cazuela de mariscos', 420, 'Porción 250g', 'proteina'],
  ['Encocado de pescado/camarón', 420, 'Porción 250g', 'proteina'],
  ['Hornado', 520, 'Con cuero y mote (250g)', 'proteina'],
  ['Chugchucara', 520, 'Porción completa (250g)', 'proteina'],
  ['Fritada', 520, 'Con mote (250g)', 'proteina'],
  ['Bandera con guatita', 480, 'Porción 350ml/g', 'proteina'],
  ['Encebollado mixto con canguil', 480, 'Porción 350ml/g', 'proteina'],
  ['1/4 de Pollo al horno', 380, '1 presa grande', 'proteina'],
  ['1/4 de Pollo broaster', 380, '1 presa grande', 'proteina'],
  ['1/4 de Pollo frito', 380, '1 presa grande', 'proteina'],
  ['Pollo en salsa de champiñones', 320, 'Porción 200g', 'proteina'],
  ['Pollo en salsa BBQ', 320, 'Porción 200g', 'proteina'],
  ['Pollo en salsa de mostaza', 320, 'Porción 200g', 'proteina'],
  ['Pollo en salsa de Coca Cola', 320, 'Porción 200g', 'proteina'],
  ['Pollo al jugo / Estofado / Seco', 290, 'Porción 200g', 'proteina'],
  ['Chuleta frita / en salsa', 340, 'Porción 170g', 'proteina'],
  ['Chancho en salsa (BBQ/Agridulce)', 350, 'Porción 170g', 'proteina'],
  ['Estofado / Seco de chancho', 320, 'Porción 180g', 'proteina'],
  ['Carne apanada / Bistec / Frita', 280, 'Porción 150g', 'proteina'],
  ['Carne a la plancha / Asada', 240, 'Porción 140g', 'proteina'],
  ['Estofado / Seco de carne', 320, 'Porción 180g', 'proteina'],
  ['Corvina / Tilapia / Pescado frito', 270, 'Filete 150g', 'proteina'],
  ['Pescado sudado / Salsa blanca', 230, 'Porción 180g', 'proteina'],
  ['Deditos de pescado', 220, 'Porción 120g', 'proteina'],
  ['Ceviche de camarón', 210, 'Porción 250g', 'proteina'],

  // CARBOHIDRATOS
  ['Arroz blanco', 260, '1 cuchareta (180g)', 'carbo'],
  ['Arroz amarillo', 260, '1 cuchareta (180g)', 'carbo'],
  ['Arroz verde', 260, '1 cuchareta (180g)', 'carbo'],
  ['Arroz moro (fréjol/lenteja y queso)', 290, '1 cuchareta (180g)', 'carbo'],
  ['Tallarín en salsa / estofado', 310, 'Porción 200g', 'carbo'],
  ['Menestra de lenteja o fréjol', 180, '1 cucharón (150g)', 'carbo'],

  // TUBÉRCULOS
  ['Tigrillo / Bolón de chicharrón', 380, 'Porción 180g', 'carbo'],
  ['Tigrillo / Majado de verde sencillo', 280, 'Porción 150g', 'carbo'],
  ['Muchín de yuca', 260, '1 unidad', 'carbo'],
  ['Empanada de verde (carne/pollo)', 260, '1 unidad', 'carbo'],
  ['Tortilla de verde / maduro / papa', 180, '1 unidad', 'carbo'],
  ['Deditos de verde / Patacones', 220, 'Porción (100g)', 'carbo'],
  ['Yuca frita', 250, 'Porción (130g)', 'carbo'],
  ['Yuca cocinada', 180, 'Porción (150g)', 'carbo'],
  ['Maduro frito / Chifles', 220, 'Porción (100g)', 'carbo'],
  ['Maduro cocinado / Choclo cocinado', 130, 'Porción (120g)', 'carbo'],
  ['Puré de papa / Papa dorada', 190, 'Porción (150g)', 'carbo'],
  ['Papa cocinada / Entera', 140, '2 papas med. (160g)', 'carbo'],
  ['Papas fritas', 290, 'Porción (120g)', 'carbo'],
  ['Mote sucio / Mote pillo', 240, 'Porción (150g)', 'carbo'],
  ['Mote cocinado / Tostado', 160, 'Porción (100g)', 'carbo'],
  ['Humita', 220, '1 unidad', 'carbo'],
  ['Quimbolito', 220, '1 unidad', 'carbo'],

  // SOPAS
  ['Tapado arrecho / Caldo de pata / Bola', 380, 'Tazón 350ml', 'proteina'],
  ['Sancocho / Menestrón de fréjol', 280, 'Tazón 300ml', 'proteina'],
  ['Sopa de quinua / Morocho / Avena', 220, 'Tazón 300ml', 'carbo'],
  ['Sopa de fideo / Crema de brócoli', 190, 'Tazón 300ml', 'verdura'],
  ['Consomé de pollo con arrocillo', 160, 'Tazón 300ml', 'proteina'],

  // HUEVOS Y LÁCTEOS
  ['Huevo frito', 110, '1 unidad', 'proteina'],
  ['Huevo cocinado / Duro', 75, '1 unidad', 'proteina'],
  ['Yogurt en funda / vaso', 175, '1 envase (200ml)', 'proteina'],
  ['Yogurt con cereal', 200, '1 envase', 'proteina'],
  ['Leche entera / Café con leche', 110, '1 vaso/taza', 'proteina'],
  ['Arroz con leche', 180, '1 vaso', 'carbo'],

  // BEBIDAS
  ['Colada de máchica / plátano / Quaker', 160, '1 vaso (250ml)', 'carbo'],
  ['Gatorade', 80, '1 envase (250ml)', 'otro'],
  ['Jugo natural con azúcar', 110, '1 vaso (250ml)', 'carbo'],
  ['Jugo comercial (funda/cartón)', 95, '1 envase', 'carbo'],
  ['Limonada / Agua de Jamaica', 80, '1 vaso con azúcar', 'otro'],
  ['Agua aromática con azúcar', 45, '1 taza', 'otro'],
  ['Café negro con azúcar', 40, '1 taza', 'otro'],

  // ENSALADAS Y FRUTAS
  ['Ensalada Rusa', 180, 'Porción (120g)', 'verdura'],
  ['Ensalada de frutas', 95, '1 compotera', 'verdura'],
  ['Manzana verde / Mandarina / Naranja / Pera', 60, '1 unidad', 'verdura'],
  ['Ensalada fresca de verdura', 35, 'Porción', 'verdura'],
  ['Curtido / Encurtido', 30, 'Porción', 'verdura'],
  ['Aguacate / Rodaja de tomate', 30, 'Porción', 'grasa'],
  ['Ají de rancho', 15, '1 cucharada', 'verdura'],
];

/** Catálogo base (seed Firebase / fallback offline) */
export const FOOD_DATABASE: FoodItem[] = RAW.map(([name, cal, sub, category], i) => ({
  id: slugId(name, i + 1),
  name,
  cal,
  sub,
  category,
}));
