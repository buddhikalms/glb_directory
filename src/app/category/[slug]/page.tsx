import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { BusinessCard } from "@/components/ui/Components";
import JsonLd from "@/components/seo/JsonLd";
import { prisma } from "@/lib/prisma";
import {
  absoluteUrl,
  breadcrumbSchema,
  collectionPageSchema,
  createMetadata,
} from "@/lib/seo";

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!category) {
    return createMetadata({
      title: "Category Not Found",
      description: "This category is not available in the directory.",
      pathname: `/category/${slug}`,
      noIndex: true,
    });
  }

  return createMetadata({
    title: `${category.name} Businesses`,
    description: category.description,
    pathname: `/category/${slug}`,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      description: true,
    },
  });

  if (!category) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Category Not Found
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              The category you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link href="/directory" className="btn-primary">
              Back to Directory
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const categoryBusinessesRaw = await prisma.business.findMany({
    where: {
      categoryId: category.id,
      status: "approved",
    },
    include: {
      badges: { include: { badge: true } },
      pricingPackage: { select: { galleryLimit: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const categoryBusinesses = categoryBusinessesRaw.map((item) => {
    const location = toRecord(item.location);
    const gallery = toStringArray(item.gallery);
    const galleryLimit = item.pricingPackage?.galleryLimit;
    const visibleGallery =
      typeof galleryLimit === "number"
        ? gallery.slice(0, Math.max(galleryLimit, 0))
        : gallery;

    return {
      id: item.id,
      slug: item.slug,
      name: item.name,
      tagline: item.tagline,
      coverImage: item.coverImage,
      gallery: visibleGallery,
      logo: item.logo,
      featured: item.featured,
      likes: item.likes,
      categoryId: item.categoryId,
      badges: item.badges.map((b) => b.badgeId),
      location: {
        city: asString(location.city),
        address: asString(location.address),
        postcode: asString(location.postcode),
      },
      badgeItems: item.badges.map((b) => b.badge),
    };
  });

  const categoryPageSchema = collectionPageSchema({
    name: `${category.name} Businesses`,
    description: category.description,
    pathname: `/category/${category.slug}`,
    itemUrls: categoryBusinesses.map((business) =>
      absoluteUrl(`/business/${business.slug}`),
    ),
  });

  const categoryBreadcrumbSchema = breadcrumbSchema([
    { name: "Home", pathname: "/" },
    { name: "Categories", pathname: "/categories" },
    { name: category.name, pathname: `/category/${category.slug}` },
  ]);

  return (
    <>
      <JsonLd id="category-page-schema" data={categoryPageSchema} />
      <JsonLd id="category-breadcrumb-schema" data={categoryBreadcrumbSchema} />
      <Navbar />
      <main className="min-h-screen bg-stone-50">
        <section className="bg-white border-b border-gray-200 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-6 mb-6">
              <div className="text-6xl">{category.icon}</div>
              <div>
                <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">
                  {category.name}
                </h1>
                <p className="text-lg text-gray-600">
                  {categoryBusinesses.length} verified businesses in this
                  category
                </p>
              </div>
            </div>
            <p className="text-gray-700 text-lg max-w-3xl">
              {category.description}
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            {categoryBusinesses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryBusinesses.map((business) => (
                  <BusinessCard
                    key={business.id}
                    business={business as any}
                    category={category}
                    badges={business.badgeItems}
                    averageRating={0}
                    reviewCount={0}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center">
                <p className="text-gray-600 text-xl mb-6">
                  No businesses found in this category yet.
                </p>
                <Link href="/directory" className="btn-primary">
                  Browse All Businesses
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
