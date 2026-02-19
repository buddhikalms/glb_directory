import Link from "next/link";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { CategoryCard } from "@/components/ui/Components";
import { prisma } from "@/lib/prisma";

export default async function CategoriesPage() {
  const [categories, approvedBusinesses] = await Promise.all([
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        description: true,
        color: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.business.findMany({
      where: { status: "approved" },
      select: { categoryId: true },
    }),
  ]);

  const countsByCategory = approvedBusinesses.reduce<Record<string, number>>(
    (acc, business) => {
      acc[business.categoryId] = (acc[business.categoryId] || 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-stone-50">
        <section className="bg-white border-b border-gray-200 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">
              Browse Categories
            </h1>
            <p className="text-lg text-gray-600">
              Explore {categories.length} categories with{" "}
              {approvedBusinesses.length} verified businesses
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => {
                const count = countsByCategory[category.id] || 0;
                return (
                  <div key={category.id} className="relative">
                    <CategoryCard category={category as any} />
                    <div className="absolute -top-3 -right-3 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                      {count} {count === 1 ? "business" : "businesses"}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 bg-white rounded-2xl p-8 text-center">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
                Want the full list?
              </h2>
              <p className="text-gray-600 mb-6">
                Browse every approved business in the directory.
              </p>
              <Link href="/directory" className="btn-primary">
                View Directory
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

