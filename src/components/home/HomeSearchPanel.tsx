"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SearchCategory = {
  id: string;
  name: string;
  icon?: string | null;
};

type LocationSuggestion = {
  label: string;
  city: string;
  country: string;
  postcode: string;
};

interface HomeSearchPanelProps {
  categories: SearchCategory[];
}

export default function HomeSearchPanel({ categories }: HomeSearchPanelProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [locationInput, setLocationInput] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>(
    [],
  );
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    const query = locationInput.trim();
    if (query.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const response = await fetch(
          `/api/location-suggestions?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json().catch(() => [])) as
          | LocationSuggestion[]
          | { error?: string };

        if (!response.ok) {
          throw new Error(
            !Array.isArray(payload)
              ? payload.error || "Failed to load location suggestions."
              : "Failed to load location suggestions.",
          );
        }

        setLocationSuggestions(Array.isArray(payload) ? payload : []);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setLocationSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [locationInput]);

  const hasSuggestions = useMemo(
    () => locationSuggestions.length > 0,
    [locationSuggestions],
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();

    if (keyword.trim()) {
      params.set("q", keyword.trim());
    }

    if (categoryId !== "all") {
      params.set("category", categoryId);
    }

    const locationValue = (selectedLocation || locationInput).trim();
    if (locationValue) {
      params.set("location", locationValue);
    }

    const query = params.toString();
    router.push(query ? `/directory?${query}` : "/directory");
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-emerald-100 bg-white/95 p-4 shadow-xl backdrop-blur md:p-5"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.3fr_1fr_1fr_auto]">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Keywords: vegan, refill, solar..."
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-700 focus:border-emerald-500 focus:outline-none"
        />

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-700 focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon ? `${category.icon} ` : ""}
              {category.name}
            </option>
          ))}
        </select>

        <div className="relative">
          <input
            type="text"
            value={locationInput}
            onChange={(e) => {
              setLocationInput(e.target.value);
              setSelectedLocation("");
            }}
            placeholder="Location"
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-700 focus:border-emerald-500 focus:outline-none"
          />
          {loadingSuggestions && (
            <p className="pointer-events-none absolute right-3 top-3 text-xs text-gray-500">
              Searching...
            </p>
          )}
          {hasSuggestions && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-60 overflow-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
              {locationSuggestions.map((item, index) => (
                <button
                  key={`${item.label}-${index}`}
                  type="button"
                  onClick={() => {
                    const resolved = item.city || item.label;
                    setSelectedLocation(resolved);
                    setLocationInput(item.label);
                    setLocationSuggestions([]);
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-emerald-50"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          Search
        </button>
      </div>
    </form>
  );
}

