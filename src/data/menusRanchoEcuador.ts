/**
 * Menús reales de rancho militar ESFORSFT (agosto 2026).
 * Generado por extraer_menus_rancho.py — no editar a mano.
 */
import { EMPTY_MEAL_DATA, FoodItem, MealData, MealId } from './foodDatabase';

export interface MenuRanchoDia {
  diaNumero: number;
  tituloPlatoPrincipal: string;
  desayuno: string;
  refrigerio: string;
  almuerzo: { sopa: string; segundo: string; bebidaPostre: string };
  merienda: { plato: string; bebida: string };
  alimentosIdsSugeridos: Record<MealId, string[]>;
}

export const MENUS_RANCHO_ECUADOR: MenuRanchoDia[] = [
  {
    diaNumero: 1,
    tituloPlatoPrincipal: 'Chuleta en Salsa de Maracuyá, Consomé de Pollo y Estofado de Carne',
    desayuno: 'Arroz, Estofado de Carne, Majado de Verde, Ensalada de Frutas, Pan, Huevo Cocinado, Yogurt en funda, Avena de Maracuyá',
    refrigerio: 'Pan de Chocolate, Jugo en funda',
    almuerzo: {
      sopa: 'Consomé de Pollo',
      segundo: 'Arroz, Chuleta en Salsa de Maracuyá, Ensalada',
      bebidaPostre: 'Jugo de Mora, Moncaiba',
    },
    merienda: {
      plato: 'Arroz, Chancho en Salsa BBQ, Yuca Frita, Ensalada',
      bebida: 'Agua Aromática de Manzanilla, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-estofado-seco-de-carne-43', 'food-tigrillo-majado-de-verde-sencillo-55', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-huevo-cocinado-duro-77', 'food-yogurt-en-funda-vaso-78', 'food-sopa-de-quinua-morocho-avena-73'],
      almuerzo: ['food-consome-de-pollo-con-arrocillo-75', 'food-arroz-blanco-48', 'food-chuleta-frita-en-salsa-38', 'food-ensalada-fresca-de-verdura-92', 'food-jugo-natural-con-azucar-84', 'food-moncaiba-12'],
      merienda: ['food-arroz-blanco-48', 'food-chancho-en-salsa-bbq-agridulce-39', 'food-yuca-frita-60', 'food-ensalada-fresca-de-verdura-92', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-pan-de-chocolate-4', 'food-jugo-comercial-funda-carton-85'],
    },
  },
  {
    diaNumero: 2,
    tituloPlatoPrincipal: 'Corvina Frita, Menestra de Lenteja con Queso y Sopa de Avena con Hueso de Res',
    desayuno: 'Arroz, Estofado de Pollo, Maduro Frito, Lechuga, Ensalada de Frutas, Pan, Huevo Cocinado, Yogurt en funda, Colada de Máchica, Pan',
    refrigerio: 'Galletas, Yogurt en funda',
    almuerzo: {
      sopa: 'Sopa de Avena con Hueso de Res',
      segundo: 'Arroz, Corvina Frita, Menestra de Lenteja con Queso, Ensalada, Hojas de Lechuga',
      bebidaPostre: 'Jugo de Naranjilla, Mandarina',
    },
    merienda: {
      plato: 'Arroz, Carne a la Plancha, Puré de Papa, Rodaja de Tomate',
      bebida: 'Agua Aromática de Cedrón, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-pollo-al-jugo-estofado-seco-37', 'food-maduro-frito-chifles-62', 'food-ensalada-fresca-de-verdura-92', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-huevo-cocinado-duro-77', 'food-yogurt-en-funda-vaso-78'],
      almuerzo: ['food-sopa-de-quinua-morocho-avena-73', 'food-arroz-blanco-48', 'food-corvina-tilapia-pescado-frito-44', 'food-menestra-de-lenteja-o-frejol-53', 'food-ensalada-fresca-de-verdura-92', 'food-jugo-natural-con-azucar-84', 'food-manzana-verde-mandarina-naranja-pera-91'],
      merienda: ['food-arroz-blanco-48', 'food-carne-a-la-plancha-asada-42', 'food-pure-de-papa-papa-dorada-64', 'food-aguacate-rodaja-de-tomate-94', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-galletas-empaquetadas-19', 'food-yogurt-en-funda-vaso-78'],
    },
  },
  {
    diaNumero: 3,
    tituloPlatoPrincipal: 'Chuleta a la Plancha, Menestra de Fréjol y Pollo Broaster',
    desayuno: 'Arroz, Seco de Pollo, Maduro Frito, Rodaja de Tomate, Ensalada de Frutas, Pan, Huevo Cocinado, Yogurt en funda, Granola, Avena, Leche, Jugo de Tamarindo',
    refrigerio: 'Yogurt con Cereal',
    almuerzo: {
      sopa: 'Sancocho de Hueso de Res',
      segundo: 'Opción 1: Arroz Moro, Chuleta a la Plancha, Menestra de Fréjol, Ensalada, Papa Salteada · Opción 2: Arroz Moro, Pollo Broaster, Menestra de Fréjol, Ensalada, Papa Salteada',
      bebidaPostre: 'Jugo de Naranjilla, Gelatina',
    },
    merienda: {
      plato: 'Arroz Amarillo, Chancho Agridulce, Puré de Yuca',
      bebida: 'Agua Aromática de Menta, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-pollo-al-jugo-estofado-seco-37', 'food-maduro-frito-chifles-62', 'food-aguacate-rodaja-de-tomate-94', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-huevo-cocinado-duro-77', 'food-yogurt-en-funda-vaso-78'],
      almuerzo: ['food-sancocho-menestron-de-frejol-72', 'food-arroz-moro-frejol-lenteja-y-queso-51', 'food-chuleta-frita-en-salsa-38', 'food-menestra-de-lenteja-o-frejol-53', 'food-ensalada-fresca-de-verdura-92', 'food-1-4-de-pollo-broaster-31', 'food-papa-cocinada-entera-65', 'food-jugo-natural-con-azucar-84'],
      merienda: ['food-arroz-amarillo-49', 'food-chancho-en-salsa-bbq-agridulce-39', 'food-yuca-cocinada-61', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-yogurt-con-cereal-79'],
    },
  },
  {
    diaNumero: 4,
    tituloPlatoPrincipal: '1/4 de Pollo al Horno, Aguacate y Encocado de Albacora',
    desayuno: 'Arroz, Encocado de Albacora, Chifle, Rodaja de Tomate, Ensalada de Frutas, Pan, Huevo Cocinado, Yogurt, Gatorade, Quaker',
    refrigerio: 'Empanada de Verde de Carne o Pollo, Yogurt',
    almuerzo: {
      sopa: '',
      segundo: 'Arroz Verde, 1/4 de Pollo al Horno, Papas Salteadas, Aguacate, Rodaja de Tomate',
      bebidaPostre: 'Jugo de Papaya, Poncake con Crema de Chantillin',
    },
    merienda: {
      plato: 'Arroz, Carne Apanada, Menestra de Lenteja, Ensalada de Zanahoria',
      bebida: 'Agua Aromática de Menta, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-aguacate-rodaja-de-tomate-94', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-huevo-cocinado-duro-77', 'food-yogurt-en-funda-vaso-78', 'food-gatorade-83', 'food-colada-de-machica-platano-quaker-82'],
      almuerzo: ['food-arroz-verde-50', 'food-1-4-de-pollo-al-horno-30', 'food-papa-cocinada-entera-65', 'food-aguacate-rodaja-de-tomate-94', 'food-sopa-de-fideo-crema-de-brocoli-74'],
      merienda: ['food-arroz-blanco-48', 'food-carne-apanada-bistec-frita-41', 'food-menestra-de-lenteja-o-frejol-53', 'food-ensalada-fresca-de-verdura-92', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-empanada-de-verde-carne-pollo-57', 'food-yogurt-en-funda-vaso-78'],
    },
  },
  {
    diaNumero: 5,
    tituloPlatoPrincipal: 'Chuleta a la Plancha con Salsa BBQ, Chuleta en Salsa de Champiñones y Sopa de Quinua con Hueso de Chancho',
    desayuno: 'Arroz, Mote Pillo, Huevo Frito, Estofado de Carne, Ensalada de Frutas, Pan, Yogurt, Jugo de Tamarindo, Leche',
    refrigerio: 'Yogurt con Cereal',
    almuerzo: {
      sopa: 'Sopa de Quinua con Hueso de Chancho',
      segundo: 'Opción 1: Arroz, Chuleta a la Plancha con Salsa BBQ, Papas, Ensalada · Opción 2: Arroz, Chuleta en Salsa de Champiñones, Papas, Ensalada',
      bebidaPostre: 'Jugo de Naranja, Empanada de Crema Pastelera',
    },
    merienda: {
      plato: 'Arroz, Tallarin en Salsa Pomodoro con Pollo, Ensalada',
      bebida: 'Agua Aromática de Manzanilla, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-mote-sucio-mote-pillo-67', 'food-huevo-frito-76', 'food-estofado-seco-de-carne-43', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-yogurt-en-funda-vaso-78', 'food-jugo-natural-con-azucar-84'],
      almuerzo: ['food-sopa-de-fideo-crema-de-brocoli-74', 'food-arroz-blanco-48', 'food-chuleta-frita-en-salsa-38', 'food-papa-cocinada-entera-65', 'food-ensalada-fresca-de-verdura-92', 'food-jugo-natural-con-azucar-84', 'food-empanada-de-viento-6'],
      merienda: ['food-arroz-blanco-48', 'food-tallarin-en-salsa-estofado-52', 'food-ensalada-fresca-de-verdura-92', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-yogurt-con-cereal-79'],
    },
  },
  {
    diaNumero: 6,
    tituloPlatoPrincipal: 'Tapado Arrecho, Seco de Pollo y Majado de Verde',
    desayuno: 'Arroz, Seco de Pollo, Majado de Verde, Huevo Frito, Ensalada de Frutas, Pan, Yogurt, Colada de Máchica',
    refrigerio: 'Yogurt con Cereal',
    almuerzo: {
      sopa: 'Tapado Arrecho',
      segundo: '',
      bebidaPostre: 'Jugo de Tomate de Arbol, Galleta de Chocolate con Coco',
    },
    merienda: {
      plato: 'Arroz, Estofado de Cerdo, Yuca Cocinada, Rodaja de Tomate',
      bebida: 'Agua Aromática Dehierba Luisa, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-pollo-al-jugo-estofado-seco-37', 'food-tigrillo-majado-de-verde-sencillo-55', 'food-huevo-frito-76', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-yogurt-en-funda-vaso-78', 'food-sopa-de-quinua-morocho-avena-73'],
      almuerzo: ['food-tapado-arrecho-caldo-de-pata-bola-71', 'food-jugo-natural-con-azucar-84', 'food-galletas-empaquetadas-19'],
      merienda: ['food-arroz-blanco-48', 'food-estofado-seco-de-chancho-40', 'food-yuca-cocinada-61', 'food-aguacate-rodaja-de-tomate-94', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-yogurt-con-cereal-79'],
    },
  },
  {
    diaNumero: 7,
    tituloPlatoPrincipal: 'Menestra de Lenteja, Filete de Pescado y Deditos de Verde',
    desayuno: 'Arroz, Estofado de Carne, Papa Salteada, Huevo Frito, Rodaja de Tomate, Ensalada de Frutas, Pan, Yogurt, Colada de Platano, Pera',
    refrigerio: 'Tortilla de Maduro, Yogurt',
    almuerzo: {
      sopa: 'Sopa de Fideo con Queso',
      segundo: 'Opción 1: Arroz Amarillo, Menestra de Lenteja, Filete de Pescado, Deditos de Verde, Encurtido · Opción 2: Arroz Amarillo, Menestra de Lenteja, Pescado Sudado, Patacones, Encurtido',
      bebidaPostre: 'Jugo de Guayaba, Manzana Verde',
    },
    merienda: {
      plato: 'Arroz, Pollo Frito, Puré de Papa, Rodaja de Tomate',
      bebida: 'Agua Aromática de Menta, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-estofado-seco-de-carne-43', 'food-papa-cocinada-entera-65', 'food-huevo-frito-76', 'food-aguacate-rodaja-de-tomate-94', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-yogurt-en-funda-vaso-78'],
      almuerzo: ['food-tallarin-en-salsa-estofado-52', 'food-arroz-amarillo-49', 'food-menestra-de-lenteja-o-frejol-53', 'food-deditos-de-verde-patacones-59', 'food-pescado-sudado-salsa-blanca-45', 'food-curtido-encurtido-93', 'food-jugo-natural-con-azucar-84', 'food-manzana-verde-mandarina-naranja-pera-91'],
      merienda: ['food-arroz-blanco-48', 'food-1-4-de-pollo-frito-32', 'food-pure-de-papa-papa-dorada-64', 'food-aguacate-rodaja-de-tomate-94', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-tortilla-de-verde-maduro-papa-58', 'food-yogurt-en-funda-vaso-78'],
    },
  },
  {
    diaNumero: 8,
    tituloPlatoPrincipal: 'Chuleta Frita, Menestra de Fréjol y Sopa de Avena con Hueso de Res',
    desayuno: 'Arroz, Estofado de Chancho, Yuca Frita, Tortilla de Verde, Huevo Frito, Ensalada de Frutas, Pan, Tapioca, Yogurt',
    refrigerio: 'Galleta, Yogurt',
    almuerzo: {
      sopa: 'Sopa de Avena con Hueso de Res',
      segundo: 'Arroz Amarillo, Chuleta Frita, Menestra de Fréjol, Ensalada',
      bebidaPostre: 'Jugo de Tomate de Arbol, Gelatina con Crema Chantillin',
    },
    merienda: {
      plato: 'Arroz, Pollo en Salsa de Champiñones, Papa Salteada, Lechuga',
      bebida: 'Agua Aromática de Menta, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-estofado-seco-de-chancho-40', 'food-yuca-frita-60', 'food-tortilla-de-verde-maduro-papa-58', 'food-huevo-frito-76', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-tapioca-21'],
      almuerzo: ['food-sopa-de-quinua-morocho-avena-73', 'food-arroz-amarillo-49', 'food-chuleta-frita-en-salsa-38', 'food-menestra-de-lenteja-o-frejol-53', 'food-ensalada-fresca-de-verdura-92', 'food-jugo-natural-con-azucar-84', 'food-gelatina-con-crema-chantilly-17'],
      merienda: ['food-arroz-blanco-48', 'food-pollo-en-salsa-de-champinones-33', 'food-papa-cocinada-entera-65', 'food-ensalada-fresca-de-verdura-92', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-galletas-empaquetadas-19', 'food-yogurt-en-funda-vaso-78'],
    },
  },
  {
    diaNumero: 9,
    tituloPlatoPrincipal: 'Pollo en Salsa BBQ, Consomé de Pollo y Encebollado Canguil',
    desayuno: 'Encebollado Canguil, Chifles, Limon, Arroz, Ensalada de Frutas, Pan, Jugo de Tamarindo',
    refrigerio: 'Poncake, Yogurt',
    almuerzo: {
      sopa: 'Consomé de Pollo',
      segundo: 'Arroz Verde, Pollo en Salsa BBQ, Ensalada',
      bebidaPostre: 'Jugo de Naranjilla, Flan',
    },
    merienda: {
      plato: 'Arroz, Cerdo en Salsa Mostaza Miel, Maduro Cocinado, Rodaja de Tomate',
      bebida: 'Agua Aromática de Manzanilla, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-encebollado-mixto-con-canguil-29', 'food-maduro-frito-chifles-62', 'food-arroz-blanco-48', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-jugo-natural-con-azucar-84'],
      almuerzo: ['food-consome-de-pollo-con-arrocillo-75', 'food-arroz-verde-50', 'food-pollo-en-salsa-bbq-34', 'food-ensalada-fresca-de-verdura-92', 'food-jugo-natural-con-azucar-84', 'food-flan-15'],
      merienda: ['food-arroz-blanco-48', 'food-maduro-cocinado-choclo-cocinado-63', 'food-aguacate-rodaja-de-tomate-94', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-yogurt-en-funda-vaso-78'],
    },
  },
  {
    diaNumero: 10,
    tituloPlatoPrincipal: 'Pollo Broaster, Papa Dorada y Carne Apanada',
    desayuno: 'Arroz, Bistec de Carne, Bolon de Chicharron, Encurtido, Ensalada de Frutas, Pan, Huevo Duro, Café, Yogurt',
    refrigerio: 'Cortada Rellena de Mermelada, Yogurt',
    almuerzo: {
      sopa: 'Sopa de Morocho con Hueso de Chancho',
      segundo: 'Opción 1: Arroz, Pollo Broaster, Ensalada Rusa, Papa Dorada · Opción 2: Arroz, Carne Apanada, Papa Dorada, Ensalada Rusa, Papa Dorada',
      bebidaPostre: 'Jugo de Guayaba, Manzana Verde',
    },
    merienda: {
      plato: 'Arroz, Seco de Pollo, Menestra de Lenteja, Rodaja de Tomate',
      bebida: 'Agua Aromática de Hierba Luisa, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-carne-apanada-bistec-frita-41', 'food-tigrillo-bolon-de-chicharron-54', 'food-curtido-encurtido-93', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-huevo-cocinado-duro-77', 'food-cafe-negro-con-azucar-88'],
      almuerzo: ['food-sopa-de-quinua-morocho-avena-73', 'food-arroz-blanco-48', 'food-1-4-de-pollo-broaster-31', 'food-ensalada-rusa-89', 'food-carne-apanada-bistec-frita-41', 'food-pure-de-papa-papa-dorada-64', 'food-jugo-natural-con-azucar-84', 'food-manzana-verde-mandarina-naranja-pera-91'],
      merienda: ['food-arroz-blanco-48', 'food-pollo-al-jugo-estofado-seco-37', 'food-menestra-de-lenteja-o-frejol-53', 'food-aguacate-rodaja-de-tomate-94', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-yogurt-en-funda-vaso-78'],
    },
  },
  {
    diaNumero: 11,
    tituloPlatoPrincipal: 'Chugchucara - Fritada, Cuero Reventado y Maduro Frito',
    desayuno: 'Arroz, Estofado de Carne, Muchin de Yuca, Huevo Duro, Ensalada de Frutas, Pan, Quaker',
    refrigerio: 'Buñuelos con Queso y Miel, Arroz con Leche',
    almuerzo: {
      sopa: '',
      segundo: 'Chugchucara - Fritada, Cuero Reventado, Maduro Frito, Papas Enteras Doradas, Mote, Tostado, Choclo Cocinada, Lechuga, Empanada de Viento, Curtido',
      bebidaPostre: 'Jugo de Jamaica, Baston de Hojaldre y Chocolate',
    },
    merienda: {
      plato: 'Arroz, Tallarin con Estofado de Pollo, Maduro Frito',
      bebida: 'Agua Aromática de Cedrón, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-estofado-seco-de-carne-43', 'food-yuca-cocinada-61', 'food-huevo-cocinado-duro-77', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-colada-de-machica-platano-quaker-82'],
      almuerzo: ['food-fritada-27', 'food-maduro-frito-chifles-62', 'food-papa-cocinada-entera-65', 'food-mote-cocinado-tostado-68', 'food-maduro-cocinado-choclo-cocinado-63', 'food-ensalada-fresca-de-verdura-92', 'food-empanada-de-viento-6', 'food-curtido-encurtido-93'],
      merienda: ['food-arroz-blanco-48', 'food-tallarin-en-salsa-estofado-52', 'food-maduro-frito-chifles-62', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-bunuelos-con-queso-y-miel-18', 'food-arroz-con-leche-81'],
    },
  },
  {
    diaNumero: 12,
    tituloPlatoPrincipal: 'Hornado - Mote, Carne de Cerdo y Tortilla de Papa',
    desayuno: 'Arroz, Manizado de Pescado, Empanada de Verde, Chifles, Curtido, Ensalada de Frutas, Pan, Huevo Duro, Jugo de Naranjilla, Leche, Yogurt',
    refrigerio: 'Yogurt con Cereal',
    almuerzo: {
      sopa: '',
      segundo: 'Hornado - Mote, Carne de Cerdo, Tortilla de Papa, Curtido, Hoja de Lechuga',
      bebidaPostre: 'Te de Jamaica, Helado',
    },
    merienda: {
      plato: 'Arroz, Estofado de Carne, Papa Cocinada, Ensalada',
      bebida: 'Agua Aromática de Manzanilla, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-empanada-de-verde-carne-pollo-57', 'food-maduro-frito-chifles-62', 'food-curtido-encurtido-93', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-huevo-cocinado-duro-77', 'food-jugo-natural-con-azucar-84'],
      almuerzo: ['food-hornado-25', 'food-tortilla-de-verde-maduro-papa-58', 'food-curtido-encurtido-93', 'food-ensalada-fresca-de-verdura-92', 'food-limonada-agua-de-jamaica-86', 'food-helado-16'],
      merienda: ['food-arroz-blanco-48', 'food-estofado-seco-de-carne-43', 'food-papa-cocinada-entera-65', 'food-ensalada-fresca-de-verdura-92', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-yogurt-con-cereal-79'],
    },
  },
  {
    diaNumero: 13,
    tituloPlatoPrincipal: 'Filete de Pescado, Menestra de Lenteja y Yuca Frita',
    desayuno: 'Arroz, Seco de Pollo, Papa Cocinada, Rodaja de Tomate, Ensalada de Frutas, Pan, Huevo Duro, Café, Pan, Huevo Duro, Gatorade',
    refrigerio: 'Galleta de Chocolate, Yogurt',
    almuerzo: {
      sopa: 'Menestron de Fréjol con Hueso de Res',
      segundo: 'Arroz, Filete de Pescado, Menestra de Lenteja, Yuca Frita, Curtido',
      bebidaPostre: 'Jugo de Naranjilla, Helado',
    },
    merienda: {
      plato: 'Arroz, Estofado de Chancho, Maduro Cocinado, Ensalada de Lechuga y Tomate',
      bebida: 'Agua Aromática de Cedrón, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-pollo-al-jugo-estofado-seco-37', 'food-papa-cocinada-entera-65', 'food-aguacate-rodaja-de-tomate-94', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-huevo-cocinado-duro-77', 'food-cafe-negro-con-azucar-88'],
      almuerzo: ['food-sancocho-menestron-de-frejol-72', 'food-arroz-blanco-48', 'food-menestra-de-lenteja-o-frejol-53', 'food-yuca-frita-60', 'food-curtido-encurtido-93', 'food-jugo-natural-con-azucar-84', 'food-helado-16'],
      merienda: ['food-arroz-blanco-48', 'food-estofado-seco-de-chancho-40', 'food-maduro-cocinado-choclo-cocinado-63', 'food-ensalada-fresca-de-verdura-92', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-galletas-empaquetadas-19', 'food-yogurt-en-funda-vaso-78'],
    },
  },
  {
    diaNumero: 14,
    tituloPlatoPrincipal: 'Pollo al Horno en Salsa de Champiñones, Chuleta a la Plancha con Salsa de Piña y Crema de Brocoli',
    desayuno: 'Arroz, Estofado de Carne, Tigrillo, Huevo Frito, Ensalada de Frutas, Pan, Cafe, Yogurt',
    refrigerio: 'Quimbolito, Yogurt',
    almuerzo: {
      sopa: 'Crema de Brocoli, Canguil',
      segundo: 'Opción 1: Arroz Verde, Pollo al Horno en Salsa de Champiñones, Papas Fritas, Ensalada de Remolacha · Opción 2: Arroz Verde, Chuleta a la Plancha con Salsa de Piña, Ensalada de Remolacha',
      bebidaPostre: 'Jugo de Tomate de Arbol, Tres Leches',
    },
    merienda: {
      plato: 'Arroz, Seco de Chancho, Papa Cocinada, Rodaja de Tomate',
      bebida: 'Agua Aromática de Hierba Luisa, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-estofado-seco-de-carne-43', 'food-tigrillo-bolon-de-chicharron-54', 'food-huevo-frito-76', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-cafe-negro-con-azucar-88', 'food-yogurt-en-funda-vaso-78'],
      almuerzo: ['food-sopa-de-fideo-crema-de-brocoli-74', 'food-canguil-20', 'food-arroz-verde-50', 'food-1-4-de-pollo-al-horno-30', 'food-papas-fritas-66', 'food-chuleta-frita-en-salsa-38', 'food-ensalada-fresca-de-verdura-92', 'food-jugo-natural-con-azucar-84'],
      merienda: ['food-arroz-blanco-48', 'food-estofado-seco-de-chancho-40', 'food-papa-cocinada-entera-65', 'food-aguacate-rodaja-de-tomate-94', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-quimbolito-70', 'food-yogurt-en-funda-vaso-78'],
    },
  },
  {
    diaNumero: 15,
    tituloPlatoPrincipal: 'Pollo al Jugo, Papa Cocinada y Sopa de Fideo con Queso',
    desayuno: 'Arroz, Estofado de Carne, Tortilla de Verde, Huevo Frito, Ensalada de Pepino, Ensalada de Frutas, Pan, Avena, Yogurt',
    refrigerio: 'Yogurt con Cereal',
    almuerzo: {
      sopa: 'Sopa de Fideo con Queso',
      segundo: 'Arroz Amarillo, Pollo al Jugo, Papa Cocinada, Ensalada de Lechuga',
      bebidaPostre: 'Jugo de Maracuyá, Manzana',
    },
    merienda: {
      plato: 'Arroz, Deditos de Pescado, Yuca Cocinada, Curtido',
      bebida: 'Agua Aromática de Manzanilla, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-estofado-seco-de-carne-43', 'food-tortilla-de-verde-maduro-papa-58', 'food-huevo-frito-76', 'food-ensalada-fresca-de-verdura-92', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-sopa-de-quinua-morocho-avena-73'],
      almuerzo: ['food-tallarin-en-salsa-estofado-52', 'food-arroz-amarillo-49', 'food-pollo-al-jugo-estofado-seco-37', 'food-papa-cocinada-entera-65', 'food-ensalada-fresca-de-verdura-92', 'food-jugo-natural-con-azucar-84', 'food-manzana-verde-mandarina-naranja-pera-91'],
      merienda: ['food-arroz-blanco-48', 'food-deditos-de-pescado-46', 'food-yuca-cocinada-61', 'food-curtido-encurtido-93', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-yogurt-con-cereal-79'],
    },
  },
  {
    diaNumero: 16,
    tituloPlatoPrincipal: 'Carne Apanada, Papa Frita y Sopa de Avena con Hueso de Res',
    desayuno: 'Arroz, Estofado de Chancho, Papa Cocinada, Huevo Frito, Ensalada de Lechuga, Ensalada de Frutas, Pan, Quaker, Yogurt',
    refrigerio: 'Yogurt, Naranja',
    almuerzo: {
      sopa: 'Sopa de Avena con Hueso de Res',
      segundo: 'Arroz, Carne Apanada, Papa Frita, Ensalada de Remolacha',
      bebidaPostre: 'Jugo de Jamaica, Galleta',
    },
    merienda: {
      plato: 'Arroz, Pollo a la Mostaza, Maduro Cocinado, Ensalada de Pepino',
      bebida: 'Agua Aromática de Cedrón, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-estofado-seco-de-chancho-40', 'food-papa-cocinada-entera-65', 'food-huevo-frito-76', 'food-ensalada-fresca-de-verdura-92', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-colada-de-machica-platano-quaker-82'],
      almuerzo: ['food-sopa-de-quinua-morocho-avena-73', 'food-arroz-blanco-48', 'food-carne-apanada-bistec-frita-41', 'food-papas-fritas-66', 'food-ensalada-fresca-de-verdura-92', 'food-jugo-natural-con-azucar-84', 'food-galletas-empaquetadas-19'],
      merienda: ['food-arroz-blanco-48', 'food-pollo-en-salsa-de-mostaza-35', 'food-maduro-cocinado-choclo-cocinado-63', 'food-ensalada-fresca-de-verdura-92', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-yogurt-en-funda-vaso-78', 'food-manzana-verde-mandarina-naranja-pera-91'],
    },
  },
  {
    diaNumero: 17,
    tituloPlatoPrincipal: 'Chuleta a la Plancha, Maduro Frito y Carne Frita',
    desayuno: 'Arroz, Pescado en Salsa Blanca, Muchin de Yuca, Chifles, Ensalada de Frutas, Pan, Huevo Duro, Leche, Yogurt',
    refrigerio: 'Ensalada de Frutas con Empanada Chilena',
    almuerzo: {
      sopa: 'Caldo de Bola de Verde',
      segundo: 'Opción 1: Arroz, Chuleta a la Plancha, Maduro Frito, Ensalada de Col Morada · Opción 2: Arroz, Carne Frita, Maduro Frito, Ensalada de Col Morada',
      bebidaPostre: 'Jugo de Mora, Baston de Hojaldre',
    },
    merienda: {
      plato: 'Arroz, Pollo con Tallarin en Salsa Pomodoro, Maduro Cocinado',
      bebida: 'Agua Aromática de Menta, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-pescado-sudado-salsa-blanca-45', 'food-yuca-cocinada-61', 'food-maduro-frito-chifles-62', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-huevo-cocinado-duro-77', 'food-leche-entera-cafe-con-leche-80'],
      almuerzo: ['food-tapado-arrecho-caldo-de-pata-bola-71', 'food-arroz-blanco-48', 'food-chuleta-frita-en-salsa-38', 'food-maduro-frito-chifles-62', 'food-carne-apanada-bistec-frita-41', 'food-ensalada-fresca-de-verdura-92', 'food-jugo-natural-con-azucar-84', 'food-baston-de-hojaldre-9'],
      merienda: ['food-arroz-blanco-48', 'food-tallarin-en-salsa-estofado-52', 'food-maduro-cocinado-choclo-cocinado-63', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-empanada-de-viento-6'],
    },
  },
  {
    diaNumero: 18,
    tituloPlatoPrincipal: 'Cazuela de Marisco, Chifle y Canguil',
    desayuno: 'Arroz, Seco de Chancho, Mote Sucio, Ensalada de Frutas, Pan, Huevo Duro, Café Yogurt',
    refrigerio: 'Yogurt, Cereal',
    almuerzo: {
      sopa: '',
      segundo: 'Arroz, Cazuela de Marisco, Chifle, Canguil, Curtido, Limon',
      bebidaPostre: 'Limonada, Helado',
    },
    merienda: {
      plato: 'Arroz, Estofado de Carne, Yuca Cocinada, Ensalada de Pepino',
      bebida: 'Agua Aromática de Toronjil, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-estofado-seco-de-chancho-40', 'food-mote-sucio-mote-pillo-67', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-huevo-cocinado-duro-77', 'food-yogurt-en-funda-vaso-78'],
      almuerzo: ['food-arroz-blanco-48', 'food-canguil-20', 'food-curtido-encurtido-93', 'food-limonada-agua-de-jamaica-86', 'food-helado-16'],
      merienda: ['food-arroz-blanco-48', 'food-estofado-seco-de-carne-43', 'food-yuca-cocinada-61', 'food-ensalada-fresca-de-verdura-92', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-yogurt-en-funda-vaso-78', 'food-yogurt-con-cereal-79'],
    },
  },
  {
    diaNumero: 19,
    tituloPlatoPrincipal: 'Pollo a la Coca Cola, Menestra de Lenteja y Chuleta a la Plancha',
    desayuno: 'Arroz, Seco de Pollo, Humita, Huevo Duro, Rodaja de Tomate, Ensalada de Frutas, Pan, Café Yogurt',
    refrigerio: 'Leche, Dona',
    almuerzo: {
      sopa: 'Caldo de Pata',
      segundo: 'Opción 1: Arroz Verde, Pollo a la Coca Cola, Menestra de Lenteja, Ensalada de Tomate con Lechuga · Opción 2: Arroz Verde, Chuleta a la Plancha, Menestra de Lenteja, Ensalada Tomate Lechuga',
      bebidaPostre: 'Agua de Jamaica, Gelatina',
    },
    merienda: {
      plato: 'Arroz, Estofado de Carne, Papa Cocinada, Rodaja de Tomate',
      bebida: 'Agua Aromática de Cedrón, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-pollo-al-jugo-estofado-seco-37', 'food-humita-69', 'food-huevo-cocinado-duro-77', 'food-aguacate-rodaja-de-tomate-94', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-yogurt-en-funda-vaso-78'],
      almuerzo: ['food-tapado-arrecho-caldo-de-pata-bola-71', 'food-arroz-verde-50', 'food-menestra-de-lenteja-o-frejol-53', 'food-chuleta-frita-en-salsa-38', 'food-ensalada-fresca-de-verdura-92', 'food-limonada-agua-de-jamaica-86', 'food-gelatina-con-crema-chantilly-17'],
      merienda: ['food-arroz-blanco-48', 'food-estofado-seco-de-carne-43', 'food-papa-cocinada-entera-65', 'food-aguacate-rodaja-de-tomate-94', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-leche-entera-cafe-con-leche-80', 'food-dona-5'],
    },
  },
  {
    diaNumero: 20,
    tituloPlatoPrincipal: 'Tilapia Frita, Chifle y Curtido Limonada',
    desayuno: 'Arroz, Seco de Pollo, Yuca Cocinada, Huevo Duro, Ensalada de Lechuga, Ensalada de Frutas, Pan, Leche, Jugo de Tamarindo, Yogurt',
    refrigerio: 'Gelatina, Empanada',
    almuerzo: {
      sopa: '',
      segundo: 'Arroz, Tilapia Frita, Chifle, Curtido Limonada, Bolas de Chocolate',
      bebidaPostre: '',
    },
    merienda: {
      plato: 'Arroz, Seco de Chancho, Papa Cocinada, Rodaja de Tomate',
      bebida: 'Agua Aromática de Menta, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-pollo-al-jugo-estofado-seco-37', 'food-yuca-cocinada-61', 'food-huevo-cocinado-duro-77', 'food-ensalada-fresca-de-verdura-92', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-leche-entera-cafe-con-leche-80'],
      almuerzo: ['food-arroz-blanco-48', 'food-corvina-tilapia-pescado-frito-44', 'food-limonada-agua-de-jamaica-86'],
      merienda: ['food-arroz-blanco-48', 'food-estofado-seco-de-chancho-40', 'food-papa-cocinada-entera-65', 'food-aguacate-rodaja-de-tomate-94', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-gelatina-con-crema-chantilly-17', 'food-empanada-de-viento-6'],
    },
  },
  {
    diaNumero: 21,
    tituloPlatoPrincipal: 'Pollo en Salsa de Champiñones, Maduro Frito y Sopa de Fideo con Papa',
    desayuno: 'Arroz, Estofado de Carne, Maduro Frito, Huevo Duro, Ensalada de Pepinillo, Ensalada de Frutas, Pan, Leche, Jugo de Guayaba, Yogurt',
    refrigerio: 'Yogurt con Cereal',
    almuerzo: {
      sopa: 'Sopa de Fideo con Papa',
      segundo: 'Arroz, Pollo en Salsa de Champiñones, Maduro Frito, Ensalada de Col y Zanahoria',
      bebidaPostre: 'Jugo de Tomate de Arbol, Mosaico',
    },
    merienda: {
      plato: 'Arroz, Estofado de Chancho, Papa Cocinada, Rodaja de Tomate',
      bebida: 'Agua Aromática de Hierba Luisa, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-estofado-seco-de-carne-43', 'food-maduro-frito-chifles-62', 'food-huevo-cocinado-duro-77', 'food-ensalada-fresca-de-verdura-92', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-leche-entera-cafe-con-leche-80'],
      almuerzo: ['food-tallarin-en-salsa-estofado-52', 'food-arroz-blanco-48', 'food-pollo-en-salsa-de-champinones-33', 'food-maduro-frito-chifles-62', 'food-ensalada-fresca-de-verdura-92', 'food-jugo-natural-con-azucar-84'],
      merienda: ['food-arroz-blanco-48', 'food-estofado-seco-de-chancho-40', 'food-papa-cocinada-entera-65', 'food-aguacate-rodaja-de-tomate-94', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-yogurt-con-cereal-79'],
    },
  },
  {
    diaNumero: 22,
    tituloPlatoPrincipal: 'Encebollado Mixto, Canguil y Chifles',
    desayuno: 'Arroz, Seco de Pollo, Papa Cocinada, Huevo Duro, Ensalada de Lechuga, Ensalada de Frutas, Pan, Leche, Yogurt',
    refrigerio: 'Dona, Yogurt',
    almuerzo: {
      sopa: 'Encebollado Mixto, Canguil, Chifles, Arroz, Limon',
      segundo: '',
      bebidaPostre: 'Jugo de Jamaica, Manzana',
    },
    merienda: {
      plato: 'Arroz, Estofado de Carne, Papa Salteada, Ensalada de Col Morada',
      bebida: 'Agua Aromática de Cedrón, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-pollo-al-jugo-estofado-seco-37', 'food-papa-cocinada-entera-65', 'food-huevo-cocinado-duro-77', 'food-ensalada-fresca-de-verdura-92', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-leche-entera-cafe-con-leche-80'],
      almuerzo: ['food-encebollado-mixto-con-canguil-29', 'food-canguil-20', 'food-maduro-frito-chifles-62', 'food-arroz-blanco-48', 'food-jugo-natural-con-azucar-84', 'food-manzana-verde-mandarina-naranja-pera-91'],
      merienda: ['food-arroz-blanco-48', 'food-estofado-seco-de-carne-43', 'food-papa-cocinada-entera-65', 'food-ensalada-fresca-de-verdura-92', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-dona-5', 'food-yogurt-en-funda-vaso-78'],
    },
  },
  {
    diaNumero: 23,
    tituloPlatoPrincipal: 'Filete de Pescado, Menestra de Lenteja y Encurtido',
    desayuno: 'Arroz, Seco de Chancho, Papa Cocinada, Huevo Duro, Ensalada de Pepinillo, Ensalada de Frutas, Pan, Leche, Yogurt, Jugo de Tamarindo',
    refrigerio: 'Galleta, Jugo Carton',
    almuerzo: {
      sopa: 'Consomé de Pollo',
      segundo: 'Arroz, Filete de Pescado, Menestra de Lenteja, Encurtido',
      bebidaPostre: 'Limonada, Pera',
    },
    merienda: {
      plato: 'Arroz, Estofado de Carne, Maduro Cocinado, Ensalada de Col',
      bebida: 'Agua Aromática de Menta, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-estofado-seco-de-chancho-40', 'food-papa-cocinada-entera-65', 'food-huevo-cocinado-duro-77', 'food-ensalada-fresca-de-verdura-92', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-leche-entera-cafe-con-leche-80'],
      almuerzo: ['food-consome-de-pollo-con-arrocillo-75', 'food-arroz-blanco-48', 'food-menestra-de-lenteja-o-frejol-53', 'food-curtido-encurtido-93', 'food-limonada-agua-de-jamaica-86', 'food-manzana-verde-mandarina-naranja-pera-91'],
      merienda: ['food-arroz-blanco-48', 'food-estofado-seco-de-carne-43', 'food-maduro-cocinado-choclo-cocinado-63', 'food-ensalada-fresca-de-verdura-92', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-galletas-empaquetadas-19', 'food-jugo-natural-con-azucar-84'],
    },
  },
  {
    diaNumero: 24,
    tituloPlatoPrincipal: 'Menestra de Fréjol, Chuleta a la Plancha y Pollo al Horno',
    desayuno: 'Arroz, Seco de Pollo, Papa Salteada, Huevo Duro, Ensalada de Lechuga, Ensalada de Frutas, Pan, Café, Yogurt',
    refrigerio: 'Galleta de Chocolate, Gelatina',
    almuerzo: {
      sopa: 'Consomé de Pollo',
      segundo: 'Opción 1: Arroz Amarillo, Menestra de Fréjol, Chuleta a la Plancha, Ensalada de Col con Zanahoria · Opción 2: Arroz Amarillo, Pollo al Horno, Menestra de Fréjol, Ensalada de Col con Zanahoria',
      bebidaPostre: 'Jugo de Guayaba, Gelatina',
    },
    merienda: {
      plato: 'Arroz, Seco de Chancho, Yuca Cocinada, Rodaja de Tomate',
      bebida: 'Agua Aromática de Manzanilla, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-pollo-al-jugo-estofado-seco-37', 'food-papa-cocinada-entera-65', 'food-huevo-cocinado-duro-77', 'food-ensalada-fresca-de-verdura-92', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-cafe-negro-con-azucar-88'],
      almuerzo: ['food-consome-de-pollo-con-arrocillo-75', 'food-arroz-amarillo-49', 'food-menestra-de-lenteja-o-frejol-53', 'food-chuleta-frita-en-salsa-38', 'food-1-4-de-pollo-al-horno-30', 'food-ensalada-fresca-de-verdura-92', 'food-jugo-natural-con-azucar-84', 'food-gelatina-con-crema-chantilly-17'],
      merienda: ['food-arroz-blanco-48', 'food-estofado-seco-de-chancho-40', 'food-yuca-cocinada-61', 'food-aguacate-rodaja-de-tomate-94', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-galletas-empaquetadas-19', 'food-gelatina-con-crema-chantilly-17'],
    },
  },
  {
    diaNumero: 25,
    tituloPlatoPrincipal: 'Bandera con Guatita, Aguacate y Maduro Frito',
    desayuno: 'Arroz, Manizado de Pescado, Ensalada de Frutas, Pan, Jugo de Tamarindo, Yogurt',
    refrigerio: 'Pan de Leche, Yogurt',
    almuerzo: {
      sopa: '',
      segundo: 'Bandera con Guatita, Aguacate, Maduro Frito, Ensalada Lechuga',
      bebidaPostre: 'Jugo de Naranjilla, Flan',
    },
    merienda: {
      plato: 'Arroz, Seco de Pollo, Maduro Cocinado, Ensalada de Col',
      bebida: 'Agua Aromática de Manzanilla, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-jugo-natural-con-azucar-84', 'food-yogurt-en-funda-vaso-78'],
      almuerzo: ['food-bandera-con-guatita-28', 'food-aguacate-rodaja-de-tomate-94', 'food-maduro-frito-chifles-62', 'food-ensalada-fresca-de-verdura-92', 'food-jugo-natural-con-azucar-84', 'food-flan-15'],
      merienda: ['food-arroz-blanco-48', 'food-pollo-al-jugo-estofado-seco-37', 'food-maduro-cocinado-choclo-cocinado-63', 'food-ensalada-fresca-de-verdura-92', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-pan-de-leche-2', 'food-yogurt-en-funda-vaso-78'],
    },
  },
  {
    diaNumero: 26,
    tituloPlatoPrincipal: 'Pollo Broaster, Remolacha y Sancocho de Hueso de Res',
    desayuno: 'Arroz, Estofado de Chancho, Yuca Cocinada, Ensalada de Lechuga, Huevo Cocinado, Ensalada de Frutas, Pan, Café, Yogurt',
    refrigerio: 'Empanada de Viento, Gelatina',
    almuerzo: {
      sopa: 'Sancocho de Hueso de Res',
      segundo: 'Arroz, Pollo Broaster, Papa Salteada, Remolacha',
      bebidaPostre: 'Jugo de Tomate de Arbol, Pera',
    },
    merienda: {
      plato: 'Arroz, Seco de Pollo, Ensalada de Col Morada y Zanahoria',
      bebida: 'Agua Aromática de Menta, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-estofado-seco-de-chancho-40', 'food-yuca-cocinada-61', 'food-ensalada-fresca-de-verdura-92', 'food-huevo-cocinado-duro-77', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-cafe-negro-con-azucar-88'],
      almuerzo: ['food-sancocho-menestron-de-frejol-72', 'food-arroz-blanco-48', 'food-1-4-de-pollo-broaster-31', 'food-papa-cocinada-entera-65', 'food-jugo-natural-con-azucar-84', 'food-manzana-verde-mandarina-naranja-pera-91'],
      merienda: ['food-arroz-blanco-48', 'food-pollo-al-jugo-estofado-seco-37', 'food-ensalada-fresca-de-verdura-92', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-empanada-de-viento-6', 'food-gelatina-con-crema-chantilly-17'],
    },
  },
  {
    diaNumero: 27,
    tituloPlatoPrincipal: 'Filete de Carne a la Plancha, Menestra de Lenteja y Maduro Frito',
    desayuno: 'Arroz, Estofado de Carne, Papa Cocinada, Ensalada de Pepinillo, Huevo Cocinado, Ensalada de Frutas, Pan, Jugo de Naranjilla, Yogurt',
    refrigerio: 'Empanada, Yogurt',
    almuerzo: {
      sopa: '',
      segundo: 'Opción 1: Arroz, Filete de Carne a la Plancha, Menestra de Lenteja, Maduro Frito, Ensalada de Lechuga y Tomate · Opción 2: Arroz, Pollo en Salsa BBQ, Menestra de Lenteja, Maduro Frito, Ensalada de Lechuga y Tomate',
      bebidaPostre: 'Jamaica, Pera',
    },
    merienda: {
      plato: 'Arroz, Seco de Pollo, Yuca Cocinada, Ensalada de Col Morada',
      bebida: 'Agua Aromática de Hierba Luisa, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-estofado-seco-de-carne-43', 'food-papa-cocinada-entera-65', 'food-ensalada-fresca-de-verdura-92', 'food-huevo-cocinado-duro-77', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-jugo-natural-con-azucar-84'],
      almuerzo: ['food-arroz-blanco-48', 'food-carne-a-la-plancha-asada-42', 'food-menestra-de-lenteja-o-frejol-53', 'food-maduro-frito-chifles-62', 'food-pollo-en-salsa-bbq-34', 'food-ensalada-fresca-de-verdura-92', 'food-limonada-agua-de-jamaica-86', 'food-manzana-verde-mandarina-naranja-pera-91'],
      merienda: ['food-arroz-blanco-48', 'food-pollo-al-jugo-estofado-seco-37', 'food-yuca-cocinada-61', 'food-ensalada-fresca-de-verdura-92', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-empanada-de-viento-6', 'food-yogurt-en-funda-vaso-78'],
    },
  },
  {
    diaNumero: 28,
    tituloPlatoPrincipal: 'Ceviche de Camarón, Maduro Frito y Aguacate Jamaica',
    desayuno: 'Arroz, Estofado de Chancho, Papa Cocinada, Ensalada de Pepinillo, Huevo Cocinado, Ensalada de Frutas, Pan, Jugo de Naranjilla, Yogurt',
    refrigerio: 'Yogurt con Cereal',
    almuerzo: {
      sopa: '',
      segundo: 'Arroz Marinero, Ceviche de Camarón, Maduro Frito, Aguacate Jamaica, Bolas de Chocolate',
      bebidaPostre: '',
    },
    merienda: {
      plato: 'Arroz, Seco de Pollo, Papa Cocinada, Rodaja de Tomate',
      bebida: 'Agua Aromática de Cedrón, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-estofado-seco-de-chancho-40', 'food-papa-cocinada-entera-65', 'food-ensalada-fresca-de-verdura-92', 'food-huevo-cocinado-duro-77', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-jugo-natural-con-azucar-84'],
      almuerzo: ['food-arroz-marinero-22', 'food-ceviche-de-camaron-47', 'food-maduro-frito-chifles-62', 'food-limonada-agua-de-jamaica-86'],
      merienda: ['food-arroz-blanco-48', 'food-pollo-al-jugo-estofado-seco-37', 'food-papa-cocinada-entera-65', 'food-aguacate-rodaja-de-tomate-94', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-yogurt-con-cereal-79'],
    },
  },
  {
    diaNumero: 29,
    tituloPlatoPrincipal: 'Encebollado Mixto, Canguil y Chifles',
    desayuno: 'Arroz, Seco de Chancho, Yuca Cocinada, Ensalada de Lechuga, Huevo Cocinado, Ensalada de Frutas, Pan, Jugo de Mora, Yogurt',
    refrigerio: 'Yogurt con Galleta',
    almuerzo: {
      sopa: 'Encebollado Mixto, Canguil, Chifles, Limon, Arroz',
      segundo: '',
      bebidaPostre: 'Limonada, Gelatina',
    },
    merienda: {
      plato: 'Arroz, Seco de Pollo, Papa Cocinada, Rodaja de Tomate',
      bebida: 'Agua Aromática de Toronjil, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-estofado-seco-de-chancho-40', 'food-yuca-cocinada-61', 'food-ensalada-fresca-de-verdura-92', 'food-huevo-cocinado-duro-77', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-jugo-natural-con-azucar-84'],
      almuerzo: ['food-encebollado-mixto-con-canguil-29', 'food-canguil-20', 'food-maduro-frito-chifles-62', 'food-arroz-blanco-48', 'food-limonada-agua-de-jamaica-86', 'food-gelatina-con-crema-chantilly-17'],
      merienda: ['food-arroz-blanco-48', 'food-pollo-al-jugo-estofado-seco-37', 'food-papa-cocinada-entera-65', 'food-aguacate-rodaja-de-tomate-94', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-galletas-empaquetadas-19'],
    },
  },
  {
    diaNumero: 30,
    tituloPlatoPrincipal: 'Filete de Pescado, Menestra de Lenteja y Curtido',
    desayuno: 'Arroz, Seco de Carne, Papa Cocinada, Rodaja de Tomate, Huevo Cocinado, Ensalada de Frutas, Pan, Café, Yogurt',
    refrigerio: 'Jugo en funda, Moncaiba',
    almuerzo: {
      sopa: 'Consomé de Pollo',
      segundo: 'Arroz, Filete de Pescado, Menestra de Lenteja, Curtido',
      bebidaPostre: 'Jamaica, Pera',
    },
    merienda: {
      plato: 'Arroz, Estofado de Pollo, Maduro Cocinado, Col Morada',
      bebida: 'Agua Aromática de Cedrón, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-estofado-seco-de-carne-43', 'food-papa-cocinada-entera-65', 'food-aguacate-rodaja-de-tomate-94', 'food-huevo-cocinado-duro-77', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-cafe-negro-con-azucar-88'],
      almuerzo: ['food-consome-de-pollo-con-arrocillo-75', 'food-arroz-blanco-48', 'food-menestra-de-lenteja-o-frejol-53', 'food-curtido-encurtido-93', 'food-limonada-agua-de-jamaica-86', 'food-manzana-verde-mandarina-naranja-pera-91'],
      merienda: ['food-arroz-blanco-48', 'food-pollo-al-jugo-estofado-seco-37', 'food-maduro-cocinado-choclo-cocinado-63', 'food-ensalada-fresca-de-verdura-92', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-jugo-comercial-funda-carton-85', 'food-moncaiba-12'],
    },
  },
  {
    diaNumero: 31,
    tituloPlatoPrincipal: 'Pollo al Horno, Menestra de Lenteja y Sopa de Fideo con Queso',
    desayuno: 'Arroz, Seco de Chancho, Papa Salteada, Ensalada, Huevo Cocinado, Ensalada de Frutas, Pan, Café, Yogurt',
    refrigerio: 'Gelatina, Galleta de Chocolate',
    almuerzo: {
      sopa: 'Sopa de Fideo con Queso',
      segundo: 'Arroz Amarrillo, Pollo al Horno, Menestra de Lenteja, Ensalada',
      bebidaPostre: 'Jamaica, Gelatina',
    },
    merienda: {
      plato: 'Arroz, Estofado de Carne, Maduro Cocinado, Rodaja de Tomate',
      bebida: 'Agua Aromática de Hierba Luisa, Pan',
    },
    alimentosIdsSugeridos: {
      desayuno: ['food-arroz-blanco-48', 'food-estofado-seco-de-chancho-40', 'food-papa-cocinada-entera-65', 'food-ensalada-fresca-de-verdura-92', 'food-huevo-cocinado-duro-77', 'food-ensalada-de-frutas-90', 'food-pan-de-mesa-3', 'food-cafe-negro-con-azucar-88'],
      almuerzo: ['food-tallarin-en-salsa-estofado-52', 'food-arroz-blanco-48', 'food-1-4-de-pollo-al-horno-30', 'food-menestra-de-lenteja-o-frejol-53', 'food-ensalada-fresca-de-verdura-92', 'food-limonada-agua-de-jamaica-86', 'food-gelatina-con-crema-chantilly-17'],
      merienda: ['food-arroz-blanco-48', 'food-estofado-seco-de-carne-43', 'food-maduro-cocinado-choclo-cocinado-63', 'food-aguacate-rodaja-de-tomate-94', 'food-agua-aromatica-con-azucar-87', 'food-pan-de-mesa-3'],
      snack: ['food-gelatina-con-crema-chantilly-17', 'food-galletas-empaquetadas-19'],
    },
  }
];

export function menuRanchoPorDia(diaNumero: number): MenuRanchoDia {
  const n = ((Math.round(diaNumero) - 1) % MENUS_RANCHO_ECUADOR.length + MENUS_RANCHO_ECUADOR.length)
    % MENUS_RANCHO_ECUADOR.length;
  return MENUS_RANCHO_ECUADOR[n];
}

export function mealDataDesdeIds(
  idsPorComida: Record<MealId, string[]>,
  catalogo: FoodItem[]
): MealData {
  const byId = new Map(catalogo.map((f) => [f.id, f]));
  const byName = new Map(catalogo.map((f) => [f.name, f]));
  const meals = EMPTY_MEAL_DATA();
  (Object.keys(idsPorComida) as MealId[]).forEach((mealId) => {
    idsPorComida[mealId].forEach((id) => {
      const item = byId.get(id) || byName.get(id);
      if (!item) return;
      const prev = meals[mealId][item.name];
      meals[mealId][item.name] = prev
        ? { ...prev, qty: prev.qty + 1 }
        : { qty: 1, cal: item.cal, sub: item.sub, category: item.category };
    });
  });
  return meals;
}
