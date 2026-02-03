# Implementation Guide

## Quick Start Checklist

✅ Project structure created
✅ All components built
✅ Mock data configured
✅ Authentication system ready
✅ Responsive design implemented

## What's Included

### Complete Components (Ready to Use)
- ✅ Navbar with authentication
- ✅ Footer with links
- ✅ BusinessCard component
- ✅ ProductCard component
- ✅ MenuItemCard component
- ✅ ServiceCard component
- ✅ CategoryCard component
- ✅ BadgeTag component
- ✅ SearchBar component
- ✅ Form components (Input, Textarea, Select)
- ✅ StatsCard component
- ✅ DashboardSidebar
- ✅ AdminSidebar

### Pages to Complete

You have the foundation. Here's what to add:

#### Public Pages (Priority: High)
1. **Directory Listing** (`/directory/page.tsx`)
   - Grid/List view toggle
   - Filter sidebar (category, location, badges)
   - Search functionality
   - Pagination

2. **Business Profile** (`/business/[slug]/page.tsx`)
   - Business header with cover + logo
   - About section
   - Tabs for Products/Menu/Services
   - Contact info + map
   - Reviews section (UI only)

3. **Category Page** (`/category/[slug]/page.tsx`)
   - Category header
   - Filtered business list
   - Category description

4. **About Page** (`/about/page.tsx`)
   - Mission and vision
   - How it works
   - Contact information

5. **Submit Page** (`/submit/page.tsx`)
   - Business submission form
   - Multi-step form
   - Preview before submit

6. **Login Page** (`/login/page.tsx`)
   - Email input
   - Mock password field
   - Login button
   - Role-based redirect

#### Dashboard Pages (Priority: Medium)
1. **Dashboard Home** (`/dashboard/page.tsx`)
   - Stats cards
   - Profile completeness
   - Quick actions

2. **Business Profile Editor** (`/dashboard/business/page.tsx`)
   - Edit all business fields
   - Upload logo/cover (mock)
   - Save button

3. **Products Manager** (`/dashboard/products/page.tsx`)
   - List all products
   - Add/Edit/Delete products
   - Product form modal

4. **Menu Manager** (`/dashboard/menu/page.tsx`)
   - Menu categories
   - Add/Edit menu items
   - Organize by category

5. **Services Manager** (`/dashboard/services/page.tsx`)
   - List services
   - Add/Edit/Delete services

6. **Media Manager** (`/dashboard/media/page.tsx`)
   - Image upload UI (mock)
   - Image gallery
   - Image selection

#### Admin Pages (Priority: Low)
1. **Admin Dashboard** (`/admin/page.tsx`)
   - Total businesses stats
   - Pending approvals
   - Recent activity

2. **Businesses Manager** (`/admin/businesses/page.tsx`)
   - Table of all businesses
   - Approve/Reject buttons
   - Edit/Delete actions

3. **Categories Manager** (`/admin/categories/page.tsx`)
   - List categories
   - Add/Edit/Delete categories

4. **Badges Manager** (`/admin/badges/page.tsx`)
   - List badges
   - Add/Edit/Delete badges

5. **Content Manager** (`/admin/content/page.tsx`)
   - Edit homepage hero
   - Featured businesses selection

## Page Template

Use this template for new pages:

```typescript
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';

export default function YourPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Your content */}
      </main>
      <Footer />
    </>
  );
}
```

## Dashboard Page Template

```typescript
'use client';

import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { isAuthenticated, isBusinessOwner } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !isBusinessOwner) {
      router.push('/login');
    }
  }, [isAuthenticated, isBusinessOwner, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        {/* Your dashboard content */}
      </main>
    </div>
  );
}
```

## Admin Page Template

```typescript
'use client';

import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.push('/login');
    }
  }, [isAuthenticated, isAdmin, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-8 bg-gray-50">
        {/* Your admin content */}
      </main>
    </div>
  );
}
```

## Using Mock Data

```typescript
import { 
  businesses, 
  categories, 
  badges,
  getBusinessBySlug,
  getProductsByBusinessId 
} from '@/data/mockData';

// Example: Get business by slug
const business = getBusinessBySlug('green-leaf-cafe');

// Example: Get products for a business
const products = getProductsByBusinessId('1');
```

## Adding Filters

```typescript
'use client';

import { useState } from 'react';
import { businesses } from '@/data/mockData';

export default function Directory() {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBusinesses = businesses
    .filter(b => b.status === 'approved')
    .filter(b => categoryFilter === 'all' || b.categoryId === categoryFilter)
    .filter(b => 
      searchQuery === '' || 
      b.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    // Your component JSX
  );
}
```

## Next Steps

1. Start with the Login page (`/login`)
2. Build Dashboard Home (`/dashboard`)
3. Complete Business Profile page (`/business/[slug]`)
4. Add Directory Listing (`/directory`)
5. Build remaining dashboard pages
6. Add admin pages last

## Tips

- Use the existing components from `Components.tsx`
- Follow the color palette (emerald/green)
- Keep the organic, nature-inspired design
- Use the mock data helpers
- Test with different user roles
- Mobile-first responsive design

## Need Help?

- Check existing components for patterns
- Review mockData.ts for data structure
- Use the template pages above
- Follow Tailwind CSS docs for styling
- Test authentication flows thoroughly

Good luck! 🌿
