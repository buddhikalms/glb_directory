// Mock data for the green business directory

export type UserRole =
  | "admin"
  | "business_owner"
  | "author"
  | "editor"
  | "subscriber"
  | "guest";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  slug?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  title?: string;
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
  galleryLimit: number;
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
  likes: number;
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

export interface Review {
  id: string;
  businessId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface NewsPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  authorSlug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  publishedAt: string;
  readTime: string;
  tags: string[];
  featured?: boolean;
}

export interface AuthorProfile {
  id: string;
  name: string;
  slug: string;
  title: string;
  bio: string;
  avatar: string;
  location?: string;
  links?: {
    website?: string;
    twitter?: string;
    linkedin?: string;
  };
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
    galleryLimit: 5,
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
    galleryLimit: 12,
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
    galleryLimit: 30,
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
    likes: 142,
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
    likes: 96,
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
    likes: 74,
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

// Mock Reviews
export const reviews: Review[] = [
  {
    id: "r1",
    businessId: "1",
    authorName: "Ella P.",
    rating: 5,
    comment:
      "Fantastic food and genuinely sustainable practices. Love the refill station!",
    createdAt: "2024-03-05",
  },
  {
    id: "r2",
    businessId: "1",
    authorName: "Sam T.",
    rating: 4,
    comment: "Great atmosphere and staff. Slight wait on weekends.",
    createdAt: "2024-03-12",
  },
  {
    id: "r3",
    businessId: "2",
    authorName: "Nora W.",
    rating: 5,
    comment:
      "Quality pieces and transparent sourcing. The repair program is a win.",
    createdAt: "2024-02-28",
  },
  {
    id: "r4",
    businessId: "3",
    authorName: "Jamie K.",
    rating: 4,
    comment: "Relaxing experience and refillable skincare options.",
    createdAt: "2024-03-02",
  },
];

// Mock News
export const newsPosts: NewsPost[] = [
  {
    id: "1",
    title: "Local Cafes Go Plastic-Free",
    slug: "local-cafes-go-plastic-free",
    category: "Community",
    authorSlug: "green-living-team",
    excerpt:
      "A growing number of cafes are switching to compostable packaging and refill programs.",
    content:
      "Local cafes are embracing plastic-free operations by moving to compostable packaging, reusable cup programs, and refill stations.\n\nThese changes are reducing waste and encouraging customers to make more sustainable choices. Several businesses in the directory have already completed the transition and are sharing best practices with peers.\n\nIf you run a cafe or restaurant, consider starting with the highest-impact swaps: takeaway packaging, cutlery, and drink lids. Small changes add up quickly when made at scale.",
    coverImage:
      "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=1200",
    author: "Green Living Directory",
    publishedAt: "2024-02-10",
    readTime: "5 min",
    tags: ["cafes", "plastic-free", "community"],
    featured: true,
  },
  {
    id: "2",
    title: "Sustainable Fashion Picks for Spring",
    slug: "sustainable-fashion-picks-for-spring",
    category: "Fashion",
    authorSlug: "editorial-team",
    excerpt:
      "We rounded up ethical brands with fresh materials, fair wages, and low-impact shipping.",
    content:
      "This spring, sustainable fashion means organic fibers, recycled textiles, and transparency in sourcing.\n\nWe highlight several brands in the directory that prioritize fair wages, carbon-neutral delivery, and durable, timeless designs. Look for detailed material breakdowns and repair or take-back programs when making your picks.\n\nBuying fewer, better pieces remains the most sustainable option. Invest in quality and care for each item to extend its life.",
    coverImage:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200",
    author: "Editorial Team",
    publishedAt: "2024-02-18",
    readTime: "6 min",
    tags: ["fashion", "ethical", "spring"],
  },
  {
    id: "3",
    title: "Wellness Studios Embrace Refill Culture",
    slug: "wellness-studios-embrace-refill-culture",
    category: "Wellness",
    authorSlug: "green-living-team",
    excerpt:
      "Studios are offering refillable skincare and bulk essentials to cut waste.",
    content:
      "Beauty and wellness studios are introducing refill stations for skincare, soaps, and essential oils.\n\nCustomers can reuse containers while supporting businesses that prioritize waste reduction and mindful consumption. Many studios are pairing refills with ingredient transparency and locally sourced products.\n\nAsk your studio about refill incentives and bring-back discounts to make the switch even easier.",
    coverImage:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200",
    author: "Green Living Directory",
    publishedAt: "2024-03-01",
    readTime: "4 min",
    tags: ["wellness", "refill", "zero-waste"],
  },
];

// Mock Authors
export const authors: AuthorProfile[] = [
  {
    id: "author1",
    name: "Green Living Team",
    slug: "green-living-team",
    title: "Community Editors",
    bio: "We highlight sustainable businesses, local initiatives, and practical tips for greener living.",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400",
    location: "Brighton, UK",
    links: {
      website: "https://greenlivingblog.org.uk",
    },
  },
  {
    id: "author2",
    name: "Editorial Team",
    slug: "editorial-team",
    title: "Research & Features",
    bio: "Our editorial team covers sustainable fashion, ethical sourcing, and climate-conscious lifestyles.",
    avatar:
      "https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?w=400",
    location: "London, UK",
  },
];

// Mock Users
export const users: User[] = [
  {
    id: "admin1",
    email: "admin@greenlivingblog.org.uk",
    name: "Admin User",
    role: "admin",
    slug: "admin-user",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    bio: "Keeping the directory verified and up to date.",
    location: "Brighton, UK",
    title: "Directory Administrator",
  },
  {
    id: "user1",
    email: "owner@greenleafcafe.co.uk",
    name: "Sarah Green",
    role: "business_owner",
    businessId: "1",
    slug: "sarah-green",
    avatar:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400",
    bio: "Founder of Green Leaf Cafe and advocate for plant-based dining.",
    location: "Brighton, UK",
    title: "Cafe Owner",
  },
  {
    id: "user2",
    email: "owner@earthandthread.co.uk",
    name: "Tom Earth",
    role: "business_owner",
    businessId: "2",
    slug: "tom-earth",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
    bio: "Designing ethical fashion with a focus on transparency.",
    location: "London, UK",
    title: "Founder, Earth & Thread",
  },
  {
    id: "user3",
    email: "owner@pureglowwellness.co.uk",
    name: "Emma Pure",
    role: "business_owner",
    businessId: "3",
    slug: "emma-pure",
    avatar:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400",
    bio: "Holistic therapist committed to clean beauty and refill culture.",
    location: "Bristol, UK",
    title: "Wellness Studio Owner",
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
export const getReviewsByBusinessId = (businessId: string) =>
  reviews.filter((r) => r.businessId === businessId);
export const getAverageRatingByBusinessId = (businessId: string) => {
  const businessReviews = reviews.filter((r) => r.businessId === businessId);
  if (businessReviews.length === 0) return 0;
  const total = businessReviews.reduce((sum, review) => sum + review.rating, 0);
  return total / businessReviews.length;
};
export const getReviewCountByBusinessId = (businessId: string) =>
  reviews.filter((r) => r.businessId === businessId).length;
export const getBadgeById = (id: string) => badges.find((b) => b.id === id);
export const getUserById = (id: string) => users.find((u) => u.id === id);
export const getUserBySlug = (slug: string) =>
  users.find((u) => u.slug === slug);
export const getPricingPackageById = (id: string) =>
  pricingPackages.find((p) => p.id === id);
export const getActivePricingPackages = () =>
  pricingPackages.filter((p) => p.active);
export const getNewsBySlug = (slug: string) =>
  newsPosts.find((n) => n.slug === slug);
export const getAuthorBySlug = (slug: string) =>
  authors.find((a) => a.slug === slug);
