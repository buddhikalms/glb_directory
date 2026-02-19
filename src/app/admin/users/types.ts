export type UserRole =
  | "admin"
  | "business_owner"
  | "author"
  | "editor"
  | "subscriber"
  | "guest";

export interface BusinessOption {
  id: string;
  name: string;
}

export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  slug: string;
  avatar: string;
  bio: string;
  location: string;
  title: string;
  businessId: string;
  businessName: string;
}

export interface UserFormData {
  email: string;
  name: string;
  role: UserRole;
  slug: string;
  avatar: string;
  bio: string;
  location: string;
  title: string;
  businessId: string;
}

export const userRoles: UserRole[] = [
  "admin",
  "business_owner",
  "author",
  "editor",
  "subscriber",
  "guest",
];

export const emptyUserForm: UserFormData = {
  email: "",
  name: "",
  role: "guest",
  slug: "",
  avatar: "",
  bio: "",
  location: "",
  title: "",
  businessId: "",
};

