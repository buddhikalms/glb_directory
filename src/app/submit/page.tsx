"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { categories, getActivePricingPackages } from "@/data/mockData";

export default function SubmitPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const pricingPackages = getActivePricingPackages();
  const [formData, setFormData] = useState({
    businessName: "",
    tagline: "",
    description: "",
    categoryId: "",
    location: "",
    email: "",
    phone: "",
    website: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      router.push("/");
    }, 2000);
  };

  if (submitted) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="text-6xl mb-4">✓</div>
            <h1 className="font-display text-3xl font-bold text-gray-900 mb-4">
              Thank You!
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Your business submission has been received. Our team will review
              it and get back to you soon.
            </p>
            <Link href="/" className="btn-primary">
              Return to Home
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-stone-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="mb-8">
              <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">
                List Your Business
              </h1>
              <p className="text-gray-600 text-lg">
                Join our directory and reach eco-conscious customers
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex gap-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-2 flex-1 rounded-full transition-all ${
                      s <= step ? "bg-emerald-600" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">Step {step} of 3</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <>
                  <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
                    Choose Your Plan
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {pricingPackages.map((pkg) => (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg.id)}
                        className={`relative rounded-xl p-6 cursor-pointer border-2 transition-all ${
                          selectedPackage === pkg.id
                            ? "border-emerald-600 bg-emerald-50"
                            : "border-gray-200 bg-white hover:border-emerald-300"
                        }`}
                      >
                        {pkg.featured && (
                          <div className="absolute -top-3 right-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            Popular
                          </div>
                        )}
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">
                          {pkg.name}
                        </h3>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-emerald-600">
                            £{pkg.price}
                          </span>
                          <span className="text-gray-600 text-sm">/month</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          {pkg.description}
                        </p>
                        <ul className="space-y-2 mb-4">
                          {pkg.features.map((feature, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-gray-700 flex items-start"
                            >
                              <span className="text-emerald-600 mr-2">✓</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <div
                          className={`p-3 rounded-lg text-center font-semibold ${
                            selectedPackage === pkg.id
                              ? "bg-emerald-600 text-white"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {selectedPackage === pkg.id ? "Selected" : "Choose"}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!selectedPackage}
                    className={`w-full btn-primary ${
                      !selectedPackage ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    Continue to Add Listing
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
                    Add Your Listing
                  </h2>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      placeholder="Enter your business name"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tagline *
                    </label>
                    <input
                      type="text"
                      name="tagline"
                      value={formData.tagline}
                      onChange={handleChange}
                      placeholder="Short description of your business"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Tell us about your business and its sustainability efforts"
                      rows={5}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Your business location"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="contact@yourbusiness.com"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+44 (0) 1234 567890"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://yourbusiness.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 px-6 py-3 border-2 border-emerald-600 text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex-1 btn-primary"
                    >
                      Next Step
                    </button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
                    Review & Submit
                  </h2>

                  <div className="bg-emerald-50 rounded-lg p-6 mb-6 border border-emerald-200">
                    <h3 className="font-semibold text-emerald-900 mb-4">
                      Selected Plan
                    </h3>
                    {pricingPackages
                      .filter((p) => p.id === selectedPackage)
                      .map((pkg) => (
                        <div key={pkg.id}>
                          <p className="text-lg font-bold text-emerald-900 mb-2">
                            {pkg.name} - £{pkg.price}/month
                          </p>
                          <p className="text-emerald-700">{pkg.description}</p>
                        </div>
                      ))}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Business Details
                    </h3>
                    <div className="space-y-3 text-sm">
                      <p>
                        <strong>Name:</strong> {formData.businessName}
                      </p>
                      <p>
                        <strong>Tagline:</strong> {formData.tagline}
                      </p>
                      <p>
                        <strong>Email:</strong> {formData.email}
                      </p>
                      <p>
                        <strong>Phone:</strong> {formData.phone}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-6">
                    By submitting, you agree to our Terms of Service and confirm
                    that your business is eco-friendly and meets our
                    sustainability standards.
                  </p>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 px-6 py-3 border-2 border-emerald-600 text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
                    >
                      Back
                    </button>
                    <button type="submit" className="flex-1 btn-primary">
                      Submit Business
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
