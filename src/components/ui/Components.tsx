"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Business,
  Category,
  Product,
  MenuItem,
  Service,
  Badge,
  getBadgeById,
  getCategoryById,
  getAverageRatingByBusinessId,
  getReviewCountByBusinessId,
} from "@/data/mockData";

interface BusinessCardBadge {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface BusinessCardCategory {
  id?: string;
  name: string;
  icon: string;
}

// Business Card Component
export function BusinessCard({
  business,
  category: categoryOverride,
  badges: badgesOverride,
  averageRating: averageRatingOverride,
  reviewCount: reviewCountOverride,
}: {
  business: Business & {
    gallery?: string[];
    pricingPackageName?: string;
    packageExpiresAt?: string;
  };
  category?: BusinessCardCategory;
  badges?: BusinessCardBadge[];
  averageRating?: number;
  reviewCount?: number;
}) {
  const category = categoryOverride || getCategoryById(business.categoryId);
  const averageRating =
    averageRatingOverride ?? getAverageRatingByBusinessId(business.id);
  const reviewCount =
    reviewCountOverride ?? getReviewCountByBusinessId(business.id);
  const badges = badgesOverride
    ? badgesOverride
    : business.badges
        .map((badgeId) => getBadgeById(badgeId))
        .filter((badge): badge is Badge => Boolean(badge));
  const gallery = Array.isArray(business.gallery) ? business.gallery : [];
  const primaryImage = business.coverImage || gallery[0] || "";

  return (
    <Link href={`/business/${business.slug}`}>
      <div className="group bg-white rounded-2xl overflow-hidden shadow-md card-hover">
        <div className="relative h-48 overflow-hidden">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={business.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-emerald-200 via-emerald-100 to-stone-100" />
          )}
          {business.featured && (
            <div className="absolute top-3 right-3 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Featured
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-display text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors mb-1">
                {business.name}
              </h3>
              <p className="text-sm text-gray-600">{business.tagline}</p>
            </div>
            {business.logo && (
              <Image
                src={business.logo}
                alt={`${business.name} logo`}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover ml-3 border-2 border-gray-100"
              />
            )}
          </div>

          <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {business.location.city}
            {category && (
              <>
                <span>•</span>
                <span>
                  {category.icon} {category.name}
                </span>
              </>
            )}
          </div>

          {business.pricingPackageName && (
            <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              Plan: <span className="font-semibold">{business.pricingPackageName}</span>
              {business.packageExpiresAt && (
                <span className="text-emerald-700">
                  {" "}
                  • Expires {business.packageExpiresAt}
                </span>
              )}
            </div>
          )}

          {gallery.length > 0 && (
            <div className="mb-3 flex gap-2 overflow-hidden">
              {gallery.slice(0, 3).map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="relative h-12 flex-1 overflow-hidden rounded-md border"
                >
                  <Image
                    src={image}
                    alt={`${business.name} gallery ${index + 1}`}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600">★</span>
              <span>
                {averageRating > 0 ? averageRating.toFixed(1) : "New"}{" "}
                {reviewCount > 0 && (
                  <span className="text-gray-400">({reviewCount} reviews)</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>❤️</span>
              <span>{business.likes}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {badges.slice(0, 3).map((badge) => (
              <BadgeTag key={badge.id} badge={badge} />
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Badge Tag Component
export function BadgeTag({
  badge,
}: {
  badge: Pick<Badge, "id" | "name" | "icon" | "color">;
}) {
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
    green: "bg-green-100 text-green-800 border-green-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${colorClasses[badge.color] || colorClasses.green}`}
    >
      <span>{badge.icon}</span>
      <span>{badge.name}</span>
    </span>
  );
}

// Product Card Component
export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm card-hover">
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-3">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-display text-xl font-bold text-emerald-600">
            £{product.price}
          </span>
          {product.inStock ? (
            <span className="text-xs text-green-600 font-semibold">
              In Stock
            </span>
          ) : (
            <span className="text-xs text-gray-400 font-semibold">
              Out of Stock
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Menu Item Component
export function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900">{item.name}</h3>
        <span className="font-display text-lg font-bold text-emerald-600 ml-3">
          £{item.price.toFixed(2)}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
      <div className="flex flex-wrap gap-1">
        {item.dietary.map((diet, index) => (
          <span
            key={index}
            className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full"
          >
            {diet}
          </span>
        ))}
      </div>
    </div>
  );
}

// Service Card Component
export function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm card-hover">
      <h3 className="font-display font-semibold text-lg text-gray-900 mb-2">
        {service.name}
      </h3>
      <p className="text-gray-600 mb-3">{service.description}</p>
      <div className="flex items-center text-emerald-600 font-semibold">
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {service.pricing}
      </div>
    </div>
  );
}

// Category Card Component
export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/category/${category.slug}`}>
      <div className="bg-white rounded-2xl p-6 shadow-md card-hover text-center">
        <div className="text-5xl mb-3">{category.icon}</div>
        <h3 className="font-display text-lg font-bold text-gray-900 mb-1">
          {category.name}
        </h3>
        <p className="text-sm text-gray-600">{category.description}</p>
      </div>
    </Link>
  );
}

// Search Bar Component
export function SearchBar({
  onSearch,
}: {
  onSearch?: (query: string) => void;
}) {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search sustainable businesses..."
        onChange={(e) => onSearch?.(e.target.value)}
        className="w-full px-6 py-4 pr-12 rounded-full border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-700 shadow-sm"
      />
      <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 text-white p-3 rounded-full hover:bg-emerald-700 transition-colors">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>
    </div>
  );
}

// Stats Card Component
export function StatsCard({
  icon,
  label,
  value,
  color = "emerald",
}: {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-display font-bold text-gray-900">
            {value}
          </p>
        </div>
        <div
          className={`text-4xl bg-${color}-100 w-16 h-16 rounded-full flex items-center justify-center`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// Form Input Component
export function FormInput({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-gray-700 mb-2"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="input-field"
      />
    </div>
  );
}

// Form Textarea Component
export function FormTextarea({
  label,
  name,
  required = false,
  placeholder,
  rows = 4,
  value,
  onChange,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-gray-700 mb-2"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        required={required}
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={onChange}
        className="input-field resize-none"
      />
    </div>
  );
}

// Form Select Component
export function FormSelect({
  label,
  name,
  required = false,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  required?: boolean;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-gray-700 mb-2"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        className="input-field"
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
