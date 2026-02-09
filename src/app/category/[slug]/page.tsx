import Link from "next/link";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { BusinessCard } from "@/components/ui/Components";
import { businesses, categories, getCategoryBySlug } from "@/data/mockData";

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export default function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const category = getCategoryBySlug(params.slug);

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
              The category you're looking for doesn't exist.
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

  const categoryBusinesses = businesses.filter(
    (b) => b.categoryId === category.id && b.status === "approved",
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-stone-50">
        {/* Header */}
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

        {/* Businesses Grid */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            {categoryBusinesses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryBusinesses.map((business) => (
                  <BusinessCard key={business.id} business={business} />
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
