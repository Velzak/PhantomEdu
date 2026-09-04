export const PREFS_KEY = "gp_prefs";

export type ThemePreference = "light" | "dark" | "system";

export type LocalPrefsV1 = {
  version: 1;
  favorites: string[];
  recentlyPlayed: { slug: string; playedAt: string }[];
  theme: ThemePreference;
  ratedSlugs: string[];
};

type AnyPrefs = { version?: number } & Record<string, unknown>;

const DEFAULT_PREFS: LocalPrefsV1 = {
  version: 1,
  favorites: [],
  recentlyPlayed: [],
  theme: "dark",
  ratedSlugs: [],
};

function migrate(raw: AnyPrefs): LocalPrefsV1 {
  if (raw.version === 1) {
    return {
      version: 1,
      favorites: Array.isArray(raw.favorites) ? (raw.favorites as string[]) : [],
      recentlyPlayed: Array.isArray(raw.recentlyPlayed)
        ? (raw.recentlyPlayed as LocalPrefsV1["recentlyPlayed"])
        : [],
      theme:
        raw.theme === "light" || raw.theme === "dark" || raw.theme === "system"
          ? raw.theme
          : "dark",
      ratedSlugs: Array.isArray(raw.ratedSlugs) ? (raw.ratedSlugs as string[]) : [],
    };
  }
  // Future versions map into v1 here rather than wiping returning visitors' data.
  return { ...DEFAULT_PREFS };
}

export function loadPrefs(): LocalPrefsV1 {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return migrate(JSON.parse(raw) as AnyPrefs);
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs: LocalPrefsV1) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function updatePrefs(patch: Partial<Omit<LocalPrefsV1, "version">>) {
  const next = { ...loadPrefs(), ...patch, version: 1 as const };
  savePrefs(next);
  return next;
}

export function toggleFavorite(slug: string) {
  const prefs = loadPrefs();
  const favorites = prefs.favorites.includes(slug)
    ? prefs.favorites.filter((s) => s !== slug)
    : [...prefs.favorites, slug];
  return updatePrefs({ favorites });
}

export function recordPlayed(slug: string) {
  const prefs = loadPrefs();
  const recentlyPlayed = [
    { slug, playedAt: new Date().toISOString() },
    ...prefs.recentlyPlayed.filter((item) => item.slug !== slug),
  ].slice(0, 20);
  return updatePrefs({ recentlyPlayed });
}

export function markRated(slug: string) {
  const prefs = loadPrefs();
  if (prefs.ratedSlugs.includes(slug)) return prefs;
  return updatePrefs({ ratedSlugs: [...prefs.ratedSlugs, slug] });
}

export function hasRated(slug: string) {
  return loadPrefs().ratedSlugs.includes(slug);
}
