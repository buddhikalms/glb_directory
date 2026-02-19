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

export interface BusinessRow {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logo: string;
  coverImage: string;
  ownerId: string;
  status: BusinessStatus;
  featured: boolean;
  categoryId: string;
  createdAt: string;
  location: {
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
}

export interface BusinessFormData {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  categoryId: string;
  ownerId: string;
  logo: string;
  coverImage: string;
  city: string;
  address: string;
  postcode: string;
  email: string;
  phone: string;
  website: string;
  status: BusinessStatus;
  featured: boolean;
}

export const emptyForm: BusinessFormData = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  categoryId: "",
  ownerId: "",
  logo: "",
  coverImage: "",
  city: "",
  address: "",
  postcode: "",
  email: "",
  phone: "",
  website: "",
  status: "pending",
  featured: false,
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

