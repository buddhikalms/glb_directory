export interface BadgeRow {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  usageCount: number;
}

export interface BadgeFormData {
  name: string;
  slug: string;
  icon: string;
  color: string;
}

export const emptyBadgeForm: BadgeFormData = {
  name: "",
  slug: "",
  icon: "",
  color: "emerald",
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
