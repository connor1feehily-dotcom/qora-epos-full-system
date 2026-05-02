// Automatic Till Detection and Configuration
// Remembers which till this terminal is, what role it plays, and a stable
// device fingerprint — all in localStorage so the device never has to be
// configured twice.

export type DeviceRole = 'till' | 'back-office' | 'both';

export interface TillConfig {
  tillId: string;
  tillName: string;
  deviceId: string;
  organizationId: number;
  deviceRole: DeviceRole;
  setupDate: string;
  lastUsed: string;
}

const STORAGE_KEY = 'quantum_pos_till_config';

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
    navigator.platform,
  ].join('|');

  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return 'DEVICE_' + Math.abs(hash).toString(36).toUpperCase();
}

export function getTillConfig(): TillConfig | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const raw = JSON.parse(stored) as Partial<TillConfig>;

    // Backward-compat: pre-existing configs that don't have deviceRole
    // default to 'both' so existing terminals keep working.
    const config: TillConfig = {
      tillId: raw.tillId || 'till1',
      tillName: raw.tillName || 'Till 1',
      deviceId: raw.deviceId || generateDeviceFingerprint(),
      organizationId: raw.organizationId ?? 1,
      deviceRole: (raw.deviceRole as DeviceRole) || 'both',
      setupDate: raw.setupDate || new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return config;
  } catch (error) {
    console.error('Error reading till config:', error);
    return null;
  }
}

export function setTillConfig(
  tillId: string,
  tillName: string,
  organizationId: number,
  deviceRole: DeviceRole = 'both',
): TillConfig {
  const config: TillConfig = {
    tillId,
    tillName,
    deviceId: generateDeviceFingerprint(),
    organizationId,
    deviceRole,
    setupDate: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  console.log('Till configured:', config);

  return config;
}

export function clearTillConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.log('Till configuration cleared');
}

export function isTillConfigured(): boolean {
  return getTillConfig() !== null;
}

export function getCurrentTillId(): string | null {
  const config = getTillConfig();
  return config ? config.tillId : null;
}

export function getCurrentTillName(): string | null {
  const config = getTillConfig();
  return config ? config.tillName : null;
}

export function getDeviceRole(): DeviceRole {
  const config = getTillConfig();
  return config?.deviceRole ?? 'both';
}

export function updateTillConfig(updates: Partial<TillConfig>): TillConfig | null {
  const current = getTillConfig();
  if (!current) return null;

  const updated = { ...current, ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  return updated;
}

export function getDeviceFingerprint(): string {
  const config = getTillConfig();
  return config ? config.deviceId : generateDeviceFingerprint();
}

export function exportTillConfig(): string {
  const config = getTillConfig();
  return config ? JSON.stringify(config, null, 2) : 'No configuration found';
}
