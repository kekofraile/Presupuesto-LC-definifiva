import { AppConfig } from '../types';
import { loadConfig, saveConfig, setSessionAuthenticated } from './storage';

export async function hashPin(pin: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('La API de criptografía no está disponible en este entorno');
  }
  const encoded = new TextEncoder().encode(pin);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function validatePin(pin: string): Promise<boolean> {
  const config = await loadConfig();
  const hashed = await hashPin(pin);
  return hashed === config.pinHash;
}

export async function signIn(pin: string): Promise<boolean> {
  const valid = await validatePin(pin);
  if (valid) {
    await setSessionAuthenticated(true);
  }
  return valid;
}

export async function signOut(): Promise<void> {
  await setSessionAuthenticated(false);
}

export async function updatePin(pin: string): Promise<AppConfig> {
  const config = await loadConfig();
  const updated: AppConfig = {
    ...config,
    pinHash: await hashPin(pin),
    ultimaActualizacion: new Date().toISOString()
  };
  await saveConfig(updated);
  return updated;
}
