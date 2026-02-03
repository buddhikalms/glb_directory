# 🌿 Green Business Directory Platform

A full-featured sustainability business directory built with Next.js 14, TypeScript, and Tailwind CSS. This platform enables eco-conscious businesses to create listings and showcase their products, services, and sustainability commitments.

## ✨ Features

### Public Website
- **Home Page** - Hero section, featured businesses, categories, and call-to-action
- **Directory Listing** - Browse all businesses with filters and search
- **Business Profile Pages** - Detailed business information, products, menu, services
- **Category Pages** - Browse businesses by category
- **About Page** - Information about the directory
- **Submit Business Page** - CTA for new business listings

### Authentication System
- Mock authentication with role-based access (Admin, Business Owner)
- Protected routes for dashboard and admin areas
- Login/logout functionality

### Business Owner Dashboard (`/dashboard`)
- **Dashboard Home** - Profile stats and quick overview
- **Business Profile Management** - Edit business information, logo, cover image
- **Products Management** - Add, edit, delete products
- **Menu Management** - Create menu categories and items
- **Services Management** - Manage service offerings
- **Media Manager** - Upload and manage business images

### Admin Panel (`/admin`)
- **Admin Dashboard** - Overview of directory statistics
- **Business Management** - Approve/reject/edit all business listings
- **Category Management** - Add, edit, delete categories
- **Badge Management** - Manage sustainability certifications
- **Content Management** - Edit homepage and featured content

## 🎨 Design System

### Color Palette
- **Primary**: Emerald/Leaf Green (#16a34a, #10b981)
- **Secondary**: Sage (#5c6f5c)
- **Accents**: Soft beige (#f5f5f0)
- **Background**: Stone-50

### Typography
- **Display Font**: Outfit (headings)
- **Body Font**: Nunito (paragraphs)

### UI Philosophy
- Warm, organic, nature-inspired design
- Rounded corners and soft shadows
- Smooth transitions and hover effects
- Green color palette throughout
- Eco-friendly visual language

## 📁 Project Structure

```
green-directory/
├── src/
│   ├── app/
│   │   ├── (pages)/
│   │   │   ├── page.tsx (Home)
│   │   │   ├── directory/
│   │   │   ├── business/[slug]/
│   │   │   ├── category/[slug]/
│   │   │   ├── about/
│   │   │   ├── login/
│   │   │   └── submit/
│   │   ├── dashboard/ (Business Owner)
│   │   │   ├── page.tsx
│   │   │   ├── business/
│   │   │   ├── products/
│   │   │   ├── menu/
│   │   │   ├── services/
│   │   │   └── media/
│   │   ├── admin/ (Admin Panel)
│   │   │   ├── page.tsx
│   │   │   ├── businesses/
│   │   │   ├── categories/
│   │   │   ├── badges/
│   │   │   └── content/
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── public/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   ├── ui/
│   │   │   └── Components.tsx (All reusable components)
│   │   ├── dashboard/
│   │   │   └── DashboardSidebar.tsx
│   │   └── admin/
│   │       └── AdminSidebar.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   └── data/
│       └── mockData.ts (All mock data and types)
├── public/
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Install dependencies**
```bash
npm install
# or
yarn install
```

2. **Run the development server**
```bash
npm run dev
# or
yarn dev
```

3. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

### Mock Login Credentials

The platform uses mock authentication. Here are the test accounts:

**Admin Account:**
- Email: `admin@greenlivingblog.org.uk`
- Password: any password (mock auth)

**Business Owner Accounts:**
- Email: `owner@greenleafcafe.co.uk` (Green Leaf Cafe)
- Email: `owner@earthandthread.co.uk` (Earth & Thread)
- Email: `owner@pureglowwellness.co.uk` (Pure Glow Wellness)
- Password: any password (mock auth)

## 📝 Key Components

### Public Components
- **BusinessCard** - Display business preview cards
- **CategoryCard** - Category tiles with icons
- **ProductCard** - Product display cards
- **MenuItemCard** - Menu item display
- **ServiceCard** - Service offering cards
- **BadgeTag** - Sustainability certification badges
- **SearchBar** - Main search functionality

### Dashboard Components
- **DashboardSidebar** - Navigation for business owners
- **AdminSidebar** - Navigation for administrators
- **FormInput** - Reusable form input field
- **FormTextarea** - Reusable textarea
- **FormSelect** - Reusable select dropdown
- **StatsCard** - Dashboard statistics display

## 🔧 Customization

### Adding New Businesses
Edit `src/data/mockData.ts` and add entries to the `businesses` array:

```typescript
{
  id: '4',
  name: 'Your Business',
  slug: 'your-business',
  tagline: 'Your tagline',
  // ... other fields
}
```

### Adding New Categories
Add to the `categories` array in `mockData.ts`:

```typescript
{
  id: '7',
  name: 'New Category',
  slug: 'new-category',
  icon: '🎨',
  description: 'Description',
  color: 'emerald'
}
```

### Adding New Badges
Add to the `badges` array:

```typescript
{
  id: '7',
  name: 'New Badge',
  slug: 'new-badge',
  icon: '✨',
  color: 'emerald'
}
```

### Styling Customization
- **Colors**: Edit `tailwind.config.js` to modify the color palette
- **Fonts**: Change Google Fonts import in `src/app/globals.css`
- **Layout**: Modify component styles in respective files

## 🌟 Features to Implement (Production)

This is a prototype. For production, you'll need to:

1. **Backend Integration**
   - Replace mock data with real API calls
   - Implement proper authentication (JWT, OAuth, etc.)
   - Add database (PostgreSQL, MongoDB, etc.)
   - File upload system for images

2. **Additional Features**
   - User registration system
   - Email verification
   - Password reset functionality
   - Review and rating system
   - Messaging between customers and businesses
   - Advanced search with filters
   - Map integration (Google Maps, Mapbox)
   - Analytics dashboard
   - Payment integration for premium listings

3. **SEO & Performance**
   - Server-side rendering optimization
   - Image optimization
   - Meta tags for all pages
   - Sitemap generation
   - Structured data markup

4. **Security**
   - Input validation
   - CSRF protection
   - Rate limiting
   - SQL injection prevention
   - XSS protection

## 📱 Responsive Design

The platform is fully responsive with breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🔐 Authentication Flow

1. User navigates to `/login`
2. Enters email (any password accepted in mock mode)
3. System checks email against `users` array
4. Creates session and stores in localStorage
5. Redirects based on role:
   - Admin → `/admin`
   - Business Owner → `/dashboard`

## 📄 Page Routes

### Public Routes
- `/` - Home page
- `/directory` - Business listings
- `/business/[slug]` - Business profile
- `/category/[slug]` - Category page
- `/about` - About the directory
- `/submit` - Submit business form
- `/login` - Login page

### Protected Routes (Business Owner)
- `/dashboard` - Dashboard home
- `/dashboard/business` - Edit business profile
- `/dashboard/products` - Manage products
- `/dashboard/menu` - Manage menu
- `/dashboard/services` - Manage services
- `/dashboard/media` - Media manager

### Protected Routes (Admin)
- `/admin` - Admin dashboard
- `/admin/businesses` - Manage all businesses
- `/admin/categories` - Manage categories
- `/admin/badges` - Manage badges
- `/admin/content` - Content management

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Authentication**: Mock (ready for real implementation)
- **Data**: Mock JSON (ready for API integration)

## 🤝 Contributing

This is a demonstration project. Feel free to use it as a starting point for your own sustainable business directory.

## 📞 Support

For questions about implementation:
- Check Next.js documentation: https://nextjs.org/docs
- Check Tailwind CSS documentation: https://tailwindcss.com/docs

## 📝 License

This is a demonstration project for Green Living Blog.

---

**Built with 💚 for a sustainable future**
