'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  const isActive = (path: string) => pathname === path;
  
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-6">
      <div className="mb-8">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">🌿</span>
          </div>
          <div className="font-display text-lg font-bold text-gray-900">
            Green Directory
          </div>
        </Link>
      </div>
      
      <div className="mb-6 pb-6 border-b border-gray-200">
        <p className="text-sm text-gray-600 mb-1">Logged in as</p>
        <p className="font-semibold text-gray-900">{user?.name}</p>
      </div>
      
      <nav className="space-y-1">
        <Link 
          href="/dashboard" 
          className={isActive('/dashboard') ? 'sidebar-link-active' : 'sidebar-link'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          Dashboard
        </Link>
        
        <Link 
          href="/dashboard/business" 
          className={isActive('/dashboard/business') ? 'sidebar-link-active' : 'sidebar-link'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
          My Businesses
        </Link>
        
        <Link 
          href="/dashboard/products" 
          className={isActive('/dashboard/products') ? 'sidebar-link-active' : 'sidebar-link'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
          Products
        </Link>
        
        <Link 
          href="/dashboard/menu" 
          className={isActive('/dashboard/menu') ? 'sidebar-link-active' : 'sidebar-link'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
          Menu
        </Link>
        
        <Link 
          href="/dashboard/services" 
          className={isActive('/dashboard/services') ? 'sidebar-link-active' : 'sidebar-link'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          Services
        </Link>
        
        <Link 
          href="/dashboard/media" 
          className={isActive('/dashboard/media') ? 'sidebar-link-active' : 'sidebar-link'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          Media
        </Link>

        <Link
          href="/dashboard/billing"
          className={isActive('/dashboard/billing') ? 'sidebar-link-active' : 'sidebar-link'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a5 5 0 00-10 0v2m-2 0h14a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V10a1 1 0 011-1zm5 5h.01M12 16h.01" />
          </svg>
          Billing
        </Link>
      </nav>
      
      <div className="mt-8 pt-6 border-t border-gray-200">
        <Link href="/" className="sidebar-link">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          View Public Site
        </Link>
        
        <button onClick={logout} className="sidebar-link w-full text-left">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
