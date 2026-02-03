import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import { BusinessCard, CategoryCard, SearchBar } from '@/components/ui/Components';
import { businesses, categories } from '@/data/mockData';

export default function Home() {
  const featuredBusinesses = businesses.filter(b => b.featured && b.status === 'approved');

  return (
    <>
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative min-h-[600px] flex items-center justify-center leaf-pattern">
          <div className="absolute inset-0 organic-gradient opacity-90"></div>
          <div className="relative z-10 max-w-4xl mx-auto text-center px-4 py-20">
            <div className="inline-block mb-6 animate-float">
              <div className="text-7xl">🌿</div>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-gray-900 mb-6 animate-fade-in">
              Discover Sustainable Businesses Near You
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-10 animate-fade-in">
              Support local eco-conscious businesses making a positive impact on our planet
            </p>
            <div className="max-w-2xl mx-auto mb-8 animate-slide-up">
              <SearchBar />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Link href="/directory" className="btn-primary">
                Browse Directory
              </Link>
              <Link href="/submit" className="btn-secondary">
                List Your Business
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Businesses */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">
                Featured Green Businesses
              </h2>
              <p className="text-lg text-gray-600">
                Discover businesses leading the way in sustainability
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredBusinesses.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link href="/directory" className="btn-primary">
                View All Businesses
              </Link>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-20 px-4 bg-stone-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">
                Explore by Category
              </h2>
              <p className="text-lg text-gray-600">
                Find sustainable businesses in your area of interest
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">
                Why Use Our Directory?
              </h2>
              <p className="text-lg text-gray-600">
                Making sustainable choices easier for everyone
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                  🌱
                </div>
                <h3 className="font-display text-xl font-bold mb-3">Verified Sustainable</h3>
                <p className="text-gray-600">
                  Every business is verified for their sustainability practices and certifications.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                  🤝
                </div>
                <h3 className="font-display text-xl font-bold mb-3">Support Local</h3>
                <p className="text-gray-600">
                  Connect with local businesses committed to ethical and sustainable practices.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                  🌍
                </div>
                <h3 className="font-display text-xl font-bold mb-3">Make an Impact</h3>
                <p className="text-gray-600">
                  Your choices matter. Support businesses creating positive environmental change.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 organic-gradient">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Is Your Business Sustainable?
            </h2>
            <p className="text-xl text-gray-700 mb-8">
              Join our directory and connect with eco-conscious customers in your community
            </p>
            <Link href="/submit" className="btn-primary inline-flex items-center gap-2">
              List Your Business Free
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
