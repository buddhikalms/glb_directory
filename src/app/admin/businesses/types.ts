import type { PackageFeatureKey } from "@/lib/package-features";

export type BusinessStatus = "approved" | "pending" | "rejected";

export interface UserOption {
  id: string;
  name: string;
  role: string;
}

export interface CategoryOption {
  id: string;
  name: string;
}

export interface PricingPackageOption {
  id: string;
  name: string;
  billingPeriod: "monthly" | "yearly";
  durationDays: number;
  galleryLimit: number;
  active: boolean;
  features: PackageFeatureKey[];
}

export interface BadgeOption {
  id: string;
  name: string;
  icon: string;
}

export interface BusinessProductInput {
  name: string;
  description: string;
  price: number;
  image: string;
  inStock: boolean;
}

export interface BusinessMenuItemInput {
  category: string;
  name: string;
  description: string;
  price: number;
  dietary: string[];
}

export interface BusinessServiceInput {
  name: string;
  description: string;
  pricing: string;
}

export interface BusinessRow {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  seoKeywords: string;
  gallery: string[];
  logo: string;
  coverImage: string;
  ownerId: string;
  pricingPackageId: string;
  pricingPackage?: {
    id: string;
    name: string;
    billingPeriod: "monthly" | "yearly";
    durationDays: number;
  };
  status: BusinessStatus;
  featured: boolean;
  categoryId: string;
  createdAt: string;
  location: {
    country: string;
    city: string;
    address: string;
    postcode: string;
  };
  contact: {
    email: string;
    phone: string;
    website: string;
  };
  owner?: {
    name?: string;
  };
  category?: {
    name?: string;
  };
  badgeIds: string[];
  badges: BadgeOption[];
  products: BusinessProductInput[];
  menuItems: BusinessMenuItemInput[];
  services: BusinessServiceInput[];
}

export interface BusinessFormData {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  seoKeywords: string;
  gallery: string[];
  categoryId: string;
  pricingPackageId: string;
  ownerId: string;
  logo: string;
  coverImage: string;
  country: string;
  city: string;
  address: string;
  postcode: string;
  email: string;
  phone: string;
  website: string;
  status: BusinessStatus;
  featured: boolean;
  badgeIds: string[];
  products: BusinessProductInput[];
  menuItems: BusinessMenuItemInput[];
  services: BusinessServiceInput[];
}

export const emptyForm: BusinessFormData = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  seoKeywords: "",
  gallery: [],
  categoryId: "",
  pricingPackageId: "",
  ownerId: "",
  logo: "",
  coverImage: "",
  country: "",
  city: "",
  address: "",
  postcode: "",
  email: "",
  phone: "",
  website: "",
  status: "pending",
  featured: false,
  badgeIds: [],
  products: [],
  menuItems: [],
  services: [],
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
