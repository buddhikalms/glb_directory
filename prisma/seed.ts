import { PrismaClient, UserRole, BusinessStatus, BillingPeriod, PostStatus } from "@prisma/client";
import {
  users,
  categories,
  badges,
  pricingPackages,
  businesses,
  products,
  menuItems,
  services,
  reviews,
  authors,
  newsPosts,
} from "../src/data/mockData";

const prisma = new PrismaClient();

async function main() {
  await prisma.businessBadge.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.service.deleteMany();
  await prisma.newsPost.deleteMany();
  await prisma.authorProfile.deleteMany();
  await prisma.business.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.category.deleteMany();
  await prisma.pricingPackage.deleteMany();
  await prisma.user.deleteMany();

  await prisma.category.createMany({
    data: categories.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      icon: item.icon,
      description: item.description,
      color: item.color,
    })),
  });

  await prisma.badge.createMany({
    data: badges.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      icon: item.icon,
      color: item.color,
    })),
  });

  await prisma.pricingPackage.createMany({
    data: pricingPackages.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      billingPeriod: item.billingPeriod as BillingPeriod,
      description: item.description,
      features: item.features,
      featured: item.featured,
      active: item.active,
    })),
  });

  await prisma.user.createMany({
    data: users.map((item) => ({
      id: item.id,
      email: item.email,
      name: item.name,
      role: item.role as UserRole,
      slug: item.slug || null,
      avatar: item.avatar || null,
      bio: item.bio || null,
      location: item.location || null,
      title: item.title || null,
      businessId: null,
    })),
  });

  await prisma.business.createMany({
    data: businesses.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      tagline: item.tagline,
      description: item.description,
      categoryId: item.categoryId,
      logo: item.logo,
      coverImage: item.coverImage,
      likes: item.likes,
      location: item.location,
      contact: item.contact,
      social: item.social,
      sustainability: item.sustainability,
      status: item.status as BusinessStatus,
      featured: item.featured,
      views: item.views,
      createdAt: new Date(item.createdAt),
      ownerId: item.ownerId,
    })),
  });

  for (const item of users) {
    if (item.businessId) {
      await prisma.user.update({
        where: { id: item.id },
        data: { businessId: item.businessId },
      });
    }
  }

  const businessBadges = businesses.flatMap((item) =>
    item.badges.map((badgeId) => ({
      businessId: item.id,
      badgeId,
    })),
  );
  if (businessBadges.length) {
    await prisma.businessBadge.createMany({ data: businessBadges });
  }

  await prisma.product.createMany({
    data: products.map((item) => ({
      id: item.id,
      businessId: item.businessId,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      inStock: item.inStock,
    })),
  });

  await prisma.menuItem.createMany({
    data: menuItems.map((item) => ({
      id: item.id,
      businessId: item.businessId,
      category: item.category,
      name: item.name,
      description: item.description,
      price: item.price,
      dietary: item.dietary,
    })),
  });

  await prisma.service.createMany({
    data: services.map((item) => ({
      id: item.id,
      businessId: item.businessId,
      name: item.name,
      description: item.description,
      pricing: item.pricing,
    })),
  });

  await prisma.review.createMany({
    data: reviews.map((item) => ({
      id: item.id,
      businessId: item.businessId,
      authorName: item.authorName,
      rating: item.rating,
      comment: item.comment,
      createdAt: new Date(item.createdAt),
      flagged: false,
    })),
  });

  await prisma.authorProfile.createMany({
    data: authors.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      title: item.title,
      bio: item.bio,
      avatar: item.avatar,
      location: item.location || null,
      links: item.links || {},
    })),
  });

  const authorBySlug = new Map(authors.map((item) => [item.slug, item.id]));

  await prisma.newsPost.createMany({
    data: newsPosts.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      category: item.category,
      authorSlug: item.authorSlug,
      excerpt: item.excerpt,
      content: item.content,
      coverImage: item.coverImage,
      author: item.author,
      publishedAt: new Date(item.publishedAt),
      readTime: item.readTime,
      tags: item.tags,
      featured: Boolean(item.featured),
      seoTitle: null,
      seoDescription: null,
      seoKeywords: null,
      status: "published" as PostStatus,
      authorId: authorBySlug.get(item.authorSlug) || authors[0].id,
    })),
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
