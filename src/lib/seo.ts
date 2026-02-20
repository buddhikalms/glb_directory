import type { Metadata } from "next";

const DEFAULT_SITE_NAME = "Green Living Directory";
const DEFAULT_DESCRIPTION =
  "Discover verified sustainable businesses in your community.";

export function getBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export function absoluteUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getBaseUrl()}${normalizedPath}`;
}

interface CreateMetadataInput {
  title: string;
  description?: string;
  pathname: string;
  type?: "website" | "article";
  noIndex?: boolean;
  keywords?: string[];
}

export function createMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  pathname,
  type = "website",
  noIndex = false,
  keywords,
}: CreateMetadataInput): Metadata {
  const url = absoluteUrl(pathname);

  return {
    title,
    description,
    keywords,
    alternates: { canonical: pathname },
    openGraph: {
      title,
      description,
      url,
      siteName: DEFAULT_SITE_NAME,
      type,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: DEFAULT_SITE_NAME,
    url: getBaseUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: `${getBaseUrl()}/directory?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: DEFAULT_SITE_NAME,
    url: getBaseUrl(),
    description: DEFAULT_DESCRIPTION,
  };
}

export function breadcrumbSchema(
  items: Array<{ name: string; pathname: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.pathname),
    })),
  };
}

export function collectionPageSchema(input: {
  name: string;
  description: string;
  pathname: string;
  itemUrls: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.pathname),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: input.itemUrls.map((url, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url,
      })),
    },
  };
}
