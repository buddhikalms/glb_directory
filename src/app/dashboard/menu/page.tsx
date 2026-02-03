"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { getMenuItemsByBusinessId } from "@/data/mockData";

export default function MenuPage() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    name: "",
    description: "",
    price: "",
    dietary: "",
  });

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};
  const isAuthenticated =
    typeof window !== "undefined"
      ? localStorage.getItem("isAuthenticated") === "true"
      : false;

  useEffect(() => {
    if (!isAuthenticated || user.role !== "business_owner") {
      router.push("/login");
    }

    if (user.businessId) {
      const items = getMenuItemsByBusinessId(user.businessId);
      setMenuItems(items);
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem = {
      id: `menu-${Date.now()}`,
      businessId: user.businessId,
      ...formData,
      price: parseFloat(formData.price),
      dietary: formData.dietary ? [formData.dietary] : [],
    };
    setMenuItems((prev) => [...prev, newItem]);
    setFormData({
      category: "",
      name: "",
      description: "",
      price: "",
      dietary: "",
    });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">
                Menu Manager
              </h1>
              <p className="text-gray-600">Create and manage your menu items</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary"
            >
              {showForm ? "✕ Cancel" : "+ Add Item"}
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-2xl p-8 shadow-md mb-8">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
                Add Menu Item
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      placeholder="e.g., Appetizers"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Item Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Hummus Plate"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe this menu item"
                    rows={2}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price (£)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="8.50"
                      step="0.01"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Dietary Info
                    </label>
                    <input
                      type="text"
                      name="dietary"
                      value={formData.dietary}
                      onChange={handleChange}
                      placeholder="e.g., Vegan"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full btn-primary">
                  Add Item
                </button>
              </form>
            </div>
          )}

          {menuItems.length > 0 ? (
            <div className="space-y-4">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-6 shadow-md flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-display font-bold text-lg text-gray-900">
                        {item.name}
                      </h3>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      {item.description}
                    </p>
                    {item.dietary.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Dietary: {item.dietary.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-emerald-600 font-bold text-xl">
                      £{item.price.toFixed(2)}
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-4 py-2 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center">
              <p className="text-gray-600 text-lg mb-4">
                No menu items yet. Create your first one!
              </p>
              <button onClick={() => setShowForm(true)} className="btn-primary">
                + Add Item
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
