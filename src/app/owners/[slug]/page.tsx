import Link from "next/link";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import {
  businesses,
  getBusinessById,
  getUserBySlug,
  users,
} from "@/data/mockData";

export const dynamicParams = false;

export function generateStaticParams() {
  return users
    .filter((user) => user.role === "business_owner" && user.slug)
    .map((user) => ({ slug: user.slug as string }));
}

export default function OwnerProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const owner = getUserBySlug(params.slug);

  if (!owner) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Owner Not Found
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              The owner profile you're looking for doesn't exist.
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

  const ownerBusiness = owner.businessId
    ? getBusinessById(owner.businessId)
    : null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-stone-50">
        <section className="bg-white border-b border-gray-200 py-12 px-4">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-start">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-emerald-100">
              <img
                src={owner.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400"}
                alt={owner.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              {owner.title && (
                <p className="text-sm text-emerald-600 font-semibold mb-2">
                  {owner.title}
                </p>
              )}
              <h1 className="font-display text-4xl font-bold text-gray-900 mb-3">
                {owner.name}
              </h1>
              {owner.bio && (
                <p className="text-gray-700 text-lg leading-relaxed max-w-2xl">
                  {owner.bio}
                </p>
              )}
              <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-4">
                {owner.location && <span>{owner.location}</span>}
                <span>{owner.email}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
              Business Listing
            </h2>
            {ownerBusiness ? (
              <Link
                href={`/business/${ownerBusiness.slug}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm card-hover block"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={ownerBusiness.coverImage}
                    alt={ownerBusiness.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-2xl font-bold text-gray-900 mb-2">
                    {ownerBusiness.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {ownerBusiness.tagline}
                  </p>
                  <p className="text-sm text-emerald-600 font-semibold">
                    View listing
                  </p>
                </div>
              </Link>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center">
                <p className="text-gray-600">
                  No listing associated with this owner yet.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
