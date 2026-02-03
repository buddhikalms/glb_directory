"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export default function MediaPage() {
  const router = useRouter();
  const [images, setImages] = useState<any[]>([]);

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
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newImage = {
            id: `img-${Date.now()}`,
            name: file.name,
            url: event.target?.result as string,
            uploadedAt: new Date().toLocaleDateString(),
          };
          setImages((prev) => [newImage, ...prev]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDelete = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">
              Media Manager
            </h1>
            <p className="text-gray-600">
              Upload and manage your business images
            </p>
          </div>

          {/* Upload Area */}
          <div className="bg-white rounded-2xl p-12 shadow-md mb-8 border-2 border-dashed border-emerald-200 text-center">
            <input
              type="file"
              id="file-upload"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="font-display font-semibold text-lg text-gray-900 mb-2">
                Upload Images
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop your images here or click to browse
              </p>
              <button className="btn-primary">Select Images</button>
            </label>
          </div>

          {/* Gallery */}
          {images.length > 0 ? (
            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
                Your Images ({images.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden group"
                  >
                    <div className="relative h-40 overflow-hidden bg-gray-100">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-600 truncate">
                        {image.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {image.uploadedAt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center">
              <p className="text-gray-600 text-lg">
                No images uploaded yet. Start by uploading your first image!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
