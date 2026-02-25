import { NextResponse } from "next/server";

type LocationSuggestion = {
  label: string;
  city: string;
  country: string;
  postcode: string;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();
    const countryCode = (searchParams.get("countryCode") || "").trim().toLowerCase();

    if (query.length < 2) {
      return NextResponse.json([] as LocationSuggestion[]);
    }

    const geoapifyApiKey =
      process.env.GEOAPIFY_API_KEY || process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || "";

    let suggestions: LocationSuggestion[] = [];

    if (geoapifyApiKey) {
      const params = new URLSearchParams({
        text: query,
        apiKey: geoapifyApiKey,
        limit: "6",
        format: "json",
      });

      if (countryCode) {
        params.set("filter", `countrycode:${countryCode}`);
      }

      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`,
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Geoapify autocomplete failed");
      }

      const payload = (await response.json()) as {
        results?: Array<Record<string, unknown>>;
      };

      suggestions = (payload.results || []).map((item) => ({
        label: asString(item.formatted) || asString(item.address_line1),
        city:
          asString(item.city) ||
          asString(item.town) ||
          asString(item.village) ||
          asString(item.county),
        country: asString(item.country),
        postcode: asString(item.postcode),
      }));
    } else {
      const params = new URLSearchParams({
        q: query,
        format: "jsonv2",
        addressdetails: "1",
        limit: "6",
      });

      if (countryCode) {
        params.set("countrycodes", countryCode);
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            "User-Agent": "green-directory/1.0",
          },
        },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Nominatim autocomplete failed");
      }

      const payload = (await response.json()) as Array<Record<string, unknown>>;
      suggestions = payload.map((item) => {
        const address =
          typeof item.address === "object" && item.address
            ? (item.address as Record<string, unknown>)
            : {};

        return {
          label: asString(item.display_name),
          city:
            asString(address.city) ||
            asString(address.town) ||
            asString(address.village) ||
            asString(address.county),
          country: asString(address.country),
          postcode: asString(address.postcode),
        };
      });
    }

    const deduped = Array.from(
      new Map(
        suggestions
          .filter((item) => item.label)
          .map((item) => [item.label.toLowerCase(), item] as const),
      ).values(),
    );

    return NextResponse.json(deduped);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch location suggestions",
      },
      { status: 500 },
    );
  }
}

