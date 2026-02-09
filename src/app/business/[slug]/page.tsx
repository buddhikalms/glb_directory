"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import {
  ProductCard,
  MenuItemCard,
  ServiceCard,
} from "@/components/ui/Components";
import {
  getBusinessBySlug,
  getProductsByBusinessId,
  getMenuItemsByBusinessId,
  getServicesByBusinessId,
  getCategoryById,
  getBadgeById,
  getUserById,
  getReviewsByBusinessId,
  getAverageRatingByBusinessId,
} from "@/data/mockData";

export default function BusinessPage() {
  const params = useParams();
  const slug = params.slug as string;
  const business = getBusinessBySlug(slug);
  const [activeTab, setActiveTab] = useState<
    "about" | "products" | "menu" | "services"
  >("about");

  if (!business) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Business Not Found
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              The business you're looking for doesn't exist.
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

  const category = getCategoryById(business.categoryId);
  const products = getProductsByBusinessId(business.id);
  const menuItems = getMenuItemsByBusinessId(business.id);
  const services = getServicesByBusinessId(business.id);
  const owner = getUserById(business.ownerId);
  const initialReviews = getReviewsByBusinessId(business.id);
  const averageRating = getAverageRatingByBusinessId(business.id);
  const [likes, setLikes] = useState(business.likes);
  const [liked, setLiked] = useState(false);
  const [reviews, setReviews] = useState(initialReviews);
  const [flaggedReviewId, setFlaggedReviewId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({
    name: "",
    rating: "5",
    comment: "",
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-stone-50">
        {/* Cover Image */}
        <div className="relative h-96 overflow-hidden bg-gradient-to-b from-emerald-200 to-emerald-50">
          <img
            src={business.coverImage}
            alt={business.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Business Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end mb-6">
              <div className="relative -mt-32">
                <img
                  src={business.logo}
                  alt={business.name}
                  className="w-40 h-40 rounded-2xl border-4 border-white shadow-lg object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="font-display text-4xl font-bold text-gray-900">
                      {business.name}
                    </h1>
                    {category && (
                      <p className="text-lg text-emerald-600 font-semibold mt-1">
                        {category.icon} {category.name}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                      <span className="text-emerald-600">★</span>
                      <span>
                        {averageRating > 0
                          ? averageRating.toFixed(1)
                          : "New"}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span>{reviews.length} reviews</span>
                    </div>
                  </div>
                  {business.featured && (
                    <div className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Featured
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const nextLiked = !liked;
                      setLiked(nextLiked);
                      setLikes((prev) => (nextLiked ? prev + 1 : prev - 1));
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                      liked
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-emerald-400"
                    }`}
                  >
                    <span>{liked ? "❤️" : "🤍"}</span>
                    <span>{likes}</span>
                  </button>
                </div>
                <p className="text-xl text-gray-600 mb-4">{business.tagline}</p>
                {business.badges.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {business.badges.map((badgeId) => {
                      const badge = getBadgeById(badgeId);
                      return badge ? (
                        <div
                          key={badgeId}
                          className={`px-3 py-1 rounded-full text-sm font-semibold text-white bg-emerald-600`}
                        >
                          {badge.icon} {badge.name}
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {business.contact.phone && (
                <a
                  href={`tel:${business.contact.phone}`}
                  className="flex items-center text-gray-700 hover:text-emerald-600"
                >
                  <span className="mr-2 text-xl">📞</span>
                  <span>{business.contact.phone}</span>
                </a>
              )}
              {business.contact.email && (
                <a
                  href={`mailto:${business.contact.email}`}
                  className="flex items-center text-gray-700 hover:text-emerald-600"
                >
                  <span className="mr-2 text-xl">📧</span>
                  <span>{business.contact.email}</span>
                </a>
              )}
              {business.location.city && (
                <div className="flex items-center text-gray-700">
                  <span className="mr-2 text-xl">📍</span>
                  <span>
                    {business.location.city}, {business.location.postcode}
                  </span>
                </div>
              )}
              {business.contact.website && (
                <a
                  href={business.contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-700 hover:text-emerald-600"
                >
                  <span className="mr-2 text-xl">🌐</span>
                  <span>Visit Website</span>
                </a>
              )}
              {owner?.slug && (
                <Link
                  href={`/owners/${owner.slug}`}
                  className="flex items-center text-gray-700 hover:text-emerald-600"
                >
                  <span className="mr-2 text-xl">ðŸ‘¤</span>
                  <span>Meet the owner</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex gap-8">
              {["about", "products", "menu", "services"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-4 px-2 font-semibold border-b-2 transition-all ${
                    activeTab === tab
                      ? "text-emerald-600 border-emerald-600"
                      : "text-gray-600 border-transparent hover:text-emerald-600"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          {activeTab === "about" && (
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
                About This Business
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {business.description}
              </p>

              {owner && owner.slug && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm">
                      <img
                        src={
                          owner.avatar ||
                          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400"
                        }
                        alt={owner.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-emerald-700 font-semibold">
                        Listing Owner
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-900">
                          {owner.name}
                        </h3>
                        {owner.title && (
                          <span className="text-sm text-gray-600">
                            • {owner.title}
                          </span>
                        )}
                      </div>
                      {owner.bio && (
                        <p className="text-sm text-gray-700 mt-2">
                          {owner.bio}
                        </p>
                      )}
                      <Link
                        href={`/owners/${owner.slug}`}
                        className="inline-flex items-center text-emerald-700 font-semibold text-sm mt-3"
                      >
                        View owner profile
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
                <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
                  Contact the Owner
                </h3>
                <p className="text-gray-600 mb-6">
                  Send a message to the listing owner. We’ll forward your
                  request to the business.
                </p>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="you@email.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Tell the owner how you’d like to connect..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none resize-none"
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                    <p className="text-sm text-gray-500">
                      By sending, you agree to our community guidelines.
                    </p>
                    <button
                      type="button"
                      className="btn-primary inline-flex items-center justify-center"
                    >
                      Send Message
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl font-bold text-gray-900">
                    Reviews
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-emerald-600">★</span>
                    <span>
                      {averageRating > 0
                        ? averageRating.toFixed(1)
                        : "New"}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span>{reviews.length} total</span>
                  </div>
                </div>

                <form
                  className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!reviewForm.name || !reviewForm.comment) return;
                    const newReview = {
                      id: `r-${Date.now()}`,
                      businessId: business.id,
                      authorName: reviewForm.name,
                      rating: Number(reviewForm.rating),
                      comment: reviewForm.comment,
                      createdAt: new Date().toISOString().slice(0, 10),
                    };
                    setReviews((prev) => [newReview, ...prev]);
                    setReviewForm({ name: "", rating: "5", comment: "" });
                  }}
                >
                  <h4 className="font-display text-lg font-bold text-gray-900 mb-3">
                    Leave a review
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={reviewForm.name}
                        onChange={(event) =>
                          setReviewForm((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                        placeholder="Alex Green"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Rating
                      </label>
                      <select
                        value={reviewForm.rating}
                        onChange={(event) =>
                          setReviewForm((prev) => ({
                            ...prev,
                            rating: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="5">5 - उत्कृष्ट</option>
                        <option value="4">4 - Very good</option>
                        <option value="3">3 - Good</option>
                        <option value="2">2 - Fair</option>
                        <option value="1">1 - Poor</option>
                      </select>
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <button
                        type="submit"
                        className="w-full btn-primary"
                      >
                        Submit Review
                      </button>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Comment
                      </label>
                      <textarea
                        rows={4}
                        value={reviewForm.comment}
                        onChange={(event) =>
                          setReviewForm((prev) => ({
                            ...prev,
                            comment: event.target.value,
                          }))
                        }
                        placeholder="Share your experience..."
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none resize-none"
                        required
                      />
                    </div>
                  </div>
                </form>

                {reviews.length === 0 ? (
                  <p className="text-gray-600">
                    No reviews yet. Be the first to share your experience.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border border-gray-100 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-gray-900">
                            {review.authorName}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>{review.createdAt}</span>
                            <button
                              type="button"
                              onClick={() => setFlaggedReviewId(review.id)}
                              className="text-emerald-700 font-semibold hover:text-emerald-800"
                            >
                              Flag
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                          <span className="text-emerald-600">★</span>
                          <span>{review.rating.toFixed(1)}</span>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                        {flaggedReviewId === review.id && (
                          <p className="text-sm text-emerald-600 mt-3">
                            Thanks for reporting. We’ll review this feedback.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {business.sustainability &&
                business.sustainability.length > 0 && (
                  <div>
                    <h3 className="font-display text-xl font-bold text-gray-900 mb-4">
                      Sustainability Features
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {business.sustainability.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-emerald-600 mr-3 mt-1">✓</span>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}

          {activeTab === "products" && (
            <div>
              {products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 text-center">
                  <p className="text-gray-600 text-lg">
                    No products available at this time.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "menu" && (
            <div>
              {menuItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {menuItems.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 text-center">
                  <p className="text-gray-600 text-lg">
                    No menu items available at this time.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "services" && (
            <div>
              {services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 text-center">
                  <p className="text-gray-600 text-lg">
                    No services available at this time.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
