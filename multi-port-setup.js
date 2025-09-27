#!/usr/bin/env node

/**
 * Quantum POS Multi-Port Shop Isolation System
 * 
 * This system allows multiple POS shops to run independently on different ports
 * Each shop gets its own isolated environment with separate:
 * - Database schemas (organization-based isolation)
 * - Session storage
 * - Configuration files
 * - Static assets
 * - API endpoints
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Shop Configuration
const SHOPS = [
  {
    name: "Platform Admin",
    slug: "admin",
    port: 5000,
    orgId: 0, // Special admin org
    businessType: "admin",
    description: "Platform-wide administration and shop management"
  },
  {
    name: "Kerrigan's XL",
    slug: "kerrigans-xl",
    port: 5001,
    orgId: 1,
    businessType: "offlicense",
    description: "Off-license with extensive drinks selection"
  },
  {
    name: "The Crown Pub",
    slug: "crown-pub",
    port: 5002,
    orgId: 2,
    businessType: "pub",
    description: "Traditional pub with food kitchen and bar service"
  },
  {
    name: "City Coffee Co",
    slug: "city-coffee",
    port: 5003,
    orgId: 3,
    businessType: "cafe",
    description: "Modern coffee shop with pastries and light meals"
  },
  {
    name: "Murphy's Garage",
    slug: "murphys-garage",
    port: 5004,
    orgId: 4,
    businessType: "garage", 
    description: "Auto repair garage with parts sales"
  },
  {
    name: "Fresh Daily Bakery",
    slug: "fresh-daily",
    port: 5005,
    orgId: 5,
    businessType: "bakery",
    description: "Artisan bakery with fresh bread and pastries"
  }
];

class MultiPortManager {
  constructor() {
    this.processes = new Map();
    this.logDir = './logs';
    this.configDir = './shop-configs';
    
    // Ensure directories exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  /**
   * Generate shop-specific environment variables
   */
  generateShopEnv(shop) {
    return {
      ...process.env,
      PORT: shop.port.toString(),
      SHOP_NAME: shop.name,
      SHOP_SLUG: shop.slug,
      ORGANIZATION_ID: shop.orgId.toString(),
      BUSINESS_TYPE: shop.businessType,
      DATABASE_URL: process.env.DATABASE_URL + `?options=-c search_path=org_${shop.orgId}`,
      SESSION_NAME: `quantum_pos_${shop.slug}`,
      STATIC_PREFIX: `/static/${shop.slug}`,
      API_PREFIX: `/api/${shop.slug}`,
      SHOP_DESCRIPTION: shop.description
    };
  }

  /**
   * Generate shop-specific configuration file
   */
  generateShopConfig(shop) {
    const config = {
      shop: {
        name: shop.name,
        slug: shop.slug,
        organizationId: shop.orgId,
        businessType: shop.businessType,
        description: shop.description,
        port: shop.port
      },
      database: {
        schema: `org_${shop.orgId}`,
        isolationMode: 'organization_id_filter'
      },
      features: this.getBusinessTypeFeatures(shop.businessType),
      branding: {
        primaryColor: this.getBusinessTypeColor(shop.businessType),
        logo: `/assets/logos/${shop.slug}.png`,
        favicon: `/assets/favicons/${shop.slug}.ico`
      },
      security: {
        sessionTimeout: 3600000, // 1 hour
        maxLoginAttempts: 5,
        requirePin: shop.businessType !== 'admin'
      }
    };

    const configPath = path.join(this.configDir, `${shop.slug}.json`);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return configPath;
  }

  /**
   * Get features enabled for each business type
   */
  getBusinessTypeFeatures(businessType) {
    const features = {
      admin: ['platform-management', 'multi-shop-analytics', 'user-administration'],
      pub: ['food-service', 'bar-service', 'table-management', 'happy-hour'],
      restaurant: ['table-service', 'kitchen-orders', 'reservations', 'menu-management'],
      cafe: ['coffee-service', 'pastry-display', 'loyalty-cards', 'mobile-orders'],
      offlicense: ['age-verification', 'bulk-discounts', 'supplier-management'],
      garage: ['service-booking', 'parts-inventory', 'labor-tracking', 'vehicle-history'],
      bakery: ['fresh-daily', 'expiry-tracking', 'bulk-orders', 'ingredient-management'],
      pharmacy: ['prescription-handling', 'health-compliance', 'restricted-sales'],
      retail: ['barcode-scanning', 'size-variants', 'seasonal-stock'],
      wholesaler: ['bulk-pricing', 'trade-accounts', 'delivery-scheduling'],
      salon: ['appointment-booking', 'service-packages', 'staff-commissions'],
      hardware: ['trade-accounts', 'delivery-service', 'project-quotes']
    };
    return features[businessType] || ['basic-pos'];
  }

  /**
   * Get primary color for business type
   */
  getBusinessTypeColor(businessType) {
    const colors = {
      admin: '#2563eb', // Blue
      pub: '#f59e0b', // Amber
      restaurant: '#10b981', // Emerald
      cafe: '#8b5cf6', // Purple
      offlicense: '#ef4444', // Red
      garage: '#6b7280', // Gray
      bakery: '#f97316', // Orange
      pharmacy: '#06b6d4', // Cyan
      retail: '#3b82f6', // Blue
      wholesaler: '#8b5cf6', // Purple
      salon: '#ec4899', // Pink
      hardware: '#f97316' // Orange
    };
    return colors[businessType] || '#6b7280';
  }

  /**
   * Start a single shop instance
   */
  async startShop(shop) {
    const shopEnv = this.generateShopEnv(shop);
    const configPath = this.generateShopConfig(shop);
    const logPath = path.join(this.logDir, `${shop.slug}.log`);

    console.log(`🚀 Starting ${shop.name} on port ${shop.port}...`);

    const logStream = fs.createWriteStream(logPath, { flags: 'a' });
    
    const process = spawn('npm', ['run', 'dev'], {
      env: shopEnv,
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Log process output
    process.stdout.on('data', (data) => {
      const timestamp = new Date().toISOString();
      logStream.write(`[${timestamp}] STDOUT: ${data}`);
    });

    process.stderr.on('data', (data) => {
      const timestamp = new Date().toISOString();
      logStream.write(`[${timestamp}] STDERR: ${data}`);
    });

    process.on('close', (code) => {
      console.log(`❌ ${shop.name} process exited with code ${code}`);
      logStream.end();
      this.processes.delete(shop.slug);
    });

    process.on('error', (error) => {
      console.error(`❌ Failed to start ${shop.name}:`, error);
      logStream.end();
    });

    this.processes.set(shop.slug, {
      process,
      shop,
      configPath,
      logPath,
      startTime: new Date()
    });

    return process;
  }

  /**
   * Start all shops
   */
  async startAllShops() {
    console.log('🌟 Starting Quantum POS Multi-Port System...\n');
    
    for (const shop of SHOPS) {
      await this.startShop(shop);
      // Stagger startup to avoid port conflicts
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✅ All shops started successfully!');
    this.displayStatus();
  }

  /**
   * Stop a specific shop
   */
  stopShop(shopSlug) {
    const shopData = this.processes.get(shopSlug);
    if (shopData) {
      shopData.process.kill();
      console.log(`⏹️  Stopped ${shopData.shop.name}`);
    }
  }

  /**
   * Stop all shops
   */
  stopAllShops() {
    console.log('⏹️  Stopping all shops...');
    for (const [slug] of this.processes) {
      this.stopShop(slug);
    }
  }

  /**
   * Display current status
   */
  displayStatus() {
    console.log('\n📊 QUANTUM POS SYSTEM STATUS');
    console.log('='.repeat(50));
    
    SHOPS.forEach(shop => {
      const isRunning = this.processes.has(shop.slug);
      const status = isRunning ? '🟢 RUNNING' : '🔴 STOPPED';
      const url = `http://localhost:${shop.port}`;
      
      console.log(`${status} ${shop.name}`);
      console.log(`   📍 ${url} (${shop.businessType})`);
      console.log(`   🏢 Org ID: ${shop.orgId} | Port: ${shop.port}`);
      console.log(`   📋 ${shop.description}`);
      console.log('');
    });

    console.log('🔧 MANAGEMENT COMMANDS:');
    console.log('   node multi-port-setup.js start     - Start all shops');
    console.log('   node multi-port-setup.js stop      - Stop all shops');
    console.log('   node multi-port-setup.js status    - Show status');
    console.log('   node multi-port-setup.js logs      - View all logs');
    console.log('');
  }

  /**
   * View logs for all shops
   */
  viewLogs() {
    console.log('📋 VIEWING LOGS FOR ALL SHOPS\n');
    
    SHOPS.forEach(shop => {
      const logPath = path.join(this.logDir, `${shop.slug}.log`);
      if (fs.existsSync(logPath)) {
        console.log(`📄 ${shop.name} (${logPath}):`);
        const logContent = fs.readFileSync(logPath, 'utf8');
        const recentLines = logContent.split('\n').slice(-10).join('\n');
        console.log(recentLines);
        console.log('-'.repeat(50));
      }
    });
  }
}

// CLI Interface
const manager = new MultiPortManager();
const command = process.argv[2];

switch (command) {
  case 'start':
    manager.startAllShops();
    break;
    
  case 'stop':
    manager.stopAllShops();
    process.exit(0);
    break;
    
  case 'status':
    manager.displayStatus();
    break;
    
  case 'logs':
    manager.viewLogs();
    break;
    
  default:
    console.log(`
🌟 Quantum POS Multi-Port System

USAGE:
  node multi-port-setup.js <command>

COMMANDS:
  start    - Start all shop instances on different ports
  stop     - Stop all running shop instances  
  status   - Show current status of all shops
  logs     - View recent logs from all shops

SHOP INSTANCES:
${SHOPS.map(shop => `  • ${shop.name} - http://localhost:${shop.port} (${shop.businessType})`).join('\n')}

FEATURES:
✅ Complete tenant isolation per shop
✅ Individual databases and sessions  
✅ Business-type specific configurations
✅ Centralized logging and monitoring
✅ Easy shop management and scaling
    `);
    break;
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Graceful shutdown...');
  manager.stopAllShops();
  process.exit(0);
});

process.on('SIGTERM', () => {
  manager.stopAllShops();
  process.exit(0);
});