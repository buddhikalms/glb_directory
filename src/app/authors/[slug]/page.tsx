import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import JsonLd from "@/components/seo/JsonLd";
import { authors, getAuthorBySlug, newsPosts } from "@/data/mockData";
import { breadcrumbSchema, createMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return authors.map((author) => ({ slug: author.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);

  if (!author) {
    return createMetadata({
      title: "Author Not Found",
      description: "This author profile is not available.",
      pathname: `/authors/${slug}`,
      noIndex: true,
    });
  }

  return createMetadata({
    title: author.name,
    description: author.bio,
    pathname: `/authors/${author.slug}`,
  });
}

export default async function AuthorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);

  if (!author) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Author Not Found
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              The author profile you’re looking for doesn’t exist.
            </p>
            <Link href="/news" className="btn-primary">
              Back to News
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const authoredPosts = newsPosts.filter(
    (post) => post.authorSlug === author.slug,
  );
  const authorSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    description: author.bio,
    jobTitle: author.title,
    homeLocation: author.location
      ? { "@type": "Place", name: author.location }
      : undefined,
    url: author.links?.website || undefined,
  };

  const authorBreadcrumbSchema = breadcrumbSchema([
    { name: "Home", pathname: "/" },
    { name: "News", pathname: "/news" },
    { name: author.name, pathname: `/authors/${author.slug}` },
  ]);

  return (
    <>
      <JsonLd id="author-schema" data={authorSchema} />
      <JsonLd id="author-breadcrumb-schema" data={authorBreadcrumbSchema} />
      <Navbar />
      <main className="min-h-screen bg-stone-50">
        <section className="bg-white border-b border-gray-200 py-12 px-4">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-start">
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-emerald-100">
              <Image
                src={author.avatar}
                alt={author.name}
                fill
                sizes="112px"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-emerald-600 font-semibold mb-2">
                {author.title}
              </p>
              <h1 className="font-display text-4xl font-bold text-gray-900 mb-3">
                {author.name}
              </h1>
              <p className="text-gray-700 text-lg leading-relaxed max-w-2xl">
                {author.bio}
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-4">
                {author.location && <span>{author.location}</span>}
                {author.links?.website && (
                  <a
                    href={author.links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 font-semibold"
                  >
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
              Articles by {author.name}
            </h2>
            {authoredPosts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <p className="text-gray-600">No articles yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {authoredPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/news/${post.slug}`}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm card-hover"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5">
                      <p className="text-xs text-emerald-600 font-semibold mb-2">
                        {post.category}
                      </p>
                      <h3 className="font-display text-lg font-bold text-gray-900 mb-1">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-600">{post.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
