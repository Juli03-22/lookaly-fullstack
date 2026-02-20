"""
Seed script  inserts 50 real products with multi-store pricing + admin user.
Run:  python seed.py
"""
import asyncio
from app.database import AsyncSessionLocal, engine, Base
from app.models.product import Product, CategoryEnum
from app.models.price import Price, AvailabilityEnum
from app.core.security import hash_password


def price(product_id: str, site: str, amount: float, shipping: float = 0.0) -> Price:
    return Price(
        product_id=product_id,
        site=site,
        price=amount,
        currency="MXN",
        availability=AvailabilityEnum.in_stock,
        url="#",
        shipping=shipping,
    )


PRODUCTS = [
    #  MAQUILLAJE 
    Product(id="m01", name="Flawless Filter", brand="Charlotte Tilbury", category=CategoryEnum.maquillaje,
            description="Base iluminadora de Charlotte Tilbury. Cobertura ligera y luminosa que se adapta a tu tono.",
            image="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&q=80",
            rating=4.8, reviews=3241),
    Product(id="m02", name="Rare Beauty Blush", brand="Rare Beauty", category=CategoryEnum.maquillaje,
            description="Blush liquido de Selena Gomez. Alta pigmentacion, una sola gota es suficiente.",
            image="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
            rating=4.9, reviews=5872),
    Product(id="m03", name="Sky High Mascara", brand="Maybelline", category=CategoryEnum.maquillaje,
            description="Mascara que alarga y voluminiza las pestanas con formula de aceite de bambu.",
            image="https://images.unsplash.com/photo-1583241475880-083f84372725?w=600&q=80",
            rating=4.6, reviews=12450),
    Product(id="m04", name="Gloss Bomb Universal", brand="Fenty Beauty", category=CategoryEnum.maquillaje,
            description="Gloss ultra brillante sin pegajosidad. Hidrata y da volumen en un solo paso.",
            image="https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=600&q=80",
            rating=4.8, reviews=7634),
    Product(id="m05", name="Radiant Creamy Concealer", brand="NARS", category=CategoryEnum.maquillaje,
            description="Corrector cremoso de larga duracion con acabado radiante y natural todo el dia.",
            image="https://images.unsplash.com/photo-1631214498995-b9acacebe1eb?w=600&q=80",
            rating=4.7, reviews=4891),
    Product(id="m06", name="Rosy Glow Blush", brand="Dior", category=CategoryEnum.maquillaje,
            description="Rubor Dior con tecnologia color adapting. Se adapta al tono unico de tu piel.",
            image="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
            rating=4.8, reviews=2103),
    Product(id="m07", name="Lip Sleeping Mask", brand="Laneige", category=CategoryEnum.maquillaje,
            description="Mascarilla de labios con aceites naturales que regenera los labios mientras duermes.",
            image="https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=600&q=80",
            rating=4.7, reviews=9215),
    Product(id="m08", name="Double Wear Foundation", brand="Estee Lauder", category=CategoryEnum.maquillaje,
            description="Base de alta cobertura resistente al agua con duracion de 24 horas sin retoque.",
            image="https://images.unsplash.com/photo-1599733589046-833e93b1a16e?w=600&q=80",
            rating=4.6, reviews=18320),
    Product(id="m09", name="Power Grip Primer", brand="e.l.f.", category=CategoryEnum.maquillaje,
            description="Primer con acido hialuronico al 5%. Agarra el maquillaje todo el dia efecto segunda piel.",
            image="https://images.unsplash.com/photo-1567721913486-6585f069b3b8?w=600&q=80",
            rating=4.5, reviews=14760),
    Product(id="m10", name="Better Than Sex Mascara", brand="Too Faced", category=CategoryEnum.maquillaje,
            description="Mascara voluminizadora con formula de colageno vegano. Efecto pestanas de infarto.",
            image="https://images.unsplash.com/photo-1503236823255-94609f598e71?w=600&q=80",
            rating=4.7, reviews=6543),
    Product(id="m11", name="Ambient Lighting Powder", brand="Hourglass", category=CategoryEnum.maquillaje,
            description="Polvo compacto libre de talco con acabado sedoso que filtra la luz perfectamente.",
            image="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&q=80",
            rating=4.8, reviews=1893),
    Product(id="m12", name="Lip Drip", brand="NYX", category=CategoryEnum.maquillaje,
            description="Aceite de labios con color y brillo intenso. Textura no pegajosa con aceite de jojoba.",
            image="https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=600&q=80",
            rating=4.3, reviews=8710),
    Product(id="m13", name="Surrealskin Foundation", brand="Makeup by Mario", category=CategoryEnum.maquillaje,
            description="Base fluida de Mario Dedivanovic. Cobertura buildable y acabado skin-like de celebridades.",
            image="https://images.unsplash.com/photo-1599733589046-833e93b1a16e?w=600&q=80",
            rating=4.7, reviews=2210),
    Product(id="m14", name="Revealer Concealer", brand="Kosas", category=CategoryEnum.maquillaje,
            description="Corrector con suero integrado. Cubre imperfecciones mientras cuida la piel con HA.",
            image="https://images.unsplash.com/photo-1631214498995-b9acacebe1eb?w=600&q=80",
            rating=4.6, reviews=3104),
    Product(id="m15", name="Hydro Grip Primer", brand="Milk Makeup", category=CategoryEnum.maquillaje,
            description="Primer hidratante con extracto de cannabis y acido hialuronico. Agarra el maquillaje.",
            image="https://images.unsplash.com/photo-1567721913486-6585f069b3b8?w=600&q=80",
            rating=4.6, reviews=5672),
    Product(id="m16", name="Easy Bake Powder", brand="Huda Beauty", category=CategoryEnum.maquillaje,
            description="Setting powder para acabado horneado perfecto. Fija y controla el brillo hasta 16h.",
            image="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&q=80",
            rating=4.7, reviews=4231),
    Product(id="m17", name="All Nighter Setting Spray", brand="Urban Decay", category=CategoryEnum.maquillaje,
            description="Spray fijador con Temperature Control. Mantiene el maquillaje fresco hasta 16 horas.",
            image="https://images.unsplash.com/photo-1567721913486-6585f069b3b8?w=600&q=80",
            rating=4.6, reviews=11230),

    #  PIEL 
    Product(id="p01", name="Hyaluronic Acid 2% + B5", brand="The Ordinary", category=CategoryEnum.piel,
            description="Suero de acido hialuronico. Hidratacion multicapa que rellena lineas de expresion.",
            image="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80",
            rating=4.5, reviews=28450),
    Product(id="p02", name="Anthelios UVmune 400", brand="La Roche-Posay", category=CategoryEnum.piel,
            description="Protector solar con UVmune 400. Bloquea rayos UV de longitud de onda ultra larga.",
            image="https://images.unsplash.com/photo-1614159102629-2d2fa25ca67c?w=600&q=80",
            rating=4.8, reviews=9870),
    Product(id="p03", name="Foaming Facial Cleanser", brand="CeraVe", category=CategoryEnum.piel,
            description="Limpiador con ceramidas y acido hialuronico. Limpia sin alterar la barrera cutanea.",
            image="https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&q=80",
            rating=4.6, reviews=35200),
    Product(id="p04", name="Watermelon Glow Drops", brand="Glow Recipe", category=CategoryEnum.piel,
            description="Suero luminoso con sandia al 92% y niacinamida. Ilumina y uniforma el tono de piel.",
            image="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80",
            rating=4.7, reviews=4320),
    Product(id="p05", name="2% BHA Liquid Exfoliant", brand="Paula's Choice", category=CategoryEnum.piel,
            description="Exfoliante BHA de acido salicilico. Descongestiona poros y elimina celulas muertas.",
            image="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80",
            rating=4.8, reviews=16780),
    Product(id="p06", name="Lala Retro Whipped Cream", brand="Drunk Elephant", category=CategoryEnum.piel,
            description="Crema hidratante con 6 aceites africanos y ceramidas. Restaura la barrera de noche.",
            image="https://images.unsplash.com/photo-1614159102629-2d2fa25ca67c?w=600&q=80",
            rating=4.7, reviews=5640),
    Product(id="p07", name="Ultra Facial Cream", brand="Kiehl's", category=CategoryEnum.piel,
            description="Crema facial con agua de glaciar y squalane. Hidratacion continua durante 24 horas.",
            image="https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&q=80",
            rating=4.6, reviews=7890),
    Product(id="p08", name="C E Ferulic 30ml", brand="SkinCeuticals", category=CategoryEnum.piel,
            description="El estandar de oro en vitamina C. Reduce fotodano y estimula colageno desde semana 1.",
            image="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80",
            rating=4.9, reviews=3210),
    Product(id="p09", name="Snail Mucin 96% Essence", brand="COSRX", category=CategoryEnum.piel,
            description="Esencia con 96% de mucina de caracol. Repara, regenera y reduce manchas visibles.",
            image="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80",
            rating=4.7, reviews=22100),
    Product(id="p10", name="Glazing Milk", brand="Rhode", category=CategoryEnum.piel,
            description="Crema barrera de Rhode by Hailey Bieber con ceramidas y acidos grasos esenciales.",
            image="https://images.unsplash.com/photo-1614159102629-2d2fa25ca67c?w=600&q=80",
            rating=4.6, reviews=8930),
    Product(id="p11", name="Heart Leaf 77% Toner", brand="Anua", category=CategoryEnum.piel,
            description="Tonico con 77% extracto corazon de avena. Calma la piel sensible e hidrata profundo.",
            image="https://images.unsplash.com/photo-1573461160327-672b8f4c07d7?w=600&q=80",
            rating=4.7, reviews=11430),
    Product(id="p12", name="Relief Sun SPF 50+", brand="Beauty of Joseon", category=CategoryEnum.piel,
            description="SPF coreano con arroz y propolis. Acabado serum sin residuo blanco para piel grasa.",
            image="https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&q=80",
            rating=4.8, reviews=14560),
    Product(id="p13", name="Mineral 89 Daily Booster", brand="Vichy", category=CategoryEnum.piel,
            description="Booster con 89% de agua volcanica termalizante. Refuerza y rehidrata la piel diaria.",
            image="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80",
            rating=4.5, reviews=6780),
    Product(id="p14", name="Good Genes Serum", brand="Sunday Riley", category=CategoryEnum.piel,
            description="Suero antiedad con acido lactico y licorice. Exfolia, ilumina y rellena en una noche.",
            image="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80",
            rating=4.7, reviews=2890),
    Product(id="p15", name="Jet Lag Mask", brand="Summer Fridays", category=CategoryEnum.piel,
            description="Mascarilla que elimina el cansancio cutaneo. Ideal como overnight o rinse-off mask.",
            image="https://images.unsplash.com/photo-1573461160327-672b8f4c07d7?w=600&q=80",
            rating=4.6, reviews=4120),
    Product(id="p16", name="Expert Sun Protector Stick", brand="Shiseido", category=CategoryEnum.piel,
            description="Stick solar SPF 50+ sin residuo blanco. Resistente al agua, perfecto para retoques.",
            image="https://images.unsplash.com/photo-1614159102629-2d2fa25ca67c?w=600&q=80",
            rating=4.5, reviews=3450),

    #  CUERPO 
    Product(id="c01", name="Bum Bum Cream", brand="Sol de Janeiro", category=CategoryEnum.cuerpo,
            description="Crema con aceite de cupuacu y manteca de karite. Piel suave y aroma tropical irresistible.",
            image="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=80",
            rating=4.8, reviews=24560),
    Product(id="c02", name="Derma Oil 125ml", brand="Bio-Oil", category=CategoryEnum.cuerpo,
            description="Aceite multifuncion PurCellin Oil para cicatrices y estrias con vitaminas A y E.",
            image="https://images.unsplash.com/photo-1599305090598-fe179d501227?w=600&q=80",
            rating=4.6, reviews=18900),
    Product(id="c03", name="Sugar Body Scrub", brand="Tree Hut", category=CategoryEnum.cuerpo,
            description="Exfoliante corporal con aceite de argan y azucar de cana. Piel sedosa y suave.",
            image="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=80",
            rating=4.7, reviews=32100),
    Product(id="c04", name="Intensive Relief Lotion", brand="Eucerin", category=CategoryEnum.cuerpo,
            description="Locion para piel muy seca con urea y ceramidas. Absorcion rapida sin residuo graso.",
            image="https://images.unsplash.com/photo-1599305090598-fe179d501227?w=600&q=80",
            rating=4.5, reviews=9870),
    Product(id="c05", name="Deep Moisture Body Wash", brand="Dove", category=CategoryEnum.cuerpo,
            description="Jabon liquido con cuarto de crema hidratante. Piel suave y nutrida desde la primera ducha.",
            image="https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=600&q=80",
            rating=4.4, reviews=42300),
    Product(id="c06", name="The Body Lotion", brand="Necessaire", category=CategoryEnum.cuerpo,
            description="Locion con niacinamida, vitamina C y E. Sin fragancia artificial, formula clinica.",
            image="https://images.unsplash.com/photo-1599305090598-fe179d501227?w=600&q=80",
            rating=4.6, reviews=5430),
    Product(id="c07", name="Hydro Boost Body Gel", brand="Neutrogena", category=CategoryEnum.cuerpo,
            description="Gel corporal con acido hialuronico. Hidratacion intensa textura gel-agua ligera.",
            image="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=80",
            rating=4.5, reviews=11200),
    Product(id="c08", name="Cocoa Radiant Body Moisturizer", brand="Jergens", category=CategoryEnum.cuerpo,
            description="Locion con manteca de cacao. Ilumina gradualmente el tono de la piel en 7 dias.",
            image="https://images.unsplash.com/photo-1599305090598-fe179d501227?w=600&q=80",
            rating=4.3, reviews=15670),
    Product(id="c09", name="Almond Shower Oil", brand="L'Occitane", category=CategoryEnum.cuerpo,
            description="Aceite de ducha con leche de almendras dulces. Se transforma en espuma al contacto con agua.",
            image="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=80",
            rating=4.7, reviews=7860),
    Product(id="c10", name="Skin Food Original", brand="Weleda", category=CategoryEnum.cuerpo,
            description="Crema nutritiva botanica con calendula y manzanilla. Para piel muy seca y areas rugosas.",
            image="https://images.unsplash.com/photo-1599305090598-fe179d501227?w=600&q=80",
            rating=4.6, reviews=13450),
    Product(id="c11", name="Soaking Solution Salts", brand="Dr. Teal's", category=CategoryEnum.cuerpo,
            description="Sales de bano con eucalipto y magnesio. Relajan musculos y calman la piel en 20 minutos.",
            image="https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=600&q=80",
            rating=4.5, reviews=21000),
    Product(id="c12", name="Body Scrub", brand="OUAI", category=CategoryEnum.cuerpo,
            description="Exfoliante con sal del Himalaya y manteca de karite. Fragancia St. Barths coco-almendra.",
            image="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=80",
            rating=4.7, reviews=4210),
    Product(id="c13", name="Resurrection Hand Balm", brand="Aesop", category=CategoryEnum.cuerpo,
            description="Balsamo de manos con manteca de karite y aceite de almendras. Aroma herbal inconfundible.",
            image="https://images.unsplash.com/photo-1599305090598-fe179d501227?w=600&q=80",
            rating=4.8, reviews=3120),
    Product(id="c14", name="Fine Fragrance Mist", brand="Bath & Body Works", category=CategoryEnum.cuerpo,
            description="Body mist de larga duracion en formato ligero, perfecto para refrescar durante el dia.",
            image="https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=600&q=80",
            rating=4.4, reviews=56700),
    Product(id="c15", name="Atoderm Shower Oil", brand="Bioderma", category=CategoryEnum.cuerpo,
            description="Aceite de ducha para piel seca y sensible. Limpia suavemente con textura seca.",
            image="https://images.unsplash.com/photo-1599305090598-fe179d501227?w=600&q=80",
            rating=4.6, reviews=6780),
    Product(id="c16", name="Ritual of Sakura Cream", brand="Rituals", category=CategoryEnum.cuerpo,
            description="Crema con agua de jazmin sagrado y flor de cerezo japones. Hidratacion y aroma sublime.",
            image="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=80",
            rating=4.7, reviews=9340),
    Product(id="c17", name="Creme de Corps", brand="Kiehl's", category=CategoryEnum.cuerpo,
            description="Crema clasica de Kiehl s desde 1968 con lanolina y aceite de sesamo. Nutricion de lujo.",
            image="https://images.unsplash.com/photo-1599305090598-fe179d501227?w=600&q=80",
            rating=4.7, reviews=11230),
]

PRICES = {
    "m01": [("Amazon MX", 1360, 0), ("Sephora MX", 1300, 0), ("Lookaly.mx", 1190, 0)],
    "m02": [("Amazon MX", 690, 0), ("Sephora MX", 665, 0), ("Lookaly.mx", 595, 0)],
    "m03": [("Amazon MX", 285, 0), ("Walmart", 245, 99), ("Lookaly.mx", 199, 0)],
    "m04": [("Amazon MX", 610, 0), ("Sephora MX", 580, 0), ("Lookaly.mx", 520, 0)],
    "m05": [("Amazon MX", 690, 0), ("Sephora MX", 720, 0), ("Lookaly.mx", 640, 0)],
    "m06": [("Amazon MX", 980, 0), ("Sephora MX", 1050, 0), ("Lookaly.mx", 899, 0)],
    "m07": [("Amazon MX", 480, 0), ("Sephora MX", 560, 0), ("Walmart", 495, 99), ("Lookaly.mx", 430, 0)],
    "m08": [("Amazon MX", 1150, 0), ("Sephora MX", 1250, 0), ("Lookaly.mx", 1080, 0)],
    "m09": [("Amazon MX", 320, 0), ("Walmart", 290, 99), ("Lookaly.mx", 250, 0)],
    "m10": [("Amazon MX", 650, 0), ("Sephora MX", 690, 0), ("Lookaly.mx", 590, 0)],
    "m11": [("Amazon MX", 1100, 0), ("Sephora MX", 1150, 0), ("Lookaly.mx", 995, 0)],
    "m12": [("Amazon MX", 240, 0), ("Walmart", 210, 99), ("Lookaly.mx", 185, 0)],
    "m13": [("Amazon MX", 1100, 0), ("Sephora MX", 1200, 0), ("Lookaly.mx", 990, 0)],
    "m14": [("Amazon MX", 650, 0), ("Sephora MX", 680, 0), ("Lookaly.mx", 585, 0)],
    "m15": [("Amazon MX", 820, 0), ("Sephora MX", 880, 0), ("Lookaly.mx", 740, 0)],
    "m16": [("Amazon MX", 890, 0), ("Sephora MX", 950, 0), ("Lookaly.mx", 810, 0)],
    "m17": [("Amazon MX", 780, 0), ("Sephora MX", 820, 0), ("Lookaly.mx", 695, 0)],
    "p01": [("Amazon MX", 260, 0), ("Sephora MX", 310, 0), ("Walmart", 285, 99), ("Lookaly.mx", 225, 0)],
    "p02": [("Amazon MX", 520, 0), ("Walmart", 449, 99), ("Lookaly.mx", 395, 0)],
    "p03": [("Amazon MX", 360, 0), ("Walmart", 315, 99), ("Lookaly.mx", 280, 0)],
    "p04": [("Amazon MX", 850, 0), ("Sephora MX", 920, 0), ("Lookaly.mx", 780, 0)],
    "p05": [("Amazon MX", 890, 0), ("Lookaly.mx", 790, 0)],
    "p06": [("Amazon MX", 1350, 0), ("Sephora MX", 1450, 0), ("Lookaly.mx", 1240, 0)],
    "p07": [("Amazon MX", 790, 0), ("Sephora MX", 850, 0), ("Lookaly.mx", 720, 0)],
    "p08": [("Amazon MX", 4500, 0), ("Sephora MX", 4850, 0), ("Walmart", 4600, 99), ("Lookaly.mx", 4150, 0)],
    "p09": [("Amazon MX", 450, 0), ("Walmart", 520, 99), ("Lookaly.mx", 390, 0)],
    "p10": [("Amazon MX", 850, 0), ("Lookaly.mx", 750, 0)],
    "p11": [("Amazon MX", 580, 0), ("Lookaly.mx", 495, 0)],
    "p12": [("Amazon MX", 420, 0), ("Lookaly.mx", 365, 0)],
    "p13": [("Amazon MX", 680, 0), ("Walmart", 620, 99), ("Lookaly.mx", 560, 0)],
    "p14": [("Amazon MX", 2100, 0), ("Sephora MX", 2350, 0), ("Lookaly.mx", 1950, 0)],
    "p15": [("Amazon MX", 1050, 0), ("Sephora MX", 1180, 0), ("Lookaly.mx", 960, 0)],
    "p16": [("Amazon MX", 690, 0), ("Sephora MX", 780, 0), ("Walmart", 720, 99), ("Lookaly.mx", 630, 0)],
    "c01": [("Amazon MX", 1150, 0), ("Sephora MX", 1305, 0), ("Walmart", 1200, 99), ("Lookaly.mx", 995, 0)],
    "c02": [("Amazon MX", 420, 0), ("Walmart", 385, 99), ("Lookaly.mx", 340, 0)],
    "c03": [("Amazon MX", 310, 0), ("Walmart", 265, 99), ("Lookaly.mx", 225, 0)],
    "c04": [("Amazon MX", 480, 0), ("Walmart", 420, 99), ("Lookaly.mx", 375, 0)],
    "c05": [("Amazon MX", 160, 0), ("Walmart", 135, 99), ("Lookaly.mx", 115, 0)],
    "c06": [("Amazon MX", 650, 0), ("Sephora MX", 720, 0), ("Lookaly.mx", 590, 0)],
    "c07": [("Amazon MX", 280, 0), ("Walmart", 245, 99), ("Lookaly.mx", 210, 0)],
    "c08": [("Amazon MX", 180, 0), ("Walmart", 145, 99), ("Lookaly.mx", 125, 0)],
    "c09": [("Amazon MX", 650, 0), ("Sephora MX", 720, 0), ("Lookaly.mx", 595, 0)],
    "c10": [("Amazon MX", 450, 0), ("Walmart", 420, 99), ("Lookaly.mx", 380, 0)],
    "c11": [("Amazon MX", 230, 0), ("Walmart", 195, 99), ("Lookaly.mx", 165, 0)],
    "c12": [("Amazon MX", 850, 0), ("Sephora MX", 940, 0), ("Lookaly.mx", 790, 0)],
    "c13": [("Amazon MX", 750, 0), ("Sephora MX", 820, 0), ("Lookaly.mx", 695, 0)],
    "c14": [("Amazon MX", 380, 0), ("Walmart", 420, 99), ("Lookaly.mx", 320, 0)],
    "c15": [("Amazon MX", 550, 0), ("Walmart", 495, 99), ("Lookaly.mx", 440, 0)],
    "c16": [("Amazon MX", 420, 0), ("Sephora MX", 480, 0), ("Lookaly.mx", 385, 0)],
    "c17": [("Amazon MX", 680, 0), ("Sephora MX", 750, 0), ("Lookaly.mx", 620, 0)],
}


async def seed():
    from sqlalchemy import text
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Clear existing data
        for table in ("prices", "cart_items", "products", "users"):
            try:
                await session.execute(text(f"DELETE FROM {table}"))
            except Exception:
                pass
        await session.commit()

        # Admin user de prueba
        # Login: email="admin@lookaly.com"  contraseña="Admin123!"
        from datetime import datetime
        from app.models.user import User
        admin = User(
            email="admin@lookaly.com",
            name="Admin Lookaly",
            hashed_password=hash_password("Admin123!"),
            is_active=True,
            is_admin=True,
            password_changed_at=datetime.utcnow(),
        )
        session.add(admin)

        # Products
        for prod in PRODUCTS:
            session.add(prod)

        await session.flush()

        # Prices
        for prod_id, price_list in PRICES.items():
            for site, amount, shipping in price_list:
                session.add(price(prod_id, site, amount, float(shipping)))

        await session.commit()
        print(f"Seeded {len(PRODUCTS)} products with pricing.")
        print("Admin  →  email: admin@lookaly.com  |  contraseña: Admin123!")


if __name__ == "__main__":
    asyncio.run(seed())
