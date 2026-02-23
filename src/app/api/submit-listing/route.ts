import { NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";

const productSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  price: z.number().finite().nonnegative(),
  image: z.string().trim().optional().default(""),
  inStock: z.boolean().optional().default(true),
});

const menuItemSchema = z.object({
  category: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  price: z.number().finite().nonnegative(),
  dietary: z.array(z.string().trim()).optional().default([]),
});

const serviceSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  pricing: z.string().trim().min(1),
});

const submitListingSchema = z.object({
  businessName: z.string().trim().min(1).max(160),
  slug: z.string().trim().optional().default(""),
  tagline: z.string().trim().min(1).max(191),
  description: z.string().trim().min(1),
  seoKeywords: z.string().trim().optional().default(""),
  categoryId: z.string().trim().min(1),
  country: z.string().trim().optional().default(""),
  city: z.string().trim().min(1),
  address: z.string().trim().optional().default(""),
  postcode: z.string().trim().optional().default(""),
  location: z.string().trim().optional().default(""), // backwards compatibility
  email: z.string().trim().email(),
  phone: z.string().trim().optional().default(""),
  website: z.string().trim().optional().default(""),
  logo: z.string().trim().optional().default(""),
  coverImage: z.string().trim().optional().default(""),
  gallery: z.array(z.string().trim()).optional().default([]),
  badgeIds: z.array(z.string().trim()).optional().default([]),
  products: z.array(productSchema).optional().default([]),
  menuItems: z.array(menuItemSchema).optional().default([]),
  services: z.array(serviceSchema).optional().default([]),
  selectedPackage: z.string().trim().optional().default(""),
  stripeSessionId: z.string().trim().optional().default(""),
  paymentMode: z.enum(["subscription", "one_time"]).optional().default("subscription"),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string) {
  const normalizedBase = base || "business";
  let attempt = normalizedBase;
  let count = 1;

  while (true) {
    const existing = await prisma.business.findUnique({
      where: { slug: attempt },
      select: { id: true },
    });
    if (!existing) return attempt;
    count += 1;
    attempt = `${normalizedBase}-${count}`;
  }
}

function isSlugUniqueConstraintError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  return error.code === "P2002";
}

function parseLegacyLocation(rawLocation: string) {
  const raw = rawLocation.trim();
  if (!raw) {
    return { country: "", city: "", address: "", postcode: "" };
  }

  const parts = raw.split(",").map((item) => item.trim()).filter(Boolean);
  return {
    country: "",
    city: parts[0] || raw,
    address: raw,
    postcode: parts[1] || "",
  };
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = submitListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid listing payload.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const baseSlug = slugify(parsed.data.businessName);
    const slug = await uniqueSlug(
      slugify(parsed.data.slug) || baseSlug,
    );
    const legacyLocation = parseLegacyLocation(parsed.data.location);
    const location = {
      country: parsed.data.country || legacyLocation.country,
      city: parsed.data.city || legacyLocation.city,
      address: parsed.data.address || legacyLocation.address,
      postcode: parsed.data.postcode || legacyLocation.postcode,
    };
    const selectedPackageId = parsed.data.selectedPackage || "";

    if (selectedPackageId) {
      const pricingPackage = await prisma.pricingPackage.findUnique({
        where: { id: selectedPackageId },
        select: { id: true, active: true, price: true },
      });

      if (!pricingPackage || !pricingPackage.active) {
        return NextResponse.json(
          { error: "Invalid pricing package." },
          { status: 400 },
        );
      }

      if (pricingPackage.price > 0) {
        if (!parsed.data.stripeSessionId) {
          return NextResponse.json(
            { error: "Missing Stripe checkout session." },
            { status: 402 },
          );
        }

        const stripe = getStripeClient();
        const checkoutSession = await stripe.checkout.sessions.retrieve(
          parsed.data.stripeSessionId,
        );

        const paymentOwnerMatches =
          checkoutSession.metadata?.userId === session.user.id;
        const packageMatches =
          checkoutSession.metadata?.selectedPackage === selectedPackageId;
        const checkoutCompleted = checkoutSession.status === "complete";
        const expectedMode =
          parsed.data.paymentMode === "one_time" ? "payment" : "subscription";
        const paymentModeMatches =
          (checkoutSession.metadata?.paymentMode || "subscription") ===
          parsed.data.paymentMode;
        const checkoutModeMatches = checkoutSession.mode === expectedMode;

        if (
          !paymentOwnerMatches ||
          !packageMatches ||
          !checkoutCompleted ||
          !paymentModeMatches ||
          !checkoutModeMatches
        ) {
          return NextResponse.json(
            { error: "Payment verification failed." },
            { status: 402 },
          );
        }
      }
    }

    const createListing = async (slugToUse: string) =>
      prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: parsed.data.businessName,
          slug: slugToUse,
          tagline: parsed.data.tagline,
          description: parsed.data.description,
          seoKeywords: parsed.data.seoKeywords || null,
          categoryId: parsed.data.categoryId,
          pricingPackageId: selectedPackageId || null,
          logo: parsed.data.logo,
          coverImage: parsed.data.coverImage,
          gallery: parsed.data.gallery,
          likes: 0,
          location,
          contact: {
            email: parsed.data.email,
            phone: parsed.data.phone,
            website: parsed.data.website,
          },
          social: {},
          sustainability: [],
          status: "pending",
          featured: false,
          views: 0,
          ownerId: session.user.id,
        },
      });

      if (parsed.data.badgeIds.length > 0) {
        await tx.businessBadge.createMany({
          data: parsed.data.badgeIds.map((badgeId) => ({
            businessId: business.id,
            badgeId,
          })),
        });
      }

      if (parsed.data.products.length > 0) {
        await tx.product.createMany({
          data: parsed.data.products.map((item) => ({
            businessId: business.id,
            name: item.name,
            description: item.description,
            price: item.price,
            image: item.image,
            inStock: item.inStock,
          })),
        });
      }

      if (parsed.data.menuItems.length > 0) {
        await tx.menuItem.createMany({
          data: parsed.data.menuItems.map((item) => ({
            businessId: business.id,
            category: item.category,
            name: item.name,
            description: item.description,
            price: item.price,
            dietary: item.dietary,
          })),
        });
      }

      if (parsed.data.services.length > 0) {
        await tx.service.createMany({
          data: parsed.data.services.map((item) => ({
            businessId: business.id,
            name: item.name,
            description: item.description,
            pricing: item.pricing,
          })),
        });
      }

      const currentUser = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, businessId: true },
      });

      if (currentUser) {
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            role:
              currentUser.role === UserRole.guest
                ? UserRole.business_owner
                : currentUser.role,
            businessId: currentUser.businessId || business.id,
          },
        });
      }

      return business;
    });

    let created: Awaited<ReturnType<typeof createListing>> | null = null;
    let slugCandidate = slug;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        created = await createListing(slugCandidate);
        break;
      } catch (error) {
        if (!isSlugUniqueConstraintError(error)) {
          throw error;
        }

        // If a concurrent duplicate request already created this listing,
        // return that record instead of failing with 500.
        const existing = await prisma.business.findUnique({
          where: { slug: slugCandidate },
          select: { id: true, slug: true, ownerId: true },
        });

        if (existing?.ownerId === session.user.id) {
          return NextResponse.json(
            {
              ok: true,
              businessId: existing.id,
              slug: existing.slug,
              message: "Listing already submitted.",
            },
            { status: 200 },
          );
        }

        slugCandidate = await uniqueSlug(slug);
      }
    }

    if (!created) {
      return NextResponse.json(
        { error: "Could not reserve a unique slug. Please try again." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        businessId: created.id,
        slug: created.slug,
        message: "Listing submitted. Your account is now a business owner.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("submit_listing_error", error);
    return NextResponse.json(
      { error: "Failed to submit listing." },
      { status: 500 },
    );
  }
}
