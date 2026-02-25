export const PACKAGE_FEATURE_OPTIONS = [
  { key: "branding", label: "Logo and cover image" },
  { key: "gallery", label: "Gallery images" },
  { key: "products", label: "Products" },
  { key: "services", label: "Services" },
  { key: "menu_items", label: "Menu items" },
  { key: "badges", label: "Badges" },
  { key: "featured_listing", label: "Featured listing" },
] as const;

export type PackageFeatureKey = (typeof PACKAGE_FEATURE_OPTIONS)[number]["key"];

const PACKAGE_FEATURE_KEY_SET = new Set<PackageFeatureKey>(
  PACKAGE_FEATURE_OPTIONS.map((item) => item.key),
);

const LEGACY_FEATURE_ALIASES: Array<{
  key: PackageFeatureKey;
  matches: Array<string | RegExp>;
}> = [
  {
    key: "branding",
    matches: ["branding", "logo", "cover image", "cover"],
  },
  {
    key: "gallery",
    matches: ["gallery", "photo", "images"],
  },
  {
    key: "products",
    matches: ["product", "catalog"],
  },
  {
    key: "services",
    matches: ["service"],
  },
  {
    key: "menu_items",
    matches: ["menu"],
  },
  {
    key: "badges",
    matches: ["badge"],
  },
  {
    key: "featured_listing",
    matches: ["featured"],
  },
];

function normalizeFeatureKey(value: string): PackageFeatureKey | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  if (PACKAGE_FEATURE_KEY_SET.has(normalized as PackageFeatureKey)) {
    return normalized as PackageFeatureKey;
  }

  for (const alias of LEGACY_FEATURE_ALIASES) {
    const isMatch = alias.matches.some((candidate) => {
      if (typeof candidate === "string") {
        return normalized.includes(candidate);
      }
      return candidate.test(normalized);
    });
    if (isMatch) return alias.key;
  }

  return null;
}

export function normalizePackageFeatures(value: unknown): PackageFeatureKey[] {
  if (!Array.isArray(value)) return [];
  const keys = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => normalizeFeatureKey(item))
    .filter((item): item is PackageFeatureKey => Boolean(item));

  return Array.from(new Set(keys));
}

export function getPackageFeatureLabel(feature: string): string {
  const matched = PACKAGE_FEATURE_OPTIONS.find((item) => item.key === feature);
  return matched?.label || feature;
}
