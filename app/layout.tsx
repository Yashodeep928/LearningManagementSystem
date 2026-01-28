// app/layout.tsx
import { AuthProvider } from "../app/context/AuthProvider";
import Navigation from "./components/Navigation";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          <Navigation />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
