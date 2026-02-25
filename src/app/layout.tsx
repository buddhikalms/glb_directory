import type { Metadata } from "next";
import "./globals.css";
import AuthSessionProvider from "@/components/auth/SessionProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import JsonLd from "@/components/seo/JsonLd";
import {
  createMetadata,
  getBaseUrl,
  organizationSchema,
  websiteSchema,
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  ...createMetadata({
    title: "Green Living Directory - Sustainable Businesses",
    description:
      "Discover and support sustainable businesses in your community. Find eco-friendly cafes, shops, services, and more.",
    pathname: "/",
    type: "website",
  }),
  title: {
    default: "Green Living Directory - Sustainable Businesses",
    template: "%s | Green Living Directory",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthSessionProvider>
          <AuthProvider>
            <JsonLd id="org-schema" data={organizationSchema()} />
            <JsonLd id="website-schema" data={websiteSchema()} />
            {children}
          </AuthProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
