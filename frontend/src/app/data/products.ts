export interface ProductImage {
  id: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: 'maquillaje' | 'cuerpo' | 'piel';
  subcategory?: string;
  description: string;
  image: string;          // columna legacy (fallback)
  primary_image?: string; // calculado por el backend
  images?: ProductImage[];
  unit_price?: number;
  stock?: number;
  sku?: string;
  weight_g?: number;
  is_active?: boolean;
  prices: PriceComparison[];
  rating: number;
  reviews: number;
}

export interface PriceComparison {
  site: string;
  price: number;
  currency: string;
  availability: 'in-stock' | 'low-stock' | 'out-of-stock';
  url: string;
  shipping?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSite: string;
}

//  Imagenes por categoria 
const IMG = {
  maquillaje: [
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&q=80',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80',
    'https://images.unsplash.com/photo-1583241475880-083f84372725?w=600&q=80',
    'https://images.unsplash.com/photo-1631214498995-b9acacebe1eb?w=600&q=80',
    'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=600&q=80',
    'https://images.unsplash.com/photo-1599733589046-833e93b1a16e?w=600&q=80',
    'https://images.unsplash.com/photo-1567721913486-6585f069b3b8?w=600&q=80',
    'https://images.unsplash.com/photo-1503236823255-94609f598e71?w=600&q=80',
  ],
  piel: [
    'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80',
    'https://images.unsplash.com/photo-1614159102629-2d2fa25ca67c?w=600&q=80',
    'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&q=80',
    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80',
    'https://images.unsplash.com/photo-1573461160327-672b8f4c07d7?w=600&q=80',
  ],
  cuerpo: [
    'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=80',
    'https://images.unsplash.com/photo-1599305090598-fe179d501227?w=600&q=80',
    'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=600&q=80',
    'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=600&q=80',
  ],
};

function img(cat: 'maquillaje' | 'piel' | 'cuerpo', i: number) {
  const arr = IMG[cat];
  return arr[i % arr.length];
}

type Avail = 'in-stock' | 'low-stock' | 'out-of-stock';

function p(site: string, price: number, avail: Avail = 'in-stock', shipping: number | undefined = undefined): PriceComparison {
  return { site, price, currency: 'MXN', availability: avail, url: '#', shipping };
}

export const mockProducts: Product[] = [
  //  MAQUILLAJE 
  {
    id: 'm01', name: 'Flawless Filter', brand: 'Charlotte Tilbury', category: 'maquillaje',
    description: 'Base iluminadora de Charlotte Tilbury para un acabado de piel vacaciones. Cobertura ligera y luminosa que se adapta a tu tono.',
    image: img('maquillaje', 0), rating: 4.8, reviews: 3241,
    prices: [p('Amazon MX', 1360, 'in-stock', 0), p('Sephora MX', 1300, 'in-stock', 0), p('Lookaly.mx', 1190, 'in-stock', 0)],
  },
  {
    id: 'm02', name: 'Rare Beauty Blush', brand: 'Rare Beauty', category: 'maquillaje',
    description: 'Blush liquido de Selena Gomez. Alta pigmentacion, una sola gota es suficiente para un color natural y duradero.',
    image: img('maquillaje', 1), rating: 4.9, reviews: 5872,
    prices: [p('Amazon MX', 690, 'in-stock', 0), p('Sephora MX', 665, 'low-stock', 0), p('Lookaly.mx', 595, 'in-stock', 0)],
  },
  {
    id: 'm03', name: 'Sky High Mascara', brand: 'Maybelline', category: 'maquillaje',
    description: 'Mascara de Maybelline que alarga y voluminiza las pestanas. Formula con aceite de bambu y cepillo flexible.',
    image: img('maquillaje', 2), rating: 4.6, reviews: 12450,
    prices: [p('Amazon MX', 285, 'in-stock', 0), p('Walmart', 245, 'in-stock', 99), p('Lookaly.mx', 199, 'in-stock', 0)],
  },
  {
    id: 'm04', name: 'Gloss Bomb Universal', brand: 'Fenty Beauty', category: 'maquillaje',
    description: 'Gloss ultra brillante de Fenty Beauty. Sin efecto pegajoso, hidrata y da volumen visible en un solo paso.',
    image: img('maquillaje', 4), rating: 4.8, reviews: 7634,
    prices: [p('Amazon MX', 610, 'in-stock', 0), p('Sephora MX', 580, 'in-stock', 0), p('Lookaly.mx', 520, 'in-stock', 0)],
  },
  {
    id: 'm05', name: 'Radiant Creamy Concealer', brand: 'NARS', category: 'maquillaje',
    description: 'Corrector cremoso de larga duracion. Cobertura total buildable con acabado radiante y natural todo el dia.',
    image: img('maquillaje', 3), rating: 4.7, reviews: 4891,
    prices: [p('Amazon MX', 690, 'in-stock', 0), p('Sephora MX', 720, 'in-stock', 0), p('Lookaly.mx', 640, 'in-stock', 0)],
  },
  {
    id: 'm06', name: 'Rosy Glow Blush', brand: 'Dior', category: 'maquillaje',
    description: 'Rubor de Dior con tecnologia color adapting. Se adapta al tono unico de tu piel para un colorete personalizado.',
    image: img('maquillaje', 1), rating: 4.8, reviews: 2103,
    prices: [p('Amazon MX', 980, 'low-stock', 0), p('Sephora MX', 1050, 'in-stock', 0), p('Lookaly.mx', 899, 'in-stock', 0)],
  },
  {
    id: 'm07', name: 'Lip Sleeping Mask', brand: 'Laneige', category: 'maquillaje',
    description: 'Mascarilla de labios hidratante de Laneige. Mezcla de aceites naturales que regenera los labios mientras duermes.',
    image: img('maquillaje', 4), rating: 4.7, reviews: 9215,
    prices: [p('Amazon MX', 480, 'in-stock', 0), p('Sephora MX', 560, 'in-stock', 0), p('Walmart', 495, 'in-stock', 99), p('Lookaly.mx', 430, 'in-stock', 0)],
  },
  {
    id: 'm08', name: 'Double Wear Foundation', brand: 'Estee Lauder', category: 'maquillaje',
    description: 'Base de alta cobertura de Estee Lauder. Resistente al agua y sudor, con duracion de hasta 24 horas sin retoque.',
    image: img('maquillaje', 5), rating: 4.6, reviews: 18320,
    prices: [p('Amazon MX', 1150, 'in-stock', 0), p('Sephora MX', 1250, 'in-stock', 0), p('Lookaly.mx', 1080, 'in-stock', 0)],
  },
  {
    id: 'm09', name: 'Power Grip Primer', brand: 'e.l.f.', category: 'maquillaje',
    description: 'Primer de e.l.f. con acido hialuronico al 5%. Agarra el maquillaje todo el dia con efecto segunda piel hidratada.',
    image: img('maquillaje', 6), rating: 4.5, reviews: 14760,
    prices: [p('Amazon MX', 320, 'in-stock', 0), p('Walmart', 290, 'in-stock', 99), p('Lookaly.mx', 250, 'in-stock', 0)],
  },
  {
    id: 'm10', name: 'Better Than Sex Mascara', brand: 'Too Faced', category: 'maquillaje',
    description: 'Mascara voluminizadora de Too Faced con formula de colageno vegano. Efecto pestanas de infarto en un solo trazo.',
    image: img('maquillaje', 7), rating: 4.7, reviews: 6543,
    prices: [p('Amazon MX', 650, 'in-stock', 0), p('Sephora MX', 690, 'in-stock', 0), p('Lookaly.mx', 590, 'in-stock', 0)],
  },
  {
    id: 'm11', name: 'Ambient Lighting Powder', brand: 'Hourglass', category: 'maquillaje',
    description: 'Polvo compacto de Hourglass libre de talco. Acabado natural y sedoso que filtra la luz para una piel perfecta.',
    image: img('maquillaje', 0), rating: 4.8, reviews: 1893,
    prices: [p('Amazon MX', 1100, 'in-stock', 0), p('Sephora MX', 1150, 'in-stock', 0), p('Lookaly.mx', 995, 'in-stock', 0)],
  },
  {
    id: 'm12', name: 'Lip Drip', brand: 'NYX', category: 'maquillaje',
    description: 'Aceite de labios de NYX con color y brillo intenso. Textura no pegajosa, enriquecida con aceite de jojoba.',
    image: img('maquillaje', 4), rating: 4.3, reviews: 8710,
    prices: [p('Amazon MX', 240, 'in-stock', 0), p('Walmart', 210, 'in-stock', 99), p('Lookaly.mx', 185, 'in-stock', 0)],
  },
  {
    id: 'm13', name: 'Surrealskin Foundation', brand: 'Makeup by Mario', category: 'maquillaje',
    description: 'Base fluida creada por el maquillista de las celebridades, Mario Dedivanovic. Cobertura buildable y acabado skin-like.',
    image: img('maquillaje', 5), rating: 4.7, reviews: 2210,
    prices: [p('Amazon MX', 1100, 'in-stock', 0), p('Sephora MX', 1200, 'in-stock', 0), p('Lookaly.mx', 990, 'in-stock', 0)],
  },
  {
    id: 'm14', name: 'Revealer Concealer', brand: 'Kosas', category: 'maquillaje',
    description: 'Corrector de Kosas con suero integrado. Cubre imperfecciones mientras cuida la piel con acido hialuronico.',
    image: img('maquillaje', 3), rating: 4.6, reviews: 3104,
    prices: [p('Amazon MX', 650, 'in-stock', 0), p('Sephora MX', 680, 'in-stock', 0), p('Lookaly.mx', 585, 'in-stock', 0)],
  },
  {
    id: 'm15', name: 'Hydro Grip Primer', brand: 'Milk Makeup', category: 'maquillaje',
    description: 'Primer hidratante de Milk Makeup con extracto de cannabis y acido hialuronico. Agarra el maquillaje como segunda piel.',
    image: img('maquillaje', 6), rating: 4.6, reviews: 5672,
    prices: [p('Amazon MX', 820, 'in-stock', 0), p('Sephora MX', 880, 'in-stock', 0), p('Lookaly.mx', 740, 'in-stock', 0)],
  },
  {
    id: 'm16', name: 'Easy Bake Powder', brand: 'Huda Beauty', category: 'maquillaje',
    description: 'Setting powder de Huda Beauty para un acabado horneado perfecto. Fija el maquillaje y controla el brillo hasta 16h.',
    image: img('maquillaje', 0), rating: 4.7, reviews: 4231,
    prices: [p('Amazon MX', 890, 'in-stock', 0), p('Sephora MX', 950, 'in-stock', 0), p('Lookaly.mx', 810, 'in-stock', 0)],
  },
  {
    id: 'm17', name: 'All Nighter Setting Spray', brand: 'Urban Decay', category: 'maquillaje',
    description: 'Spray fijador de Urban Decay. Tecnologia Temperature Control que mantiene el maquillaje fresco hasta 16 horas.',
    image: img('maquillaje', 6), rating: 4.6, reviews: 11230,
    prices: [p('Amazon MX', 780, 'in-stock', 0), p('Sephora MX', 820, 'in-stock', 0), p('Lookaly.mx', 695, 'in-stock', 0)],
  },

  //  PIEL 
  {
    id: 'p01', name: 'Hyaluronic Acid 2% + B5', brand: 'The Ordinary', category: 'piel',
    description: 'Suero de acido hialuronico de The Ordinary. Hidratacion profunda multicapa que rellena lineas de expresion visibles.',
    image: img('piel', 0), rating: 4.5, reviews: 28450,
    prices: [p('Amazon MX', 260, 'in-stock', 0), p('Sephora MX', 310, 'in-stock', 0), p('Walmart', 285, 'in-stock', 99), p('Lookaly.mx', 225, 'in-stock', 0)],
  },
  {
    id: 'p02', name: 'Anthelios UVmune 400', brand: 'La Roche-Posay', category: 'piel',
    description: 'Protector solar de La Roche-Posay con tecnologia UVmune 400 que bloquea rayos UV de longitud de onda ultra larga.',
    image: img('piel', 1), rating: 4.8, reviews: 9870,
    prices: [p('Amazon MX', 520, 'in-stock', 0), p('Walmart', 449, 'in-stock', 99), p('Lookaly.mx', 395, 'in-stock', 0)],
  },
  {
    id: 'p03', name: 'Foaming Facial Cleanser', brand: 'CeraVe', category: 'piel',
    description: 'Limpiador facial de CeraVe con ceramidas y acido hialuronico. Limpia profundo sin alterar la barrera cutanea.',
    image: img('piel', 2), rating: 4.6, reviews: 35200,
    prices: [p('Amazon MX', 360, 'in-stock', 0), p('Walmart', 315, 'in-stock', 99), p('Lookaly.mx', 280, 'in-stock', 0)],
  },
  {
    id: 'p04', name: 'Watermelon Glow Drops', brand: 'Glow Recipe', category: 'piel',
    description: 'Suero luminoso de Glow Recipe con extracto de sandia al 92% y niacinamida. Ilumina y uniforma el tono de piel.',
    image: img('piel', 3), rating: 4.7, reviews: 4320,
    prices: [p('Amazon MX', 850, 'in-stock', 0), p('Sephora MX', 920, 'in-stock', 0), p('Lookaly.mx', 780, 'in-stock', 0)],
  },
  {
    id: 'p05', name: '2% BHA Liquid Exfoliant', brand: "Paula's Choice", category: 'piel',
    description: 'Exfoliante BHA de acido salicilico de Paula s Choice. Descongestiona poros y elimina celulas muertas suavemente.',
    image: img('piel', 0), rating: 4.8, reviews: 16780,
    prices: [p('Amazon MX', 890, 'in-stock', 0), p('Lookaly.mx', 790, 'in-stock', 0)],
  },
  {
    id: 'p06', name: 'Lala Retro Whipped Cream', brand: 'Drunk Elephant', category: 'piel',
    description: 'Crema hidratante de Drunk Elephant con 6 aceites africanos y ceramidas. Restaura la barrera de la piel de noche.',
    image: img('piel', 1), rating: 4.7, reviews: 5640,
    prices: [p('Amazon MX', 1350, 'in-stock', 0), p('Sephora MX', 1450, 'in-stock', 0), p('Lookaly.mx', 1240, 'in-stock', 0)],
  },
  {
    id: 'p07', name: 'Ultra Facial Cream', brand: "Kiehl's", category: 'piel',
    description: 'Crema facial de Kiehl s con agua de glaciar y squalane. Hidratacion continua durante 24 horas desde la primera aplicacion.',
    image: img('piel', 2), rating: 4.6, reviews: 7890,
    prices: [p('Amazon MX', 790, 'in-stock', 0), p('Sephora MX', 850, 'in-stock', 0), p('Lookaly.mx', 720, 'in-stock', 0)],
  },
  {
    id: 'p08', name: 'C E Ferulic 30ml', brand: 'SkinCeuticals', category: 'piel',
    description: 'Suero vitamina C de SkinCeuticals. El estandar de oro en antioxidantes. Reduce fotodano y estimula el colageno.',
    image: img('piel', 0), rating: 4.9, reviews: 3210,
    prices: [p('Amazon MX', 4500, 'in-stock', 0), p('Sephora MX', 4850, 'in-stock', 0), p('Walmart', 4600, 'in-stock', 99), p('Lookaly.mx', 4150, 'in-stock', 0)],
  },
  {
    id: 'p09', name: 'Snail Mucin 96% Essence', brand: 'COSRX', category: 'piel',
    description: 'Esencia de COSRX con 96% de mucina de caracol. Repara, regenera y reduce manchas con textura acuosa ligera.',
    image: img('piel', 3), rating: 4.7, reviews: 22100,
    prices: [p('Amazon MX', 450, 'in-stock', 0), p('Walmart', 520, 'in-stock', 99), p('Lookaly.mx', 390, 'in-stock', 0)],
  },
  {
    id: 'p10', name: 'Glazing Milk', brand: 'Rhode', category: 'piel',
    description: 'Crema barrera de Rhode by Hailey Bieber. Repara la microbioma cutanea con ceramidas y acidos grasos esenciales.',
    image: img('piel', 1), rating: 4.6, reviews: 8930,
    prices: [p('Amazon MX', 850, 'in-stock', 0), p('Lookaly.mx', 750, 'in-stock', 0)],
  },
  {
    id: 'p11', name: 'Heart Leaf 77% Toner', brand: 'Anua', category: 'piel',
    description: 'Tonico de Anua con 77% de extracto de corazon de avena. Calma la piel sensible e hidrata en profundidad.',
    image: img('piel', 4), rating: 4.7, reviews: 11430,
    prices: [p('Amazon MX', 580, 'in-stock', 0), p('Lookaly.mx', 495, 'in-stock', 0)],
  },
  {
    id: 'p12', name: 'Relief Sun SPF 50+', brand: 'Beauty of Joseon', category: 'piel',
    description: 'Protector solar de Beauty of Joseon con arroz y propolis. Acabado tipo serum sin residuo blanco, ideal para piel grasa.',
    image: img('piel', 2), rating: 4.8, reviews: 14560,
    prices: [p('Amazon MX', 420, 'in-stock', 0), p('Lookaly.mx', 365, 'in-stock', 0)],
  },
  {
    id: 'p13', name: 'Mineral 89 Daily Booster', brand: 'Vichy', category: 'piel',
    description: 'Booster mineral de Vichy con 89% de agua volcanica termalizante. Refuerza y rehidrata la piel diariamente.',
    image: img('piel', 3), rating: 4.5, reviews: 6780,
    prices: [p('Amazon MX', 680, 'in-stock', 0), p('Walmart', 620, 'in-stock', 99), p('Lookaly.mx', 560, 'in-stock', 0)],
  },
  {
    id: 'p14', name: 'Good Genes Serum', brand: 'Sunday Riley', category: 'piel',
    description: 'Suero antiedad de Sunday Riley con acido lactico y extracto de licorice. Exfolia, ilumina y rellena en una sola noche.',
    image: img('piel', 0), rating: 4.7, reviews: 2890,
    prices: [p('Amazon MX', 2100, 'in-stock', 0), p('Sephora MX', 2350, 'in-stock', 0), p('Lookaly.mx', 1950, 'in-stock', 0)],
  },
  {
    id: 'p15', name: 'Jet Lag Mask', brand: 'Summer Fridays', category: 'piel',
    description: 'Mascarilla de Summer Fridays que hidrata y elimina el cansancio cutaneo. Ideal como mascarilla de noche o rinse-off.',
    image: img('piel', 4), rating: 4.6, reviews: 4120,
    prices: [p('Amazon MX', 1050, 'in-stock', 0), p('Sephora MX', 1180, 'in-stock', 0), p('Lookaly.mx', 960, 'in-stock', 0)],
  },
  {
    id: 'p16', name: 'Expert Sun Protector Stick', brand: 'Shiseido', category: 'piel',
    description: 'Stick solar de Shiseido SPF 50+. Formato solido sin residuo blanco, resistente al agua y perfecto para retoques.',
    image: img('piel', 1), rating: 4.5, reviews: 3450,
    prices: [p('Amazon MX', 690, 'in-stock', 0), p('Sephora MX', 780, 'in-stock', 0), p('Walmart', 720, 'in-stock', 99), p('Lookaly.mx', 630, 'in-stock', 0)],
  },

  //  CUERPO 
  {
    id: 'c01', name: 'Bum Bum Cream', brand: 'Sol de Janeiro', category: 'cuerpo',
    description: 'Crema corporal de Sol de Janeiro con aceite de cupuacu y manteca de karite. Piel suave y aroma tropical irreistible.',
    image: img('cuerpo', 0), rating: 4.8, reviews: 24560,
    prices: [p('Amazon MX', 1150, 'in-stock', 0), p('Sephora MX', 1305, 'in-stock', 0), p('Walmart', 1200, 'in-stock', 99), p('Lookaly.mx', 995, 'in-stock', 0)],
  },
  {
    id: 'c02', name: 'Derma Oil 125ml', brand: 'Bio-Oil', category: 'cuerpo',
    description: 'Aceite multifuncion de Bio-Oil para cicatrices y estrias. Formula PurCellin Oil con vitaminas A y E.',
    image: img('cuerpo', 1), rating: 4.6, reviews: 18900,
    prices: [p('Amazon MX', 420, 'in-stock', 0), p('Walmart', 385, 'in-stock', 99), p('Lookaly.mx', 340, 'in-stock', 0)],
  },
  {
    id: 'c03', name: 'Sugar Body Scrub', brand: 'Tree Hut', category: 'cuerpo',
    description: 'Exfoliante corporal de Tree Hut con aceite de argan y azucar de cana. Elimina celulas muertas y deja la piel sedosa.',
    image: img('cuerpo', 0), rating: 4.7, reviews: 32100,
    prices: [p('Amazon MX', 310, 'in-stock', 0), p('Walmart', 265, 'in-stock', 99), p('Lookaly.mx', 225, 'in-stock', 0)],
  },
  {
    id: 'c04', name: 'Intensive Relief Lotion', brand: 'Eucerin', category: 'cuerpo',
    description: 'Locion corporal de Eucerin para piel muy seca. Textura rica con urea y ceramidas de absorcion rapida sin residuo graso.',
    image: img('cuerpo', 1), rating: 4.5, reviews: 9870,
    prices: [p('Amazon MX', 480, 'in-stock', 0), p('Walmart', 420, 'in-stock', 99), p('Lookaly.mx', 375, 'in-stock', 0)],
  },
  {
    id: 'c05', name: 'Deep Moisture Body Wash', brand: 'Dove', category: 'cuerpo',
    description: 'Jabon liquido de Dove con cuarto de crema hidratante. Piel suave y nutrida desde la primera ducha sin jabon.',
    image: img('cuerpo', 2), rating: 4.4, reviews: 42300,
    prices: [p('Amazon MX', 160, 'in-stock', 0), p('Walmart', 135, 'in-stock', 99), p('Lookaly.mx', 115, 'in-stock', 0)],
  },
  {
    id: 'c06', name: 'The Body Lotion', brand: 'Necessaire', category: 'cuerpo',
    description: 'Locion corporal de Necessaire con niacinamida, vitamina C y vitamina E. Sin fragancia artificial, formula clinica.',
    image: img('cuerpo', 1), rating: 4.6, reviews: 5430,
    prices: [p('Amazon MX', 650, 'in-stock', 0), p('Sephora MX', 720, 'in-stock', 0), p('Lookaly.mx', 590, 'in-stock', 0)],
  },
  {
    id: 'c07', name: 'Hydro Boost Body Gel', brand: 'Neutrogena', category: 'cuerpo',
    description: 'Gel corporal de Neutrogena con acido hialuronico. Hidratacion intensa de textura gel-agua para piel normal a seca.',
    image: img('cuerpo', 0), rating: 4.5, reviews: 11200,
    prices: [p('Amazon MX', 280, 'in-stock', 0), p('Walmart', 245, 'in-stock', 99), p('Lookaly.mx', 210, 'in-stock', 0)],
  },
  {
    id: 'c08', name: 'Wet Skin Moisturizer', brand: 'Jergens', category: 'cuerpo',
    description: 'Locion de Jergens con manteca de cacao e iluminadores. Ilumina gradualmente el tono de la piel en 7 dias.',
    image: img('cuerpo', 1), rating: 4.3, reviews: 15670,
    prices: [p('Amazon MX', 180, 'in-stock', 0), p('Walmart', 145, 'in-stock', 99), p('Lookaly.mx', 125, 'in-stock', 0)],
  },
  {
    id: 'c09', name: 'Almond Shower Oil', brand: "L'Occitane", category: 'cuerpo',
    description: 'Aceite de ducha de L Occitane con leche de almendras dulces. Se transforma en espuma hidratante al contacto con el agua.',
    image: img('cuerpo', 0), rating: 4.7, reviews: 7860,
    prices: [p('Amazon MX', 650, 'in-stock', 0), p('Sephora MX', 720, 'in-stock', 0), p('Lookaly.mx', 595, 'in-stock', 0)],
  },
  {
    id: 'c10', name: 'Skin Food Original', brand: 'Weleda', category: 'cuerpo',
    description: 'Crema nutritiva de Weleda con extractos botanicos de calendula y manzanilla. Para piel muy seca y areas rugosas.',
    image: img('cuerpo', 1), rating: 4.6, reviews: 13450,
    prices: [p('Amazon MX', 450, 'in-stock', 0), p('Walmart', 420, 'in-stock', 99), p('Lookaly.mx', 380, 'in-stock', 0)],
  },
  {
    id: 'c11', name: 'Soaking Solution Salts', brand: "Dr. Teal's", category: 'cuerpo',
    description: 'Sales de bano de Dr. Teal s con aceite de eucalipto y magnesio. Relajan musculos y calman la piel en 20 minutos.',
    image: img('cuerpo', 3), rating: 4.5, reviews: 21000,
    prices: [p('Amazon MX', 230, 'in-stock', 0), p('Walmart', 195, 'in-stock', 99), p('Lookaly.mx', 165, 'in-stock', 0)],
  },
  {
    id: 'c12', name: 'Body Scrub', brand: 'OUAI', category: 'cuerpo',
    description: 'Exfoliante corporal de OUAI con sal del Himalaya y manteca de karite. Fragancia St. Barths de coco y almendra.',
    image: img('cuerpo', 0), rating: 4.7, reviews: 4210,
    prices: [p('Amazon MX', 850, 'in-stock', 0), p('Sephora MX', 940, 'in-stock', 0), p('Lookaly.mx', 790, 'in-stock', 0)],
  },
  {
    id: 'c13', name: 'Resurrection Aromatique Hand Balm', brand: 'Aesop', category: 'cuerpo',
    description: 'Balsamo de manos de Aesop con manteca de karite y aceite de almendras. Textura rica y aroma herbal inconfundible.',
    image: img('cuerpo', 1), rating: 4.8, reviews: 3120,
    prices: [p('Amazon MX', 750, 'low-stock', 0), p('Sephora MX', 820, 'in-stock', 0), p('Lookaly.mx', 695, 'in-stock', 0)],
  },
  {
    id: 'c14', name: 'Fine Fragrance Mist', brand: 'Bath & Body Works', category: 'cuerpo',
    description: 'Body mist de Bath and Body Works. Fragancia de larga duracion en formato ligero, perfecto para refrescar durante el dia.',
    image: img('cuerpo', 2), rating: 4.4, reviews: 56700,
    prices: [p('Amazon MX', 380, 'in-stock', 0), p('Walmart', 420, 'in-stock', 99), p('Lookaly.mx', 320, 'in-stock', 0)],
  },
  {
    id: 'c15', name: 'Atoderm Shower Oil', brand: 'Bioderma', category: 'cuerpo',
    description: 'Aceite de ducha de Bioderma para piel seca y sensible. Limpia suavemente con textura seca que no reseca la piel.',
    image: img('cuerpo', 1), rating: 4.6, reviews: 6780,
    prices: [p('Amazon MX', 550, 'in-stock', 0), p('Walmart', 495, 'in-stock', 99), p('Lookaly.mx', 440, 'in-stock', 0)],
  },
  {
    id: 'c16', name: 'The Ritual of Sakura Cream', brand: 'Rituals', category: 'cuerpo',
    description: 'Crema corporal de Rituals con agua de jazmin sagrado y flor de cerezo japones. Hidratacion profunda y aroma sublime.',
    image: img('cuerpo', 0), rating: 4.7, reviews: 9340,
    prices: [p('Amazon MX', 420, 'in-stock', 0), p('Sephora MX', 480, 'in-stock', 0), p('Lookaly.mx', 385, 'in-stock', 0)],
  },
  {
    id: 'c17', name: 'Creme de Corps', brand: "Kiehl's", category: 'cuerpo',
    description: 'Crema corporal clasica de Kiehl s formulada desde 1968 con lanolina y aceite de sesamo. Nutricion intensiva de lujo.',
    image: img('cuerpo', 1), rating: 4.7, reviews: 11230,
    prices: [p('Amazon MX', 680, 'in-stock', 0), p('Sephora MX', 750, 'in-stock', 0), p('Lookaly.mx', 620, 'in-stock', 0)],
  },
];
