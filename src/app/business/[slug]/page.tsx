import Link from "next/link";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { MenuItemCard, ProductCard, ServiceCard } from "@/components/ui/Components";
import { prisma } from "@/lib/prisma";

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
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export default async function BusinessPage({
  params,
}: {
  params: { slug: string };
}) {
  const business = await prisma.business.findFirst({
    where: {
      slug: params.slug,
      status: "approved",
    },
    include: {
      category: true,
      owner: true,
      badges: { include: { badge: true } },
      products: true,
      menuItems: true,
      services: true,
      reviews: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!business) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Business Not Found
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              The business you&apos;re looking for doesn&apos;t exist.
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

  const location = toRecord(business.location);
  const contact = toRecord(business.contact);
  const sustainability = toStringArray(business.sustainability);
  const reviews = business.reviews;
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-stone-50">
        <div className="relative h-96 overflow-hidden bg-gradient-to-b from-emerald-200 to-emerald-50">
          {business.coverImage ? (
            <img
              src={business.coverImage}
              alt={business.name}
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>

        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end mb-6">
              <div className="relative -mt-32">
                {business.logo ? (
                  <img
                    src={business.logo}
                    alt={business.name}
                    className="w-40 h-40 rounded-2xl border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-2xl border-4 border-white shadow-lg bg-emerald-100 flex items-center justify-center text-5xl">
                    🌿
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="font-display text-4xl font-bold text-gray-900">
                  {business.name}
                </h1>
                <p className="text-lg text-emerald-600 font-semibold mt-1">
                  {business.category.icon} {business.category.name}
                </p>
                <p className="text-xl text-gray-600 mt-3">{business.tagline}</p>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                  <span className="text-emerald-600">★</span>
                  <span>{averageRating > 0 ? averageRating.toFixed(1) : "New"}</span>
                  <span className="text-gray-300">•</span>
                  <span>{reviews.length} reviews</span>
                </div>
                {business.badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {business.badges.map((item) => (
                      <div
                        key={item.badgeId}
                        className="px-3 py-1 rounded-full text-sm font-semibold text-white bg-emerald-600"
                      >
                        {item.badge.icon} {item.badge.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-gray-700">
              {asString(contact.phone) && <div>📞 {asString(contact.phone)}</div>}
              {asString(contact.email) && <div>📧 {asString(contact.email)}</div>}
              {asString(location.city) && (
                <div>
                  📍 {asString(location.city)} {asString(location.postcode)}
                </div>
              )}
              {asString(contact.website) && (
                <a
                  href={asString(contact.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:text-emerald-800"
                >
                  🌐 Visit Website
                </a>
              )}
              {business.owner.slug && (
                <Link
                  href={`/owners/${business.owner.slug}`}
                  className="text-emerald-700 hover:text-emerald-800"
                >
                  👤 Meet the owner
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
          <section className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              About This Business
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed">{business.description}</p>
            {sustainability.length > 0 && (
              <div className="mt-6">
                <h3 className="font-display text-xl font-bold text-gray-900 mb-4">
                  Sustainability Features
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sustainability.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-emerald-600 mr-3 mt-1">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Products
            </h2>
            {business.products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {business.products.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No products available at this time.</p>
            )}
          </section>

          <section className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Menu
            </h2>
            {business.menuItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {business.menuItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={{
                      ...item,
                      dietary: toStringArray(item.dietary),
                    } as any}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No menu items available at this time.</p>
            )}
          </section>

          <section className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Services
            </h2>
            {business.services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {business.services.map((service) => (
                  <ServiceCard key={service.id} service={service as any} />
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No services available at this time.</p>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
