// Mock data for the green business directory

export type UserRole = "admin" | "business_owner" | "guest";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  businessId?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  color: string;
}

export interface Badge {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

export interface PricingPackage {
  id: string;
  name: string;
  price: number;
  billingPeriod: "monthly" | "yearly";
  description: string;
  features: string[];
  featured: boolean;
  active: boolean;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  categoryId: string;
  logo: string;
  coverImage: string;
  location: {
    city: string;
    address: string;
    postcode: string;
  };
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  social: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  badges: string[];
  sustainability: string[];
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  views: number;
  createdAt: string;
  ownerId: string;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  inStock: boolean;
}

export interface MenuItem {
  id: string;
  businessId: string;
  category: string;
  name: string;
  description: string;
  price: number;
  dietary: string[];
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description: string;
  pricing: string;
}

// Mock Categories
export const categories: Category[] = [
  {
    id: "1",
    name: "Cafes & Restaurants",
    slug: "cafes-restaurants",
    icon: "🍽️",
    description: "Sustainable dining experiences",
    color: "emerald",
  },
  {
    id: "2",
    name: "Retail & Shops",
    slug: "retail-shops",
    icon: "🛍️",
    description: "Eco-friendly products",
    color: "green",
  },
  {
    id: "3",
    name: "Beauty & Wellness",
    slug: "beauty-wellness",
    icon: "💆",
    description: "Natural and organic care",
    color: "teal",
  },
  {
    id: "4",
    name: "Fashion & Clothing",
    slug: "fashion-clothing",
    icon: "👕",
    description: "Sustainable fashion",
    color: "lime",
  },
  {
    id: "5",
    name: "Services",
    slug: "services",
    icon: "🔧",
    description: "Green services",
    color: "cyan",
  },
  {
    id: "6",
    name: "Home & Garden",
    slug: "home-garden",
    icon: "🏡",
    description: "Sustainable living",
    color: "emerald",
  },
];

// Mock Badges
export const badges: Badge[] = [
  {
    id: "1",
    name: "Organic Certified",
    slug: "organic",
    icon: "🌿",
    color: "emerald",
  },
  {
    id: "2",
    name: "Vegan Friendly",
    slug: "vegan",
    icon: "🌱",
    color: "green",
  },
  { id: "3", name: "Fairtrade", slug: "fairtrade", icon: "🤝", color: "amber" },
  {
    id: "4",
    name: "Plastic-Free",
    slug: "plastic-free",
    icon: "♻️",
    color: "blue",
  },
  {
    id: "5",
    name: "Zero Waste",
    slug: "zero-waste",
    icon: "🗑️",
    color: "purple",
  },
  { id: "6", name: "B-Corp", slug: "b-corp", icon: "✓", color: "indigo" },
];

// Mock Pricing Packages
export const pricingPackages: PricingPackage[] = [
  {
    id: "1",
    name: "Starter",
    price: 9.99,
    billingPeriod: "monthly",
    description: "Perfect for new green businesses",
    features: [
      "Basic business profile",
      "Single business listing",
      "Logo & cover image",
      "Contact information",
      "Email support",
    ],
    featured: false,
    active: true,
  },
  {
    id: "2",
    name: "Professional",
    price: 24.99,
    billingPeriod: "monthly",
    description: "Most popular for established businesses",
    features: [
      "All Starter features",
      "Multiple product listings",
      "Menu management",
      "Service offerings",
      "Sustainability certifications",
      "Priority support",
      "Analytics dashboard",
    ],
    featured: true,
    active: true,
  },
  {
    id: "3",
    name: "Enterprise",
    price: 49.99,
    billingPeriod: "monthly",
    description: "For large organizations",
    features: [
      "All Professional features",
      "Unlimited listings",
      "Team member management",
      "Advanced analytics",
      "Social media integration",
      "API access",
      "Phone support",
      "Custom branding",
    ],
    featured: false,
    active: true,
  },
];

// Mock Businesses
export const businesses: Business[] = [
  {
    id: "1",
    name: "Green Leaf Cafe",
    slug: "green-leaf-cafe",
    tagline: "Plant-based dining with a conscience",
    description:
      "Green Leaf Cafe is a fully vegan restaurant committed to sustainable practices. We source all our ingredients locally and organically, use compostable packaging, and operate with 100% renewable energy.",
    categoryId: "1",
    logo: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
    coverImage:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200",
    location: {
      city: "Brighton",
      address: "123 Green Street",
      postcode: "BN1 1AA",
    },
    contact: {
      phone: "01273 123456",
      email: "hello@greenleafcafe.co.uk",
      website: "https://greenleafcafe.co.uk",
    },
    social: {
      instagram: "@greenleafcafe",
      facebook: "greenleafcafe",
    },
    badges: ["2", "1", "4"],
    sustainability: [
      "100% plant-based menu",
      "Zero waste operations",
      "Local & organic sourcing",
      "Renewable energy powered",
      "Compostable packaging only",
    ],
    status: "approved",
    featured: true,
    views: 1247,
    createdAt: "2024-01-15",
    ownerId: "user1",
  },
  {
    id: "2",
    name: "Earth & Thread",
    slug: "earth-and-thread",
    tagline: "Sustainable fashion for conscious consumers",
    description:
      "Earth & Thread offers ethically made clothing from organic and recycled materials. Every piece is crafted with care for people and planet.",
    categoryId: "4",
    logo: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400",
    coverImage:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200",
    location: {
      city: "London",
      address: "45 Eco Lane",
      postcode: "E1 6AN",
    },
    contact: {
      phone: "020 7123 4567",
      email: "info@earthandthread.co.uk",
      website: "https://earthandthread.co.uk",
    },
    social: {
      instagram: "@earthandthread",
      twitter: "@earththread",
    },
    badges: ["1", "3"],
    sustainability: [
      "Organic cotton & hemp fabrics",
      "Fair wages for all workers",
      "Carbon-neutral shipping",
      "Take-back recycling program",
    ],
    status: "approved",
    featured: true,
    views: 892,
    createdAt: "2024-01-20",
    ownerId: "user2",
  },
  {
    id: "3",
    name: "Pure Glow Wellness",
    slug: "pure-glow-wellness",
    tagline: "Natural beauty and holistic treatments",
    description:
      "Pure Glow Wellness offers organic beauty treatments and natural wellness services in a peaceful, eco-conscious environment.",
    categoryId: "3",
    logo: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    coverImage:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200",
    location: {
      city: "Bristol",
      address: "78 Wellness Way",
      postcode: "BS1 2AB",
    },
    contact: {
      phone: "0117 123 4567",
      email: "hello@pureglowwellness.co.uk",
      website: "https://pureglowwellness.co.uk",
    },
    social: {
      instagram: "@pureglowwellness",
    },
    badges: ["1", "2", "4"],
    sustainability: [
      "Certified organic products",
      "Cruelty-free treatments",
      "Water conservation systems",
      "Refillable product containers",
    ],
    status: "approved",
    featured: false,
    views: 654,
    createdAt: "2024-02-01",
    ownerId: "user3",
  },
];

// Mock Products
export const products: Product[] = [
  {
    id: "1",
    businessId: "2",
    name: "Organic Cotton T-Shirt",
    description: "Soft, breathable organic cotton tee in natural dyes",
    price: 35,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    inStock: true,
  },
  {
    id: "2",
    businessId: "2",
    name: "Recycled Denim Jeans",
    description: "Stylish jeans made from 80% recycled denim",
    price: 75,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
    inStock: true,
  },
  {
    id: "3",
    businessId: "2",
    name: "Hemp Hoodie",
    description: "Cozy hoodie from sustainable hemp blend",
    price: 65,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400",
    inStock: true,
  },
];

// Mock Menu Items
export const menuItems: MenuItem[] = [
  {
    id: "1",
    businessId: "1",
    category: "Breakfast",
    name: "Avocado Toast",
    description: "Sourdough, smashed avocado, cherry tomatoes, hemp seeds",
    price: 8.5,
    dietary: ["vegan", "organic"],
  },
  {
    id: "2",
    businessId: "1",
    category: "Breakfast",
    name: "Green Smoothie Bowl",
    description: "Spinach, banana, spirulina, topped with fresh berries",
    price: 7.5,
    dietary: ["vegan", "gluten-free", "organic"],
  },
  {
    id: "3",
    businessId: "1",
    category: "Lunch",
    name: "Buddha Bowl",
    description: "Quinoa, roasted vegetables, tahini dressing, chickpeas",
    price: 12,
    dietary: ["vegan", "gluten-free"],
  },
  {
    id: "4",
    businessId: "1",
    category: "Drinks",
    name: "Matcha Latte",
    description: "Organic matcha with oat milk",
    price: 4.5,
    dietary: ["vegan", "organic"],
  },
];

// Mock Services
export const services: Service[] = [
  {
    id: "1",
    businessId: "3",
    name: "Organic Facial Treatment",
    description: "Deep cleansing facial using certified organic products",
    pricing: "£60 / 60 minutes",
  },
  {
    id: "2",
    businessId: "3",
    name: "Aromatherapy Massage",
    description: "Relaxing massage with essential oils",
    pricing: "£70 / 90 minutes",
  },
  {
    id: "3",
    businessId: "3",
    name: "Natural Manicure",
    description: "Nail care with vegan, non-toxic polish",
    pricing: "£35 / 45 minutes",
  },
];

// Mock Users
export const users: User[] = [
  {
    id: "admin1",
    email: "admin@greenlivingblog.org.uk",
    name: "Admin User",
    role: "admin",
  },
  {
    id: "user1",
    email: "owner@greenleafcafe.co.uk",
    name: "Sarah Green",
    role: "business_owner",
    businessId: "1",
  },
  {
    id: "user2",
    email: "owner@earthandthread.co.uk",
    name: "Tom Earth",
    role: "business_owner",
    businessId: "2",
  },
  {
    id: "user3",
    email: "owner@pureglowwellness.co.uk",
    name: "Emma Pure",
    role: "business_owner",
    businessId: "3",
  },
];

// Helper functions
export const getBusinessById = (id: string) =>
  businesses.find((b) => b.id === id);
export const getBusinessBySlug = (slug: string) =>
  businesses.find((b) => b.slug === slug);
export const getCategoryById = (id: string) =>
  categories.find((c) => c.id === id);
export const getCategoryBySlug = (slug: string) =>
  categories.find((c) => c.slug === slug);
export const getProductsByBusinessId = (businessId: string) =>
  products.filter((p) => p.businessId === businessId);
export const getMenuItemsByBusinessId = (businessId: string) =>
  menuItems.filter((m) => m.businessId === businessId);
export const getServicesByBusinessId = (businessId: string) =>
  services.filter((s) => s.businessId === businessId);
export const getBadgeById = (id: string) => badges.find((b) => b.id === id);
export const getUserById = (id: string) => users.find((u) => u.id === id);
export const getPricingPackageById = (id: string) =>
  pricingPackages.find((p) => p.id === id);
export const getActivePricingPackages = () =>
  pricingPackages.filter((p) => p.active);
