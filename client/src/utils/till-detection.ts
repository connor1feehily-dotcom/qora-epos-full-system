// Automatic Till Detection and Configuration
// Remembers which till this terminal is using localStorage and device fingerprinting

export interface TillConfig {
  tillId: string;
  tillName: string;
  deviceId: string;
  organizationId: number;
  setupDate: string;
  lastUsed: string;
}

const STORAGE_KEY = 'quantum_pos_till_config';

// Generate a unique device fingerprint
function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
    navigator.hardwareConcurrency || 0,
    navigator.platform
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return 'DEVICE_' + Math.abs(hash).toString(36).toUpperCase();
}

// Get current till configuration
export function getTillConfig(): TillConfig | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const config = JSON.parse(stored) as TillConfig;
    
    // Update last used timestamp
    config.lastUsed = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    
    return config;
  } catch (error) {
    console.error('Error reading till config:', error);
    return null;
  }
}

// Set till configuration (first-time setup)
export function setTillConfig(tillId: string, tillName: string, organizationId: number): TillConfig {
  const config: TillConfig = {
    tillId,
    tillName,
    deviceId: generateDeviceFingerprint(),
    organizationId,
    setupDate: new Date().toISOString(),
    lastUsed: new Date().toISOString()
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  console.log('Till configured:', config);
  
  return config;
}

// Clear till configuration (for re-setup or moving terminal)
export function clearTillConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.log('Till configuration cleared');
}

// Check if till is configured
export function isTillConfigured(): boolean {
  return getTillConfig() !== null;
}

// Get current till ID
export function getCurrentTillId(): string | null {
  const config = getTillConfig();
  return config ? config.tillId : null;
}

// Get current till name
export function getCurrentTillName(): string | null {
  const config = getTillConfig();
  return config ? config.tillName : null;
}

// Update till configuration (e.g., change till name)
export function updateTillConfig(updates: Partial<TillConfig>): TillConfig | null {
  const current = getTillConfig();
  if (!current) return null;
  
  const updated = { ...current, ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  
  return updated;
}

// Get device fingerprint
export function getDeviceFingerprint(): string {
  const config = getTillConfig();
  return config ? config.deviceId : generateDeviceFingerprint();
}

// Export for debugging
export function exportTillConfig(): string {
  const config = getTillConfig();
  return config ? JSON.stringify(config, null, 2) : 'No configuration found';
}
