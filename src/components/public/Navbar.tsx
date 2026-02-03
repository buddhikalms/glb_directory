'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">🌿</span>
            </div>
            <div>
              <div className="font-display text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                Green Living Directory
              </div>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/directory" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
              Browse Directory
            </Link>
            <Link href="/categories" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
              Categories
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
              About
            </Link>
            
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link href="/admin" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
                    Admin Panel
                  </Link>
                )}
                {user?.role === 'business_owner' && (
                  <Link href="/dashboard" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="text-gray-700 hover:text-emerald-600 transition-colors font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
                Login
              </Link>
            )}
            
            <Link 
              href="/submit" 
              className="bg-emerald-600 text-white px-6 py-2 rounded-full hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              List Your Business
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-emerald-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-emerald-100 bg-white">
          <div className="px-4 py-4 space-y-3">
            <Link 
              href="/directory" 
              className="block py-2 text-gray-700 hover:text-emerald-600 transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              Browse Directory
            </Link>
            <Link 
              href="/categories" 
              className="block py-2 text-gray-700 hover:text-emerald-600 transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              Categories
            </Link>
            <Link 
              href="/about" 
              className="block py-2 text-gray-700 hover:text-emerald-600 transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link 
                    href="/admin" 
                    className="block py-2 text-gray-700 hover:text-emerald-600 transition-colors font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                {user?.role === 'business_owner' && (
                  <Link 
                    href="/dashboard" 
                    className="block py-2 text-gray-700 hover:text-emerald-600 transition-colors font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left py-2 text-gray-700 hover:text-emerald-600 transition-colors font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                className="block py-2 text-gray-700 hover:text-emerald-600 transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
            )}
            
            <Link 
              href="/submit" 
              className="block w-full bg-emerald-600 text-white px-6 py-3 rounded-full hover:bg-emerald-700 transition-all text-center font-medium"
              onClick={() => setIsOpen(false)}
            >
              List Your Business
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
