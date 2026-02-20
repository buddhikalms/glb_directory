import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { newsPosts } from "@/data/mockData";
import { absoluteUrl, collectionPageSchema, createMetadata } from "@/lib/seo";
import NewsPageClient from "./NewsPageClient";

export const metadata: Metadata = createMetadata({
  title: "News & Updates",
  description:
    "Read sustainability news, business spotlights, and eco-living updates from our directory.",
  pathname: "/news",
});

export default function NewsPage() {
  const postUrls = newsPosts.map((post) => absoluteUrl(`/news/${post.slug}`));

  const newsSchema = collectionPageSchema({
    name: "News & Updates",
    description:
      "Sustainability stories, green business spotlights, and community updates.",
    pathname: "/news",
    itemUrls: postUrls,
  });

  return (
    <>
      <JsonLd id="news-list-schema" data={newsSchema} />
      <NewsPageClient />
    </>
  );
}
