import Link from "next/link";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { authors, getAuthorBySlug, newsPosts } from "@/data/mockData";

export const dynamicParams = false;

export function generateStaticParams() {
  return authors.map((author) => ({ slug: author.slug }));
}

export default function AuthorProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const author = getAuthorBySlug(params.slug);

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

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-stone-50">
        <section className="bg-white border-b border-gray-200 py-12 px-4">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-start">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-emerald-100">
              <img
                src={author.avatar}
                alt={author.name}
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
                    <div className="h-40 overflow-hidden">
                      <img
                        src={post.coverImage}
                        alt={post.title}
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
