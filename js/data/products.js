export const products = [
  // Electronics
  {
    id: 1, name: 'Sony WH-1000XM5 Wireless Headphones', brand: 'Sony', categoryId: 1, category: 'Electronics', slug: 'sony-wh-1000xm5',
    description: 'Industry-leading noise cancellation with Auto NC Optimizer that automatically tailors noise cancelling based on your wearing conditions and environment. Specially designed 30mm driver unit enhances noise cancelling. Super comfortable lightweight design with "Soft fit leather".',
    shortDescription: 'Premium noise cancelling wireless headphones',
    specs: [{ label: 'Driver Size', value: '30mm' }, { label: 'Battery Life', value: '30 hours' }, { label: 'Weight', value: '250g' }, { label: 'Connectivity', value: 'Bluetooth 5.2' }],
    images: ['/assets/images/products/product-1.jpg'],
    rating: 4.6, reviewCount: 2847, availability: 'in_stock',
    partnerPrices: [{ partnerId: 1, price: 29990 }, { partnerId: 2, price: 31499 }, { partnerId: 6, price: 28999 }],
    ourPrice: 24999, originalPrice: 29990, discount: 17, featured: true, bestDeal: true, tags: ['wireless', 'noise-cancelling', 'bluetooth'],
    priceHistory: [
      { date: '2026-03-01', price: 29990 }, { date: '2026-04-15', price: 28990 }, { date: '2026-05-10', price: 27999 },
      { date: '2026-06-20', price: 26499 }, { date: '2026-07-05', price: 25999 }, { date: '2026-08-01', price: 24999 }
    ]
  },
  {
    id: 2, name: 'JBL Charge 5 Portable Bluetooth Speaker', brand: 'JBL', categoryId: 1, category: 'Electronics', slug: 'jbl-charge-5',
    description: 'Take the party with you no matter what the weather. The JBL Charge 5 speaker delivers bold JBL Original Pro Sound, with its optimized long excursion driver, separate tweeter and dual pumping JBL bass radiators. Up to 20 hours of playtime.',
    shortDescription: 'Waterproof portable Bluetooth speaker',
    specs: [{ label: 'Output Power', value: '40W' }, { label: 'Battery Life', value: '20 hours' }, { label: 'Waterproof', value: 'IP67' }],
    images: ['/assets/images/products/product-2.jpg'],
    rating: 4.5, reviewCount: 1532, availability: 'in_stock',
    partnerPrices: [{ partnerId: 3, price: 14999 }, { partnerId: 5, price: 13499 }, { partnerId: 6, price: 12999 }],
    ourPrice: 11499, originalPrice: 14999, discount: 23, featured: false, bestDeal: false, tags: ['speaker', 'waterproof', 'bluetooth'],
    priceHistory: [
      { date: '2026-04-01', price: 14999 }, { date: '2026-05-15', price: 13999 }, { date: '2026-06-10', price: 12499 }, { date: '2026-08-01', price: 11499 }
    ]
  },
  {
    id: 3, name: 'Samsung 55" 4K Smart TV Crystal UHD', brand: 'Samsung', categoryId: 1, category: 'Electronics', slug: 'samsung-55-4k-tv',
    description: 'Experience crystal clear colors that are fine-tuned to deliver a naturally crisp and vivid picture. The Crystal Processor 4K upscales all your content to 4K level quality.',
    shortDescription: '55-inch 4K Ultra HD Smart LED TV',
    specs: [{ label: 'Screen Size', value: '55 Inches' }, { label: 'Resolution', value: '4K' }, { label: 'Refresh Rate', value: '60 Hz' }],
    images: ['/assets/images/products/product-3.jpg'],
    rating: 4.7, reviewCount: 3105, availability: 'low_stock',
    partnerPrices: [{ partnerId: 1, price: 47990 }, { partnerId: 4, price: 46990 }, { partnerId: 6, price: 45990 }],
    ourPrice: 42990, originalPrice: 47990, discount: 10, featured: true, bestDeal: false, tags: ['tv', '4k', 'smart-tv'],
    priceHistory: [
      { date: '2026-03-01', price: 47990 }, { date: '2026-05-01', price: 45990 }, { date: '2026-07-01', price: 43990 }, { date: '2026-08-01', price: 42990 }
    ]
  },
  // Laptops
  {
    id: 4, name: 'Apple MacBook Air M3 (13-inch, 2024)', brand: 'Apple', categoryId: 2, category: 'Laptops', slug: 'macbook-air-m3',
    description: 'Supercharged by M3, the MacBook Air is super portable and capable. Featuring up to 18 hours of battery life and a liquid retina display.',
    shortDescription: 'Thin and light laptop with M3 chip',
    specs: [{ label: 'Processor', value: 'Apple M3' }, { label: 'RAM', value: '8GB' }, { label: 'Storage', value: '256GB SSD' }, { label: 'Display', value: '13.6-inch Liquid Retina' }],
    images: ['/assets/images/products/product-4.jpg'],
    rating: 4.8, reviewCount: 890, availability: 'in_stock',
    partnerPrices: [{ partnerId: 1, price: 114900 }, { partnerId: 6, price: 113900 }, { partnerId: 3, price: 112900 }],
    ourPrice: 104990, originalPrice: 114900, discount: 9, featured: true, bestDeal: false, tags: ['laptop', 'mac', 'apple'],
    priceHistory: [
      { date: '2026-04-01', price: 114900 }, { date: '2026-06-01', price: 109900 }, { date: '2026-08-01', price: 104990 }
    ]
  },
  {
    id: 5, name: 'ASUS ROG Strix G16 Gaming Laptop', brand: 'ASUS', categoryId: 2, category: 'Laptops', slug: 'asus-rog-strix-g16',
    description: 'Power through any game or project with an Intel Core i7 processor and NVIDIA GeForce RTX 4060 laptop GPU. Features a 165Hz FHD display.',
    shortDescription: 'High-performance 16-inch gaming laptop',
    specs: [{ label: 'Processor', value: 'Intel i7 13th Gen' }, { label: 'GPU', value: 'RTX 4060 8GB' }, { label: 'RAM', value: '16GB' }, { label: 'Storage', value: '1TB SSD' }],
    images: ['/assets/images/products/product-5.jpg'],
    rating: 4.6, reviewCount: 420, availability: 'in_stock',
    partnerPrices: [{ partnerId: 5, price: 144990 }, { partnerId: 6, price: 142990 }],
    ourPrice: 129990, originalPrice: 144990, discount: 10, featured: false, bestDeal: true, tags: ['gaming', 'laptop', 'rtx'],
    priceHistory: [
      { date: '2026-03-01', price: 144990 }, { date: '2026-05-15', price: 139990 }, { date: '2026-08-01', price: 129990 }
    ]
  },
  {
    id: 6, name: 'HP Pavilion 15 (15.6-inch)', brand: 'HP', categoryId: 2, category: 'Laptops', slug: 'hp-pavilion-15',
    description: 'A compact PC that makes it easy to get work done on the go with a long battery life and HP Fast Charge. Equipped with AMD Ryzen 5 processor.',
    shortDescription: 'Versatile laptop for everyday use',
    specs: [{ label: 'Processor', value: 'AMD Ryzen 5' }, { label: 'RAM', value: '16GB' }, { label: 'Storage', value: '512GB SSD' }, { label: 'Display', value: '15.6-inch FHD' }],
    images: ['/assets/images/products/product-6.jpg'],
    rating: 4.3, reviewCount: 1250, availability: 'in_stock',
    partnerPrices: [{ partnerId: 2, price: 54990 }, { partnerId: 6, price: 52990 }],
    ourPrice: 48990, originalPrice: 54990, discount: 11, featured: false, bestDeal: false, tags: ['laptop', 'everyday', 'budget'],
    priceHistory: [
      { date: '2026-02-01', price: 54990 }, { date: '2026-06-01', price: 50990 }, { date: '2026-08-01', price: 48990 }
    ]
  },
  // Smartphones
  {
    id: 7, name: 'Apple iPhone 15 Pro (256GB)', brand: 'Apple', categoryId: 3, category: 'Smartphones', slug: 'iphone-15-pro',
    description: 'Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and a powerful Pro camera system.',
    shortDescription: 'Titanium design with A17 Pro chip',
    specs: [{ label: 'Display', value: '6.1-inch Super Retina XDR' }, { label: 'Processor', value: 'A17 Pro' }, { label: 'Storage', value: '256GB' }, { label: 'Camera', value: '48MP Main' }],
    images: ['/assets/images/products/product-7.jpg'],
    rating: 4.9, reviewCount: 4500, availability: 'in_stock',
    partnerPrices: [{ partnerId: 1, price: 144900 }, { partnerId: 3, price: 142900 }, { partnerId: 6, price: 141900 }],
    ourPrice: 134990, originalPrice: 144900, discount: 7, featured: true, bestDeal: false, tags: ['smartphone', 'apple', 'ios'],
    priceHistory: [
      { date: '2026-01-01', price: 144900 }, { date: '2026-05-01', price: 139900 }, { date: '2026-08-01', price: 134990 }
    ]
  },
  {
    id: 8, name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', categoryId: 3, category: 'Smartphones', slug: 'samsung-galaxy-s24-ultra',
    description: 'Unleash new ways to create, connect and more with Galaxy AI. Features a titanium exterior and a 6.8" flat display. Built-in S Pen.',
    shortDescription: 'Ultimate AI smartphone with S Pen',
    specs: [{ label: 'Display', value: '6.8-inch QHD+ AMOLED' }, { label: 'Processor', value: 'Snapdragon 8 Gen 3' }, { label: 'Storage', value: '256GB' }, { label: 'Camera', value: '200MP Main' }],
    images: ['/assets/images/products/product-8.jpg'],
    rating: 4.8, reviewCount: 3200, availability: 'in_stock',
    partnerPrices: [{ partnerId: 1, price: 129999 }, { partnerId: 5, price: 128999 }, { partnerId: 6, price: 127999 }],
    ourPrice: 119999, originalPrice: 129999, discount: 8, featured: true, bestDeal: false, tags: ['smartphone', 'samsung', 'android', 'ai'],
    priceHistory: [
      { date: '2026-02-01', price: 129999 }, { date: '2026-06-01', price: 124999 }, { date: '2026-08-01', price: 119999 }
    ]
  },
  {
    id: 9, name: 'OnePlus 12 5G', brand: 'OnePlus', categoryId: 3, category: 'Smartphones', slug: 'oneplus-12',
    description: 'Smooth beyond belief. Powered by Snapdragon 8 Gen 3, it offers an ultra-smooth experience, Hasselblad Camera for Mobile, and 100W SUPERVOOC charging.',
    shortDescription: 'Flagship killer with Hasselblad camera',
    specs: [{ label: 'Display', value: '6.82-inch 2K ProXDR' }, { label: 'Processor', value: 'Snapdragon 8 Gen 3' }, { label: 'RAM', value: '12GB' }, { label: 'Charging', value: '100W Wired' }],
    images: ['/assets/images/products/product-9.jpg'],
    rating: 4.6, reviewCount: 1800, availability: 'in_stock',
    partnerPrices: [{ partnerId: 2, price: 64999 }, { partnerId: 6, price: 63999 }],
    ourPrice: 59999, originalPrice: 64999, discount: 8, featured: false, bestDeal: true, tags: ['smartphone', 'android', 'fast-charging'],
    priceHistory: [
      { date: '2026-03-01', price: 64999 }, { date: '2026-05-15', price: 62999 }, { date: '2026-08-01', price: 59999 }
    ]
  },
  // Fashion
  {
    id: 10, name: 'Nike Air Max 270 Sneakers', brand: 'Nike', categoryId: 4, category: 'Fashion', slug: 'nike-air-max-270',
    description: 'Nike\'s first lifestyle Air Max brings you style, comfort and big attitude in the Nike Air Max 270. The design draws inspiration from Air Max icons.',
    shortDescription: 'Comfortable lifestyle sneakers',
    specs: [{ label: 'Material', value: 'Mesh/Synthetic' }, { label: 'Sole', value: 'Rubber' }, { label: 'Closure', value: 'Lace-up' }],
    images: ['/assets/images/products/product-10.jpg'],
    rating: 4.5, reviewCount: 3400, availability: 'in_stock',
    partnerPrices: [{ partnerId: 1, price: 12995 }, { partnerId: 4, price: 11995 }],
    ourPrice: 9995, originalPrice: 12995, discount: 23, featured: true, bestDeal: true, tags: ['shoes', 'sneakers', 'nike'],
    priceHistory: [
      { date: '2026-01-01', price: 12995 }, { date: '2026-04-01', price: 11495 }, { date: '2026-08-01', price: 9995 }
    ]
  },
  {
    id: 11, name: 'Levi\'s Men\'s 501 Original Fit Jeans', brand: 'Levi\'s', categoryId: 4, category: 'Fashion', slug: 'levis-501-jeans',
    description: 'The original blue jean since 1873. The 501 Original Fit Jeans have been a blank canvas for self-expression. Features the iconic straight fit and signature button fly.',
    shortDescription: 'Classic straight fit denim jeans',
    specs: [{ label: 'Fit', value: 'Regular' }, { label: 'Fabric', value: '100% Cotton' }, { label: 'Style', value: 'Straight Leg' }],
    images: ['/assets/images/products/product-11.jpg'],
    rating: 4.4, reviewCount: 5600, availability: 'in_stock',
    partnerPrices: [{ partnerId: 1, price: 3499 }, { partnerId: 4, price: 3199 }, { partnerId: 6, price: 2999 }],
    ourPrice: 2299, originalPrice: 3499, discount: 34, featured: false, bestDeal: true, tags: ['clothing', 'jeans', 'denim'],
    priceHistory: [
      { date: '2026-02-01', price: 3499 }, { date: '2026-05-01', price: 2799 }, { date: '2026-08-01', price: 2299 }
    ]
  },
  {
    id: 12, name: 'Ray-Ban Classic Aviator Sunglasses', brand: 'Ray-Ban', categoryId: 4, category: 'Fashion', slug: 'ray-ban-aviator',
    description: 'Currently one of the most iconic sunglass models in the world, Ray-Ban Aviator Classic sunglasses were originally designed for U.S. aviators in 1937.',
    shortDescription: 'Iconic teardrop shaped sunglasses',
    specs: [{ label: 'Frame Material', value: 'Metal' }, { label: 'Lens Color', value: 'Green Classic G-15' }, { label: 'UV Protection', value: '100%' }],
    images: ['/assets/images/products/product-12.jpg'],
    rating: 4.7, reviewCount: 2100, availability: 'low_stock',
    partnerPrices: [{ partnerId: 3, price: 8990 }, { partnerId: 6, price: 8490 }],
    ourPrice: 7290, originalPrice: 8990, discount: 19, featured: false, bestDeal: false, tags: ['accessories', 'sunglasses', 'eyewear'],
    priceHistory: [
      { date: '2026-03-01', price: 8990 }, { date: '2026-06-01', price: 7990 }, { date: '2026-08-01', price: 7290 }
    ]
  },
  // Home Appliances
  {
    id: 13, name: 'Dyson V15 Detect Absolute Vacuum', brand: 'Dyson', categoryId: 5, category: 'Home Appliances', slug: 'dyson-v15',
    description: 'Dyson\'s most powerful, intelligent cordless vacuum. A precisely-angled laser makes invisible dust visible on hard floors. Piezo sensor automatically sizes and counts dust particles.',
    shortDescription: 'Smart cordless vacuum with laser detection',
    specs: [{ label: 'Run Time', value: 'Up to 60 min' }, { label: 'Suction Power', value: '240 AW' }, { label: 'Bin Volume', value: '0.77L' }],
    images: ['/assets/images/products/product-13.jpg'],
    rating: 4.8, reviewCount: 950, availability: 'in_stock',
    partnerPrices: [{ partnerId: 1, price: 62900 }, { partnerId: 6, price: 61900 }],
    ourPrice: 56900, originalPrice: 62900, discount: 10, featured: true, bestDeal: false, tags: ['home', 'cleaning', 'vacuum'],
    priceHistory: [
      { date: '2026-02-01', price: 62900 }, { date: '2026-05-01', price: 59900 }, { date: '2026-08-01', price: 56900 }
    ]
  },
  {
    id: 14, name: 'Samsung 8.0 kg Front Load Washing Machine', brand: 'Samsung', categoryId: 5, category: 'Home Appliances', slug: 'samsung-washing-machine-8kg',
    description: 'Eco Bubble technology delivers powerful cleaning, even at low temperatures. Hygiene Steam cycle improves the cleaning quality of your wash without pre-treatments.',
    shortDescription: 'Smart front load washer with Eco Bubble',
    specs: [{ label: 'Capacity', value: '8.0 Kg' }, { label: 'Energy Rating', value: '5 Star' }, { label: 'Motor', value: 'Digital Inverter' }],
    images: ['/assets/images/products/product-14.jpg'],
    rating: 4.5, reviewCount: 1200, availability: 'in_stock',
    partnerPrices: [{ partnerId: 1, price: 35990 }, { partnerId: 4, price: 34990 }, { partnerId: 6, price: 33990 }],
    ourPrice: 29990, originalPrice: 35990, discount: 17, featured: false, bestDeal: true, tags: ['appliance', 'washing-machine', 'samsung'],
    priceHistory: [
      { date: '2026-01-01', price: 35990 }, { date: '2026-04-01', price: 32990 }, { date: '2026-08-01', price: 29990 }
    ]
  },
  {
    id: 15, name: 'Philips Premium Air Fryer XXL', brand: 'Philips', categoryId: 5, category: 'Home Appliances', slug: 'philips-air-fryer-xxl',
    description: 'Maximum taste, minimum fat. The Philips Airfryer uses hot air to fry your favourite foods with little or no added oil. Fat Removal technology separates and captures excess fat.',
    shortDescription: 'Large capacity healthy air fryer',
    specs: [{ label: 'Capacity', value: '7.3L' }, { label: 'Power', value: '2225W' }, { label: 'Technology', value: 'Fat Removal' }],
    images: ['/assets/images/products/product-15.jpg'],
    rating: 4.7, reviewCount: 2300, availability: 'in_stock',
    partnerPrices: [{ partnerId: 1, price: 21995 }, { partnerId: 6, price: 20995 }],
    ourPrice: 17995, originalPrice: 21995, discount: 18, featured: false, bestDeal: false, tags: ['kitchen', 'cooking', 'air-fryer'],
    priceHistory: [
      { date: '2026-03-01', price: 21995 }, { date: '2026-06-01', price: 19995 }, { date: '2026-08-01', price: 17995 }
    ]
  },
  // Gaming
  {
    id: 16, name: 'Sony PlayStation 5 Console', brand: 'Sony', categoryId: 6, category: 'Gaming', slug: 'ps5-console',
    description: 'Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with support for haptic feedback, adaptive triggers, and 3D Audio, and an all-new generation of incredible PlayStation games.',
    shortDescription: 'Next-gen gaming console',
    specs: [{ label: 'Storage', value: '825GB SSD' }, { label: 'Resolution', value: 'Up to 8K' }, { label: 'Controller', value: 'DualSense' }],
    images: ['/assets/images/products/product-16.jpg'],
    rating: 4.9, reviewCount: 8500, availability: 'in_stock',
    partnerPrices: [{ partnerId: 1, price: 54990 }, { partnerId: 5, price: 53990 }, { partnerId: 6, price: 52990 }],
    ourPrice: 49990, originalPrice: 54990, discount: 9, featured: true, bestDeal: false, tags: ['gaming', 'console', 'playstation'],
    priceHistory: [
      { date: '2026-01-01', price: 54990 }, { date: '2026-05-01', price: 52990 }, { date: '2026-08-01', price: 49990 }
    ]
  },
  {
    id: 17, name: 'Microsoft Xbox Series X', brand: 'Microsoft', categoryId: 6, category: 'Gaming', slug: 'xbox-series-x',
    description: 'The fastest, most powerful Xbox ever. Explore rich new worlds and enjoy the action like never before with the unmatched 12 teraflops of raw graphic processing power.',
    shortDescription: 'Most powerful Xbox console',
    specs: [{ label: 'Storage', value: '1TB Custom NVME SSD' }, { label: 'Resolution', value: 'True 4K' }, { label: 'Performance', value: 'Up to 120 FPS' }],
    images: ['/assets/images/products/product-17.jpg'],
    rating: 4.8, reviewCount: 4200, availability: 'in_stock',
    partnerPrices: [{ partnerId: 1, price: 49990 }, { partnerId: 6, price: 48990 }],
    ourPrice: 45990, originalPrice: 49990, discount: 8, featured: false, bestDeal: false, tags: ['gaming', 'console', 'xbox'],
    priceHistory: [
      { date: '2026-02-01', price: 49990 }, { date: '2026-06-01', price: 47990 }, { date: '2026-08-01', price: 45990 }
    ]
  },
  {
    id: 18, name: 'Nintendo Switch OLED Model', brand: 'Nintendo', categoryId: 6, category: 'Gaming', slug: 'nintendo-switch-oled',
    description: 'Play at home on the TV or on-the-go with a vibrant 7-inch OLED screen with the Nintendo Switch system - OLED Model. Features a wide adjustable stand and enhanced audio.',
    shortDescription: 'Handheld hybrid console with OLED screen',
    specs: [{ label: 'Screen', value: '7-inch OLED' }, { label: 'Storage', value: '64GB' }, { label: 'Battery', value: 'Up to 9 hours' }],
    images: ['/assets/images/products/product-18.jpg'],
    rating: 4.8, reviewCount: 5100, availability: 'in_stock',
    partnerPrices: [{ partnerId: 2, price: 34990 }, { partnerId: 5, price: 33990 }],
    ourPrice: 29990, originalPrice: 34990, discount: 14, featured: false, bestDeal: true, tags: ['gaming', 'handheld', 'nintendo'],
    priceHistory: [
      { date: '2026-03-01', price: 34990 }, { date: '2026-07-01', price: 31990 }, { date: '2026-08-01', price: 29990 }
    ]
  },
  // Accessories
  {
    id: 19, name: 'Apple AirPods Pro (2nd Generation)', brand: 'Apple', categoryId: 7, category: 'Accessories', slug: 'apple-airpods-pro-2',
    description: 'AirPods Pro feature up to 2x more Active Noise Cancellation, plus Adaptive Transparency, and Personalized Spatial Audio with dynamic head tracking for immersive sound.',
    shortDescription: 'Premium true wireless earbuds',
    specs: [{ label: 'Chip', value: 'H2 Headphone Chip' }, { label: 'Battery Life', value: 'Up to 6 hours' }, { label: 'Case', value: 'MagSafe Charging Case' }],
    images: ['/assets/images/products/product-19.jpg'],
    rating: 4.8, reviewCount: 12400, availability: 'in_stock',
    partnerPrices: [{ partnerId: 1, price: 24900 }, { partnerId: 3, price: 23900 }, { partnerId: 6, price: 22900 }],
    ourPrice: 19999, originalPrice: 24900, discount: 20, featured: true, bestDeal: true, tags: ['audio', 'earbuds', 'apple'],
    priceHistory: [
      { date: '2026-01-01', price: 24900 }, { date: '2026-05-01', price: 22900 }, { date: '2026-08-01', price: 19999 }
    ]
  },
  {
    id: 20, name: 'Samsung Galaxy Watch 6 (44mm)', brand: 'Samsung', categoryId: 7, category: 'Accessories', slug: 'samsung-galaxy-watch-6',
    description: 'Start your everyday wellness journey with Galaxy Watch6. Track your workouts, monitor your sleep stages, and get body composition data right on your wrist.',
    shortDescription: 'Advanced health & fitness smartwatch',
    specs: [{ label: 'Display', value: 'Sapphire Crystal' }, { label: 'OS', value: 'Wear OS' }, { label: 'Health', value: 'Heart Rate, ECG, BP' }],
    images: ['/assets/images/products/product-20.jpg'],
    rating: 4.6, reviewCount: 3800, availability: 'in_stock',
    partnerPrices: [{ partnerId: 1, price: 29999 }, { partnerId: 6, price: 28999 }],
    ourPrice: 24999, originalPrice: 29999, discount: 17, featured: false, bestDeal: false, tags: ['wearable', 'smartwatch', 'samsung'],
    priceHistory: [
      { date: '2026-02-01', price: 29999 }, { date: '2026-06-01', price: 26999 }, { date: '2026-08-01', price: 24999 }
    ]
  },
  {
    id: 21, name: 'Anker 735 Charger (Nano II 65W)', brand: 'Anker', categoryId: 7, category: 'Accessories', slug: 'anker-735-charger',
    description: 'Charge 3 devices simultaneously. With 2 USB-C ports and one USB-A port, you can charge your phone, notebook, and earbuds all at once from a single charger.',
    shortDescription: 'Compact 3-port fast wall charger',
    specs: [{ label: 'Output', value: '65W Max' }, { label: 'Ports', value: '2 USB-C, 1 USB-A' }, { label: 'Tech', value: 'GaN II' }],
    images: ['/assets/images/products/product-21.jpg'],
    rating: 4.7, reviewCount: 5600, availability: 'in_stock',
    partnerPrices: [{ partnerId: 2, price: 4499 }, { partnerId: 5, price: 4299 }, { partnerId: 6, price: 3999 }],
    ourPrice: 3299, originalPrice: 4499, discount: 27, featured: false, bestDeal: true, tags: ['charger', 'usb-c', 'fast-charging'],
    priceHistory: [
      { date: '2026-03-01', price: 4499 }, { date: '2026-05-01', price: 3999 }, { date: '2026-08-01', price: 3299 }
    ]
  },
  // Beauty
  {
    id: 22, name: 'Dyson Airwrap Multi-styler', brand: 'Dyson', categoryId: 8, category: 'Beauty', slug: 'dyson-airwrap',
    description: 'Curl, shape, and hide flyaways with no extreme heat. Re-engineered attachments harness Enhanced Coanda airflow to create your styles.',
    shortDescription: 'Complete hair styling set',
    specs: [{ label: 'Technology', value: 'Coanda effect' }, { label: 'Heat Settings', value: '3' }, { label: 'Attachments', value: '6 included' }],
    images: ['/assets/images/products/product-22.jpg'],
    rating: 4.5, reviewCount: 2100, availability: 'low_stock',
    partnerPrices: [{ partnerId: 1, price: 49900 }, { partnerId: 6, price: 48900 }],
    ourPrice: 44900, originalPrice: 49900, discount: 10, featured: true, bestDeal: false, tags: ['hair', 'styling', 'beauty'],
    priceHistory: [
      { date: '2026-01-01', price: 49900 }, { date: '2026-06-01', price: 47900 }, { date: '2026-08-01', price: 44900 }
    ]
  },
  {
    id: 23, name: 'MAC Mini Lipstick Kit', brand: 'MAC', categoryId: 8, category: 'Beauty', slug: 'mac-mini-lipstick-kit',
    description: 'A kit of mini lipsticks featuring our most iconic shades in various finishes. Perfect for travel or trying out new looks.',
    shortDescription: 'Set of 3 mini lipsticks',
    specs: [{ label: 'Finish', value: 'Matte & Satin' }, { label: 'Quantity', value: '3 Minis' }, { label: 'Skin Type', value: 'All' }],
    images: ['/assets/images/products/product-23.jpg'],
    rating: 4.6, reviewCount: 1500, availability: 'in_stock',
    partnerPrices: [{ partnerId: 3, price: 3500 }, { partnerId: 4, price: 3200 }],
    ourPrice: 2700, originalPrice: 3500, discount: 23, featured: false, bestDeal: false, tags: ['makeup', 'lips', 'mac'],
    priceHistory: [
      { date: '2026-04-01', price: 3500 }, { date: '2026-06-01', price: 3100 }, { date: '2026-08-01', price: 2700 }
    ]
  },
  {
    id: 24, name: 'The Ordinary Daily Set', brand: 'The Ordinary', categoryId: 8, category: 'Beauty', slug: 'the-ordinary-daily-set',
    description: 'A daily skincare regimen consisting of Squalane Cleanser, Hyaluronic Acid 2% + B5, and Natural Moisturizing Factors + HA.',
    shortDescription: 'Essential 3-step skincare routine',
    specs: [{ label: 'Steps', value: 'Cleanse, Hydrate, Moisturize' }, { label: 'Skin Type', value: 'All' }, { label: 'Vegan', value: 'Yes' }],
    images: ['/assets/images/products/product-24.jpg'],
    rating: 4.7, reviewCount: 8900, availability: 'in_stock',
    partnerPrices: [{ partnerId: 4, price: 2200 }, { partnerId: 6, price: 2100 }],
    ourPrice: 1650, originalPrice: 2200, discount: 25, featured: false, bestDeal: true, tags: ['skincare', 'face', 'the-ordinary'],
    priceHistory: [
      { date: '2026-03-01', price: 2200 }, { date: '2026-05-01', price: 1950 }, { date: '2026-08-01', price: 1650 }
    ]
  }
];

export function getProductById(id) {
  return products.find(p => p.id === id);
}

export function getProductsByCategory(categoryId) {
  return products.filter(p => p.categoryId === categoryId);
}

export function getFeaturedProducts() {
  return products.filter(p => p.featured);
}

export function getBestDeals() {
  return products.filter(p => p.bestDeal).sort((a, b) => b.discount - a.discount);
}

export function searchProducts(query) {
  if (!query) return [];
  const lowerQuery = query.toLowerCase();
  return products.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.brand.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery) ||
    p.tags.some(t => t.toLowerCase().includes(lowerQuery))
  );
}
