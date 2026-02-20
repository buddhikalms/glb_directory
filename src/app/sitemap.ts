import type { MetadataRoute } from "next";
import { authors, newsPosts, users } from "@/data/mockData";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/directory",
    "/categories",
    "/news",
    "/submit",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const [businesses, categories] = await Promise.all([
    prisma.business.findMany({
      where: { status: "approved" },
      select: { slug: true, createdAt: true },
    }),
    prisma.category.findMany({
      select: { slug: true },
    }),
  ]);

  const businessRoutes: MetadataRoute.Sitemap = businesses.map((business) => ({
    url: `${baseUrl}/business/${business.slug}`,
    lastModified: business.createdAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const newsRoutes: MetadataRoute.Sitemap = newsPosts.map((post) => ({
    url: `${baseUrl}/news/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const authorRoutes: MetadataRoute.Sitemap = authors
    .map((author) => ({
      url: `${baseUrl}/authors/${author.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    }));

  const ownerRoutes: MetadataRoute.Sitemap = users
    .filter((user) => user.slug && user.role === "business_owner")
    .map((owner) => ({
      url: `${baseUrl}/owners/${owner.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    }));

  return [
    ...staticRoutes,
    ...businessRoutes,
    ...categoryRoutes,
    ...newsRoutes,
    ...authorRoutes,
    ...ownerRoutes,
  ];
}
