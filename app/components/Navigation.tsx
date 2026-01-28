"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export default function Navigation() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Hide navbar on auth pages
  if (pathname?.startsWith("/login") || pathname?.startsWith("/signup")) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!user) return null;

  const linkClasses = (active: boolean) =>
    `block px-3 py-2 rounded-md text-sm font-medium transition ${
      active
        ? "text-blue-600 bg-blue-50"
        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left */}
          <div className="flex items-center space-x-6">
            <Link href="/courses" className="text-xl font-semibold text-gray-900">
              LMS
            </Link>

            <div className="hidden md:flex space-x-2">
              <Link
                href="/courses"
                className={linkClasses(
                  pathname === "/courses" || pathname?.startsWith("/courses/")
                )}
              >
                Courses
              </Link>

              <Link
                href="/dashboard"
                className={linkClasses(pathname === "/dashboard")}
              >
                Dashboard
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:block text-sm text-gray-600">
              {user.email}
            </span>

            <button
              onClick={handleLogout}
              className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Logout
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-2">
          <Link
            href="/courses"
            onClick={() => setMenuOpen(false)}
            className={linkClasses(
              pathname === "/courses" || pathname?.startsWith("/courses/")
            )}
          >
            Courses
          </Link>

          <Link
            href="/dashboard"
            onClick={() => setMenuOpen(false)}
            className={linkClasses(pathname === "/dashboard")}
          >
            Dashboard
          </Link>

          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
