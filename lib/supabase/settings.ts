import { createClient } from "./server";
import { DEFAULT_PLATFORM_SETTINGS, type PlatformSettings } from "@/lib/utils/fee-calculator";

let cached: PlatformSettings | null = null;

export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (cached) return cached;
  try {
    const sb = createClient();
    const { data, error } = await sb.from("platform_settings").select("key, value");
    if (error || !data) {
      cached = DEFAULT_PLATFORM_SETTINGS;
      return cached;
    }
    const settings = data.reduce<PlatformSettings>((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {} as PlatformSettings);
    cached = { ...DEFAULT_PLATFORM_SETTINGS, ...settings };
    return cached;
  } catch {
    cached = DEFAULT_PLATFORM_SETTINGS;
    return cached;
  }
}

export function clearSettingsCache() {
  cached = null;
}
