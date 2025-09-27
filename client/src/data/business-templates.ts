/**
 * Comprehensive Business Templates for Quantum POS System
 * Each template includes tailored products, categories, and settings for specific business types
 */

export interface BusinessTemplate {
  id: string;
  name: string;
  businessType: string;
  description: string;
  icon: string;
  primaryColor: string;
  defaultProducts: Product[];
  defaultCategories: string[];
  defaultSettings: BusinessSettings;
  requiredIntegrations: string[];
  features: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface Product {
  name: string;
  category: string;
  price: string;
  cost: string;
  vatRate: string;
  barcode?: string;
  description?: string;
}

export interface BusinessSettings {
  currency: string;
  taxRate: number;
  receiptFooter: string;
  loyaltyProgram: boolean;
  ageVerification: boolean;
  tableService: boolean;
  appointmentBooking: boolean;
  deliveryService: boolean;
  stockTracking: boolean;
  staffCommissions: boolean;
}

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  {
    id: "pub-with-food",
    name: "Pub/Bar with Food Kitchen",
    businessType: "pub",
    description: "Traditional pub with full bar service and kitchen for food orders",
    icon: "🍺",
    primaryColor: "#f59e0b", // Amber
    defaultProducts: [
      // Alcoholic Drinks
      { name: "Guinness Pint", category: "Draught Beer", price: "5.50", cost: "2.10", vatRate: "23" },
      { name: "Heineken Pint", category: "Draught Beer", price: "5.20", cost: "2.00", vatRate: "23" },
      { name: "Carlsberg Bottle", category: "Bottled Beer", price: "4.80", cost: "1.85", vatRate: "23" },
      { name: "Corona Bottle", category: "Bottled Beer", price: "5.20", cost: "2.20", vatRate: "23" },
      { name: "House Wine Glass", category: "Wine", price: "6.50", cost: "2.80", vatRate: "23" },
      { name: "Jameson Double", category: "Spirits", price: "9.50", cost: "3.20", vatRate: "23" },
      { name: "Vodka & Mixer", category: "Cocktails", price: "8.50", cost: "3.50", vatRate: "23" },
      
      // Food Items
      { name: "Fish & Chips", category: "Main Course", price: "16.50", cost: "6.80", vatRate: "13.5" },
      { name: "Beef Burger & Fries", category: "Main Course", price: "15.90", cost: "7.20", vatRate: "13.5" },
      { name: "Chicken Wings (8pc)", category: "Starters", price: "12.50", cost: "5.10", vatRate: "13.5" },
      { name: "Irish Stew", category: "Main Course", price: "14.80", cost: "6.50", vatRate: "13.5" },
      { name: "Caesar Salad", category: "Salads", price: "11.50", cost: "4.20", vatRate: "13.5" },
      { name: "Garlic Bread", category: "Sides", price: "5.50", cost: "2.10", vatRate: "13.5" },
      
      // Non-Alcoholic
      { name: "Coca Cola", category: "Soft Drinks", price: "3.20", cost: "1.10", vatRate: "23" },
      { name: "Coffee", category: "Hot Drinks", price: "3.50", cost: "1.20", vatRate: "13.5" },
      { name: "Tea", category: "Hot Drinks", price: "2.80", cost: "0.80", vatRate: "13.5" }
    ],
    defaultCategories: [
      "Draught Beer", "Bottled Beer", "Wine", "Spirits", "Cocktails", 
      "Main Course", "Starters", "Sides", "Salads", "Soft Drinks", "Hot Drinks"
    ],
    defaultSettings: {
      currency: "EUR",
      taxRate: 23,
      receiptFooter: "Thanks for visiting! Sláinte! 🍺",
      loyaltyProgram: true,
      ageVerification: true,
      tableService: true,
      appointmentBooking: false,
      deliveryService: false,
      stockTracking: true,
      staffCommissions: false
    },
    requiredIntegrations: ["age-verification", "kitchen-display", "payment-terminal"],
    features: ["happy-hour", "food-service", "bar-service", "table-management"],
    isActive: true,
    createdAt: new Date()
  },

  {
    id: "modern-restaurant",
    name: "Restaurant with Table Service",
    businessType: "restaurant",
    description: "Full-service restaurant with kitchen orders and table management",
    icon: "🍽️",
    primaryColor: "#10b981", // Emerald
    defaultProducts: [
      // Starters
      { name: "Soup of the Day", category: "Starters", price: "8.50", cost: "3.20", vatRate: "13.5" },
      { name: "Bruschetta Trio", category: "Starters", price: "10.90", cost: "4.50", vatRate: "13.5" },
      { name: "Calamari Rings", category: "Starters", price: "12.50", cost: "5.80", vatRate: "13.5" },
      
      // Main Courses
      { name: "Grilled Salmon", category: "Main Course", price: "24.50", cost: "12.80", vatRate: "13.5" },
      { name: "Ribeye Steak 10oz", category: "Main Course", price: "29.90", cost: "15.50", vatRate: "13.5" },
      { name: "Chicken Supreme", category: "Main Course", price: "19.50", cost: "8.90", vatRate: "13.5" },
      { name: "Vegetarian Pasta", category: "Main Course", price: "16.50", cost: "6.20", vatRate: "13.5" },
      { name: "Lamb Shank", category: "Main Course", price: "26.90", cost: "13.20", vatRate: "13.5" },
      
      // Sides
      { name: "Seasonal Vegetables", category: "Sides", price: "5.50", cost: "2.10", vatRate: "13.5" },
      { name: "Garlic Mashed Potato", category: "Sides", price: "4.90", cost: "1.80", vatRate: "13.5" },
      
      // Desserts
      { name: "Chocolate Brownie", category: "Desserts", price: "8.50", cost: "3.20", vatRate: "13.5" },
      { name: "Tiramisu", category: "Desserts", price: "9.50", cost: "4.10", vatRate: "13.5" },
      
      // Beverages
      { name: "House Wine 250ml", category: "Wine", price: "8.50", cost: "3.80", vatRate: "23" },
      { name: "Premium Beer", category: "Beer", price: "5.20", cost: "2.10", vatRate: "23" },
      { name: "Freshly Squeezed Orange", category: "Juices", price: "4.50", cost: "1.80", vatRate: "13.5" },
      { name: "Espresso", category: "Coffee", price: "3.20", cost: "1.10", vatRate: "13.5" }
    ],
    defaultCategories: [
      "Starters", "Main Course", "Sides", "Desserts", 
      "Wine", "Beer", "Juices", "Coffee", "Tea"
    ],
    defaultSettings: {
      currency: "EUR",
      taxRate: 13.5,
      receiptFooter: "Thank you for dining with us!",
      loyaltyProgram: true,
      ageVerification: true,
      tableService: true,
      appointmentBooking: true,
      deliveryService: false,
      stockTracking: true,
      staffCommissions: true
    },
    requiredIntegrations: ["kitchen-display", "table-management", "reservation-system"],
    features: ["table-service", "kitchen-orders", "reservations", "menu-management"],
    isActive: true,
    createdAt: new Date()
  },

  {
    id: "modern-cafe",
    name: "Café & Coffee Shop",
    businessType: "cafe",
    description: "Modern coffee shop with pastries, sandwiches and specialty drinks",
    icon: "☕",
    primaryColor: "#8b5cf6", // Purple
    defaultProducts: [
      // Hot Drinks
      { name: "Americano", category: "Coffee", price: "3.50", cost: "1.20", vatRate: "13.5" },
      { name: "Cappuccino", category: "Coffee", price: "4.20", cost: "1.50", vatRate: "13.5" },
      { name: "Latte", category: "Coffee", price: "4.50", cost: "1.60", vatRate: "13.5" },
      { name: "Flat White", category: "Coffee", price: "4.20", cost: "1.50", vatRate: "13.5" },
      { name: "Mocha", category: "Coffee", price: "5.20", cost: "2.10", vatRate: "13.5" },
      { name: "Hot Chocolate", category: "Hot Drinks", price: "4.50", cost: "1.80", vatRate: "13.5" },
      { name: "English Breakfast Tea", category: "Tea", price: "3.20", cost: "1.00", vatRate: "13.5" },
      
      // Cold Drinks
      { name: "Iced Coffee", category: "Cold Coffee", price: "4.80", cost: "1.90", vatRate: "13.5" },
      { name: "Frappé", category: "Cold Coffee", price: "5.50", cost: "2.20", vatRate: "13.5" },
      { name: "Fresh Orange Juice", category: "Juices", price: "4.20", cost: "2.10", vatRate: "13.5" },
      { name: "Smoothie Bowl", category: "Smoothies", price: "7.90", cost: "3.50", vatRate: "13.5" },
      
      // Food
      { name: "Croissant", category: "Pastries", price: "3.20", cost: "1.20", vatRate: "13.5" },
      { name: "Pain au Chocolat", category: "Pastries", price: "3.80", cost: "1.50", vatRate: "13.5" },
      { name: "Blueberry Muffin", category: "Muffins", price: "4.50", cost: "1.80", vatRate: "13.5" },
      { name: "Avocado Toast", category: "Light Meals", price: "9.50", cost: "4.20", vatRate: "13.5" },
      { name: "Club Sandwich", category: "Sandwiches", price: "11.90", cost: "5.50", vatRate: "13.5" },
      { name: "Caesar Wrap", category: "Wraps", price: "10.50", cost: "4.80", vatRate: "13.5" },
      { name: "Soup & Roll", category: "Light Meals", price: "8.50", cost: "3.20", vatRate: "13.5" }
    ],
    defaultCategories: [
      "Coffee", "Tea", "Hot Drinks", "Cold Coffee", "Juices", "Smoothies",
      "Pastries", "Muffins", "Sandwiches", "Wraps", "Light Meals"
    ],
    defaultSettings: {
      currency: "EUR",
      taxRate: 13.5,
      receiptFooter: "Thanks for choosing us! ☕",
      loyaltyProgram: true,
      ageVerification: false,
      tableService: false,
      appointmentBooking: false,
      deliveryService: true,
      stockTracking: true,
      staffCommissions: false
    },
    requiredIntegrations: ["loyalty-program", "mobile-ordering", "delivery-service"],
    features: ["coffee-service", "pastry-display", "loyalty-cards", "mobile-orders"],
    isActive: true,
    createdAt: new Date()
  },

  {
    id: "auto-garage",
    name: "Auto Garage & Parts",
    businessType: "garage",
    description: "Auto repair garage with parts sales and service booking",
    icon: "🔧",
    primaryColor: "#6b7280", // Gray
    defaultProducts: [
      // Services
      { name: "Oil Change Service", category: "Services", price: "45.00", cost: "18.50", vatRate: "23" },
      { name: "Brake Inspection", category: "Services", price: "25.00", cost: "8.50", vatRate: "23" },
      { name: "Tire Fitting (per tire)", category: "Services", price: "15.00", cost: "5.00", vatRate: "23" },
      { name: "NCT Preparation", category: "Services", price: "85.00", cost: "35.00", vatRate: "23" },
      { name: "Engine Diagnostic", category: "Services", price: "65.00", cost: "22.00", vatRate: "23" },
      { name: "Car Wash & Vac", category: "Services", price: "12.00", cost: "3.50", vatRate: "23" },
      
      // Parts
      { name: "Engine Oil 5L", category: "Oils & Fluids", price: "35.00", cost: "18.50", vatRate: "23" },
      { name: "Oil Filter", category: "Filters", price: "12.50", cost: "6.80", vatRate: "23" },
      { name: "Air Filter", category: "Filters", price: "18.90", cost: "9.20", vatRate: "23" },
      { name: "Brake Pads Set", category: "Brake Parts", price: "45.00", cost: "22.50", vatRate: "23" },
      { name: "Wiper Blades Pair", category: "Accessories", price: "28.50", cost: "14.20", vatRate: "23" },
      { name: "Car Battery", category: "Electrical", price: "85.00", cost: "52.00", vatRate: "23" },
      { name: "Headlight Bulb", category: "Electrical", price: "15.50", cost: "8.20", vatRate: "23" },
      
      // Emergency Items
      { name: "Jump Leads", category: "Emergency", price: "25.00", cost: "12.50", vatRate: "23" },
      { name: "Puncture Repair Kit", category: "Emergency", price: "18.50", cost: "9.80", vatRate: "23" }
    ],
    defaultCategories: [
      "Services", "Oils & Fluids", "Filters", "Brake Parts", 
      "Accessories", "Electrical", "Emergency"
    ],
    defaultSettings: {
      currency: "EUR",
      taxRate: 23,
      receiptFooter: "Safe driving! Come back soon 🔧",
      loyaltyProgram: false,
      ageVerification: false,
      tableService: false,
      appointmentBooking: true,
      deliveryService: false,
      stockTracking: true,
      staffCommissions: true
    },
    requiredIntegrations: ["service-booking", "parts-catalog", "vehicle-database"],
    features: ["service-booking", "parts-inventory", "labor-tracking", "vehicle-history"],
    isActive: true,
    createdAt: new Date()
  },

  {
    id: "off-license",
    name: "Off License & Convenience",
    businessType: "offlicense",
    description: "Off-license with alcohol, tobacco, and convenience items",
    icon: "🍷",
    primaryColor: "#ef4444", // Red
    defaultProducts: [
      // Alcohol - Beer
      { name: "Heineken 6-Pack", category: "Beer", price: "8.99", cost: "4.50", vatRate: "23" },
      { name: "Guinness 4-Pack", category: "Beer", price: "7.50", cost: "3.80", vatRate: "23" },
      { name: "Corona 12-Pack", category: "Beer", price: "16.99", cost: "8.50", vatRate: "23" },
      { name: "Budweiser 500ml", category: "Beer", price: "2.50", cost: "1.20", vatRate: "23" },
      
      // Alcohol - Wine & Spirits
      { name: "House Red Wine", category: "Wine", price: "12.99", cost: "6.50", vatRate: "23" },
      { name: "Sauvignon Blanc", category: "Wine", price: "15.50", cost: "7.80", vatRate: "23" },
      { name: "Jameson 700ml", category: "Spirits", price: "28.50", cost: "18.20", vatRate: "23" },
      { name: "Smirnoff Vodka 700ml", category: "Spirits", price: "25.99", cost: "16.50", vatRate: "23" },
      
      // Tobacco
      { name: "Marlboro Gold 20s", category: "Tobacco", price: "15.50", cost: "12.80", vatRate: "23" },
      { name: "John Player Blue", category: "Tobacco", price: "15.20", cost: "12.60", vatRate: "23" },
      
      // Convenience
      { name: "Coca Cola 2L", category: "Soft Drinks", price: "2.85", cost: "1.40", vatRate: "23" },
      { name: "Red Bull", category: "Energy Drinks", price: "2.50", cost: "1.20", vatRate: "23" },
      { name: "Tayto Crisps", category: "Snacks", price: "1.50", cost: "0.65", vatRate: "23" },
      { name: "Daily Newspaper", category: "Newspapers", price: "2.20", cost: "1.40", vatRate: "0" },
      { name: "Scratch Card €5", category: "Lottery", price: "5.00", cost: "0.00", vatRate: "0" },
      { name: "Phone Credit €10", category: "Top-ups", price: "10.00", cost: "8.50", vatRate: "23" }
    ],
    defaultCategories: [
      "Beer", "Wine", "Spirits", "Tobacco", "Soft Drinks", 
      "Energy Drinks", "Snacks", "Newspapers", "Lottery", "Top-ups"
    ],
    defaultSettings: {
      currency: "EUR",
      taxRate: 23,
      receiptFooter: "Thanks for shopping with us!",
      loyaltyProgram: false,
      ageVerification: true,
      tableService: false,
      appointmentBooking: false,
      deliveryService: false,
      stockTracking: true,
      staffCommissions: false
    },
    requiredIntegrations: ["age-verification", "lottery-terminal", "payment-terminal"],
    features: ["age-verification", "bulk-discounts", "supplier-management"],
    isActive: true,
    createdAt: new Date()
  },

  {
    id: "fresh-bakery",
    name: "Artisan Bakery",
    businessType: "bakery",
    description: "Fresh daily bakery with breads, pastries and custom cakes",
    icon: "🥖",
    primaryColor: "#f97316", // Orange
    defaultProducts: [
      // Fresh Breads (daily)
      { name: "Sourdough Loaf", category: "Fresh Breads", price: "4.50", cost: "1.80", vatRate: "0" },
      { name: "Brown Soda Bread", category: "Fresh Breads", price: "3.20", cost: "1.20", vatRate: "0" },
      { name: "Baguette", category: "Fresh Breads", price: "2.80", cost: "1.10", vatRate: "0" },
      { name: "Wholemeal Loaf", category: "Fresh Breads", price: "4.20", cost: "1.70", vatRate: "0" },
      
      // Pastries
      { name: "Croissant", category: "Pastries", price: "2.80", cost: "1.20", vatRate: "13.5" },
      { name: "Pain au Chocolat", category: "Pastries", price: "3.20", cost: "1.50", vatRate: "13.5" },
      { name: "Danish Pastry", category: "Pastries", price: "3.50", cost: "1.60", vatRate: "13.5" },
      { name: "Apple Turnover", category: "Pastries", price: "3.80", cost: "1.70", vatRate: "13.5" },
      
      // Cakes & Treats
      { name: "Victoria Sponge Slice", category: "Cakes", price: "4.50", cost: "2.10", vatRate: "13.5" },
      { name: "Chocolate Éclair", category: "Treats", price: "3.80", cost: "1.80", vatRate: "13.5" },
      { name: "Fresh Cream Doughnut", category: "Treats", price: "2.50", cost: "1.10", vatRate: "13.5" },
      { name: "Scone with Jam", category: "Scones", price: "3.20", cost: "1.40", vatRate: "13.5" },
      
      // Custom Orders
      { name: "Birthday Cake (6 inch)", category: "Custom Cakes", price: "25.00", cost: "12.50", vatRate: "13.5" },
      { name: "Wedding Cake Quote", category: "Custom Cakes", price: "0.00", cost: "0.00", vatRate: "13.5" },
      
      // Beverages
      { name: "Freshly Ground Coffee", category: "Beverages", price: "3.50", cost: "1.20", vatRate: "13.5" },
      { name: "Tea", category: "Beverages", price: "2.80", cost: "0.80", vatRate: "13.5" }
    ],
    defaultCategories: [
      "Fresh Breads", "Pastries", "Cakes", "Treats", 
      "Scones", "Custom Cakes", "Beverages"
    ],
    defaultSettings: {
      currency: "EUR",
      taxRate: 13.5,
      receiptFooter: "Fresh daily! Thanks for choosing us 🥖",
      loyaltyProgram: true,
      ageVerification: false,
      tableService: false,
      appointmentBooking: false,
      deliveryService: true,
      stockTracking: true,
      staffCommissions: false
    },
    requiredIntegrations: ["custom-orders", "delivery-service", "expiry-tracking"],
    features: ["fresh-daily", "expiry-tracking", "bulk-orders", "ingredient-management"],
    isActive: true,
    createdAt: new Date()
  },

  {
    id: "wholesale-distributor",
    name: "Wholesale Distributor",
    businessType: "wholesaler",
    description: "Bulk supplier to trade customers with volume pricing",
    icon: "📦",
    primaryColor: "#8b5cf6", // Purple
    defaultProducts: [
      // Bulk Food Items
      { name: "Coca Cola Cases (24x330ml)", category: "Soft Drinks", price: "18.50", cost: "12.80", vatRate: "23" },
      { name: "Heinz Beans Cases (12x400g)", category: "Canned Goods", price: "15.60", cost: "10.20", vatRate: "0" },
      { name: "Bread Flour 25kg Sack", category: "Baking", price: "28.50", cost: "18.90", vatRate: "0" },
      { name: "Cooking Oil 20L", category: "Oils", price: "45.00", cost: "32.50", vatRate: "0" },
      
      // Cleaning Supplies (Bulk)
      { name: "Industrial Bleach 5L", category: "Cleaning", price: "12.50", cost: "8.20", vatRate: "23" },
      { name: "Kitchen Roll Cases (24 rolls)", category: "Paper Products", price: "35.00", cost: "24.50", vatRate: "23" },
      { name: "Washing Up Liquid 5L", category: "Cleaning", price: "18.90", cost: "12.50", vatRate: "23" },
      
      // Alcohol (Trade)
      { name: "Heineken Kegs (30L)", category: "Draught Beer", price: "85.00", cost: "58.50", vatRate: "23" },
      { name: "House Wine Cases (12x750ml)", category: "Wine Cases", price: "65.00", cost: "45.50", vatRate: "23" },
      { name: "Spirits Mixed Cases", category: "Spirit Cases", price: "180.00", cost: "135.00", vatRate: "23" },
      
      // Packaging Supplies
      { name: "Takeaway Containers (500pk)", category: "Packaging", price: "45.00", cost: "28.50", vatRate: "23" },
      { name: "Paper Bags (1000pk)", category: "Packaging", price: "22.50", cost: "15.80", vatRate: "23" },
      { name: "Plastic Cups (2000pk)", category: "Disposables", price: "35.00", cost: "24.20", vatRate: "23" }
    ],
    defaultCategories: [
      "Soft Drinks", "Canned Goods", "Baking", "Oils", "Cleaning", 
      "Paper Products", "Draught Beer", "Wine Cases", "Spirit Cases", 
      "Packaging", "Disposables"
    ],
    defaultSettings: {
      currency: "EUR",
      taxRate: 23,
      receiptFooter: "Trade Wholesale - Volume Discounts Available",
      loyaltyProgram: false,
      ageVerification: true,
      tableService: false,
      appointmentBooking: false,
      deliveryService: true,
      stockTracking: true,
      staffCommissions: true
    },
    requiredIntegrations: ["trade-accounts", "delivery-scheduling", "bulk-pricing"],
    features: ["bulk-pricing", "trade-accounts", "delivery-scheduling"],
    isActive: true,
    createdAt: new Date()
  },

  {
    id: "beauty-salon",
    name: "Beauty Salon & Spa",
    businessType: "salon",
    description: "Full-service beauty salon with treatments and retail products",
    icon: "💄",
    primaryColor: "#ec4899", // Pink
    defaultProducts: [
      // Hair Services
      { name: "Cut & Blow Dry", category: "Hair Services", price: "45.00", cost: "15.00", vatRate: "23" },
      { name: "Color & Cut", category: "Hair Services", price: "85.00", cost: "35.00", vatRate: "23" },
      { name: "Highlights", category: "Hair Services", price: "95.00", cost: "40.00", vatRate: "23" },
      { name: "Hair Treatment", category: "Hair Services", price: "35.00", cost: "12.50", vatRate: "23" },
      
      // Beauty Treatments
      { name: "Classic Facial", category: "Facial Treatments", price: "65.00", cost: "25.00", vatRate: "23" },
      { name: "Deep Cleanse Facial", category: "Facial Treatments", price: "85.00", cost: "35.00", vatRate: "23" },
      { name: "Manicure", category: "Nail Services", price: "25.00", cost: "8.50", vatRate: "23" },
      { name: "Gel Polish", category: "Nail Services", price: "35.00", cost: "12.00", vatRate: "23" },
      { name: "Pedicure", category: "Nail Services", price: "40.00", cost: "15.00", vatRate: "23" },
      
      // Waxing
      { name: "Eyebrow Shape", category: "Waxing", price: "18.00", cost: "5.00", vatRate: "23" },
      { name: "Leg Wax", category: "Waxing", price: "35.00", cost: "12.00", vatRate: "23" },
      { name: "Brazilian Wax", category: "Waxing", price: "50.00", cost: "18.00", vatRate: "23" },
      
      // Retail Products
      { name: "Shampoo Premium", category: "Hair Products", price: "28.50", cost: "15.20", vatRate: "23" },
      { name: "Conditioner Premium", category: "Hair Products", price: "32.00", cost: "18.50", vatRate: "23" },
      { name: "Face Moisturizer", category: "Skincare", price: "45.00", cost: "25.50", vatRate: "23" },
      { name: "Nail Polish", category: "Nail Products", price: "15.50", cost: "8.20", vatRate: "23" }
    ],
    defaultCategories: [
      "Hair Services", "Facial Treatments", "Nail Services", "Waxing",
      "Hair Products", "Skincare", "Nail Products"
    ],
    defaultSettings: {
      currency: "EUR",
      taxRate: 23,
      receiptFooter: "You look amazing! Thanks for visiting 💄",
      loyaltyProgram: true,
      ageVerification: false,
      tableService: false,
      appointmentBooking: true,
      deliveryService: false,
      stockTracking: true,
      staffCommissions: true
    },
    requiredIntegrations: ["appointment-booking", "staff-commissions", "retail-pos"],
    features: ["appointment-booking", "service-packages", "staff-commissions"],
    isActive: true,
    createdAt: new Date()
  }
];

/**
 * Get business template by ID
 */
export function getBusinessTemplate(id: string): BusinessTemplate | undefined {
  return BUSINESS_TEMPLATES.find(template => template.id === id);
}

/**
 * Get all active business templates
 */
export function getActiveBusinessTemplates(): BusinessTemplate[] {
  return BUSINESS_TEMPLATES.filter(template => template.isActive);
}

/**
 * Get business templates by type
 */
export function getBusinessTemplatesByType(businessType: string): BusinessTemplate[] {
  return BUSINESS_TEMPLATES.filter(template => template.businessType === businessType);
}

/**
 * Get default products for a business type
 */
export function getDefaultProducts(businessType: string): Product[] {
  const template = BUSINESS_TEMPLATES.find(t => t.businessType === businessType);
  return template?.defaultProducts || [];
}

/**
 * Get default categories for a business type
 */
export function getDefaultCategories(businessType: string): string[] {
  const template = BUSINESS_TEMPLATES.find(t => t.businessType === businessType);
  return template?.defaultCategories || [];
}

/**
 * Get default settings for a business type
 */
export function getDefaultSettings(businessType: string): BusinessSettings | null {
  const template = BUSINESS_TEMPLATES.find(t => t.businessType === businessType);
  return template?.defaultSettings || null;
}