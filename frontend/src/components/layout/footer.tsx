"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo and tagline */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <span className="text-sm font-bold text-white">☀</span>
              </div>
              <span className="font-semibold text-foreground">Code of Life</span>
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-left">
              Decode symbols, unlock wisdom
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm text-muted-foreground",
                  "hover:text-foreground transition-colors"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-400 fill-red-400" />
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
