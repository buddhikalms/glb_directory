'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <Image
              src="/greenliving-blog.png"
              alt="Green Living Blog logo"
              width={160}
              height={40}
              className="h-10 w-auto"
              priority
            />
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
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu((prev) => !prev)}
                    className="text-gray-700 hover:text-emerald-600 transition-colors font-medium"
                  >
                    {user?.name || 'Account'}
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200 bg-white shadow-xl p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-600 break-all">{user?.email}</p>
                      <p className="mt-2 inline-block rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                        {user?.role?.replace('_', ' ')}
                      </p>
                      <div className="mt-3 border-t border-gray-100 pt-3">
                        <button
                          onClick={() => logout()}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 text-left"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-emerald-700">Signed in as</p>
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-600 break-all">{user?.email}</p>
                  <p className="mt-2 inline-block rounded-full bg-white px-2 py-1 text-xs font-semibold text-emerald-700">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>
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

