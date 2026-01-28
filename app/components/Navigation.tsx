"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthProvider";
import { useRouter, usePathname } from "next/navigation";

export default function Navigation() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Don't show navigation on auth pages
  if (pathname?.startsWith("/login") || pathname?.startsWith("/signup")) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/courses" className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition">
              LMS
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link
                href="/courses"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  pathname === "/courses" || pathname?.startsWith("/courses/")
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                Courses
              </Link>
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  pathname === "/dashboard"
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                Dashboard
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
