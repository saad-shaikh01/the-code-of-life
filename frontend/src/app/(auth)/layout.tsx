"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Ambient background effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <span className="text-xl font-bold text-white">☀</span>
          </div>
          <span className="font-bold text-xl text-gradient-gold">Code of Life</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Code of Life. All rights reserved.</p>
      </footer>
    </div>
  );
}
