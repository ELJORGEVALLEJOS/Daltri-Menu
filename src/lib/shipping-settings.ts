export type ShippingType = 'free' | 'paid';

export type ShippingSettings = {
  shippingType: ShippingType;
  shippingCost: number;
};

const LEGACY_STORAGE_KEY = 'shipping_settings';
const STORAGE_KEY_PREFIX = 'shipping_settings_';

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  shippingType: 'free',
  shippingCost: 0,
};

export function getShippingStorageKey(slug: string) {
  return `${STORAGE_KEY_PREFIX}${slug}`;
}

function parseShippingCost(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value);
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }
  return 0;
}

function parseSettings(raw: string | null): ShippingSettings {
  if (!raw) return DEFAULT_SHIPPING_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as Partial<ShippingSettings>;
    const shippingType = parsed.shippingType === 'paid' ? 'paid' : 'free';
    const shippingCost = parseShippingCost(parsed.shippingCost);
    return { shippingType, shippingCost };
  } catch {
    return DEFAULT_SHIPPING_SETTINGS;
  }
}

export function readShippingSettings(slug: string): ShippingSettings {
  if (typeof window === 'undefined' || !slug) return DEFAULT_SHIPPING_SETTINGS;

  const scopedRaw = localStorage.getItem(getShippingStorageKey(slug));
  if (scopedRaw) return parseSettings(scopedRaw);

  // Backward compatibility with previous single-key storage.
  const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
  return parseSettings(legacyRaw);
}

export function saveShippingSettings(slug: string, settings: ShippingSettings) {
  if (typeof window === 'undefined' || !slug) return;

  const normalized: ShippingSettings = {
    shippingType: settings.shippingType === 'paid' ? 'paid' : 'free',
    shippingCost:
      settings.shippingType === 'paid' ? parseShippingCost(settings.shippingCost) : 0,
  };

  localStorage.setItem(getShippingStorageKey(slug), JSON.stringify(normalized));
  localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(normalized));
}
