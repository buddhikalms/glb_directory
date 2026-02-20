import type { Metadata } from "next";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import { absoluteUrl, createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "About",
  description:
    "Learn about Green Living Directory and our mission to support sustainable local businesses.",
  pathname: "/about",
});

export default function AboutPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Green Living Directory",
    description:
      "Green Living Directory helps communities discover verified sustainable businesses.",
    url: absoluteUrl("/about"),
  };

  return (
    <>
      <JsonLd id="about-page-schema" data={aboutSchema} />
      <Navbar />
      <main className="min-h-screen bg-stone-50">
        <section className="bg-white border-b border-gray-200 py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">
              About Green Living Directory
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              We help people find verified, eco-conscious businesses and make
              sustainable choices easier every day.
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
                Our Mission
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                The Green Living Directory is a curated list of businesses that
                prioritize sustainable practices. We verify submissions and
                highlight the environmental impact behind products and services
                so communities can support responsible local choices.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                From cafes and retailers to wellness studios and service
                providers, our goal is to connect people with businesses that
                care about people and planet.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="font-display text-xl font-bold text-gray-900 mb-4">
                What We Do
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li>Verify business sustainability claims</li>
                <li>Highlight certifications and impact</li>
                <li>Feature community-led initiatives</li>
                <li>Connect customers with local options</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto bg-white rounded-2xl p-8 shadow-sm text-center">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
              Want to be listed?
            </h2>
            <p className="text-gray-600 mb-6">
              Share your sustainable business with the community.
            </p>
            <Link href="/submit" className="btn-primary">
              List Your Business
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
