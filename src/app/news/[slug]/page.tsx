import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import JsonLd from "@/components/seo/JsonLd";
import { getAuthorBySlug, getNewsBySlug, newsPosts } from "@/data/mockData";
import { absoluteUrl, breadcrumbSchema, createMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return newsPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getNewsBySlug(slug);

  if (!post) {
    return createMetadata({
      title: "Article Not Found",
      description: "This article is not available.",
      pathname: `/news/${slug}`,
      noIndex: true,
    });
  }

  return createMetadata({
    title: post.title,
    description: post.excerpt,
    pathname: `/news/${post.slug}`,
    type: "article",
    keywords: [post.category, ...post.tags],
  });
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getNewsBySlug(slug);

  if (!post) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Article Not Found
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              The news article you're looking for doesn't exist.
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

  const relatedPosts = newsPosts
    .filter((item) => item.id !== post.id)
    .slice(0, 3);

  const latestPosts = newsPosts
    .filter((item) => item.id !== post.id)
    .slice(0, 5);

  const categories = Array.from(
    new Set(newsPosts.map((item) => item.category)),
  );

  const author = getAuthorBySlug(post.authorSlug);
  const articleSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    author: {
      "@type": "Person",
      name: post.author,
    },
    image: post.coverImage,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/news/${post.slug}`),
    },
    keywords: post.tags.join(", "),
    articleSection: post.category,
  };

  const newsBreadcrumbSchema = breadcrumbSchema([
    { name: "Home", pathname: "/" },
    { name: "News", pathname: "/news" },
    { name: post.title, pathname: `/news/${post.slug}` },
  ]);

  const paragraphs = post.content
    .split("\n\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <>
      <JsonLd id="news-article-schema" data={articleSchema} />
      <JsonLd id="news-breadcrumb-schema" data={newsBreadcrumbSchema} />
      <Navbar />
      <main className="min-h-screen bg-stone-50">
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-10">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
              <span className="uppercase tracking-wide text-emerald-600 font-semibold">
                {post.category}
              </span>
              <span>•</span>
              <span>{post.publishedAt}</span>
              <span>•</span>
              <span>{post.readTime}</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {post.title}
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl">
              {post.excerpt}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                By{" "}
                <Link
                  href={`/authors/${post.authorSlug}`}
                  className="text-emerald-700 font-semibold"
                >
                  {post.author}
                </Link>
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4">
          <div className="max-w-6xl mx-auto -mt-10">
            <div className="relative h-80 md:h-[460px] rounded-3xl overflow-hidden shadow-sm">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 1200px"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-10">
            <article className="bg-white rounded-3xl p-8 md:p-10 shadow-sm">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className={`text-gray-700 text-lg leading-relaxed ${
                    index === paragraphs.length - 1 ? "" : "mb-6"
                  }`}
                >
                  {paragraph}
                </p>
              ))}

              {author && (
                <div className="mt-10 border-t border-gray-100 pt-8">
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-100">
                      <Image
                        src={author.avatar}
                        alt={author.name}
                        fill
                        sizes="64px"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-emerald-600 font-semibold">
                        About the author
                      </p>
                      <h3 className="text-lg font-bold text-gray-900">
                        {author.name}
                      </h3>
                      <p className="text-gray-600 text-sm mt-2">{author.bio}</p>
                      <Link
                        href={`/authors/${author.slug}`}
                        className="inline-flex items-center text-emerald-700 font-semibold text-sm mt-3"
                      >
                        View profile
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </article>

            <aside className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-display text-lg font-bold text-gray-900 mb-4">
                  Latest Posts
                </h3>
                <div className="space-y-4">
                  {latestPosts.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="flex items-start gap-3 group"
                    >
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                        <Image
                          src={item.coverImage}
                          alt={item.title}
                          fill
                          sizes="64px"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600 font-semibold mb-1">
                          {item.category}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.publishedAt}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-display text-lg font-bold text-gray-900 mb-4">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Link
                      key={category}
                      href={`/news?category=${encodeURIComponent(category)}`}
                      className="px-3 py-1 rounded-full text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      {category}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-600 text-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-display text-lg font-bold mb-2">
                  Stay In The Loop
                </h3>
                <p className="text-sm text-emerald-100 mb-4">
                  Get monthly sustainability updates and featured businesses.
                </p>
                <Link
                  href="/news"
                  className="inline-flex items-center justify-center bg-white text-emerald-700 font-semibold px-4 py-2 rounded-full"
                >
                  View all updates
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-gray-900">
                More Stories
              </h2>
              <Link href="/news" className="text-emerald-600 font-semibold">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm card-hover"
                >
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={item.coverImage}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-emerald-600 font-semibold mb-2">
                      {item.category}
                    </p>
                    <h3 className="font-display text-lg font-bold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{item.excerpt}</p>
                    <p className="text-xs text-gray-500">
                      {item.publishedAt} • {item.readTime}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
