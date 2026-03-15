"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Swords,
  Calendar,
  Trophy,
  Star,
  ChevronRight,
} from "lucide-react";
import { LandingAuthActions } from "@/components/layout/landing-auth-actions";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: BookOpen,
    title: "Story Mode",
    description:
      "Journey through chapters of wisdom, unlocking lessons one puzzle at a time",
    color: "violet",
    href: "/story",
  },
  {
    icon: Swords,
    title: "Challenge Mode",
    description: "Test your skills with increasingly difficult puzzles",
    color: "rose",
    href: "/challenge",
  },
  {
    icon: Calendar,
    title: "Daily Puzzles",
    description: "A fresh challenge every day to keep your mind sharp",
    color: "cyan",
    href: "/daily",
  },
  {
    icon: Trophy,
    title: "Leaderboards",
    description: "Compete with players worldwide and climb the ranks",
    color: "amber",
    href: "/leaderboards",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Background effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/30 via-transparent to-transparent pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <span className="text-xl font-bold text-white">☀</span>
          </div>
          <span className="font-bold text-xl text-gradient-gold">
            Code of Life
          </span>
        </div>
        <LandingAuthActions />
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Floating symbols */}
          <div className="flex justify-center gap-4 mb-8">
            {["☀", "☽", "★", "◆", "✦"].map((symbol, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
                className={cn(
                  "text-4xl md:text-5xl animate-float",
                  "symbol-gold",
                )}
                style={{ animationDelay: `${i * 0.5}s` }}
              >
                {symbol}
              </motion.span>
            ))}
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="text-foreground">Decode Symbols.</span>
            <br />
            <span className="text-gradient-gold">Unlock Wisdom.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Embark on a mystical journey through ancient symbols and hidden
            messages. Each puzzle reveals a timeless truth about life, love, and
            the human spirit.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <LandingAuthActions
              mode="single"
              buttonSize="lg"
              loggedOutLabel="Start Your Journey"
            />
            <Link href="/daily">
              <Button variant="secondary" size="lg">
                Try Today&apos;s Puzzle
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Demo Puzzle Preview */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <Card variant="elevated" glow="gold" className="p-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              DECODE THIS MESSAGE
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-4xl md:text-6xl font-mono mb-6">
              {["☀", "★", "◆", " ", "☽", "✦", "☀", " ", "★", "◆", "☽"].map(
                (char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, type: "spring" }}
                    className={
                      char === " " ? "w-4" : "symbol-gold animate-glow-pulse"
                    }
                  >
                    {char}
                  </motion.span>
                ),
              )}
            </div>
            <p className="text-muted-foreground">
              Can you decipher the hidden message?
            </p>
          </Card>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Multiple Ways to Play
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose your path to wisdom with different game modes designed for
            every type of player
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} variants={itemVariants}>
                <Link href={feature.href}>
                  <Card
                    variant="default"
                    className="group h-full cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "p-3 rounded-xl",
                          feature.color === "violet" &&
                            "bg-violet-500/20 text-violet-400",
                          feature.color === "rose" &&
                            "bg-rose-500/20 text-rose-400",
                          feature.color === "cyan" &&
                            "bg-cyan-500/20 text-cyan-400",
                          feature.color === "amber" &&
                            "bg-amber-500/20 text-amber-400",
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-amber-400 transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {feature.description}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { value: "10K+", label: "Puzzles Solved" },
            { value: "5K+", label: "Active Players" },
            { value: "100+", label: "Unique Puzzles" },
            { value: "4.9", label: "Star Rating", icon: Star },
          ].map((stat, i) => (
            <Card key={i} variant="glass" className="text-center py-6">
              <div className="flex items-center justify-center gap-1">
                <span className="text-3xl md:text-4xl font-bold text-gradient-gold">
                  {stat.value}
                </span>
                {stat.icon && (
                  <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </Card>
          ))}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <Card variant="elevated" glow="mystic" className="text-center py-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to Begin?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join thousands of players unlocking ancient wisdom through the art
              of decoding symbols
            </p>
            <LandingAuthActions
              mode="single"
              buttonSize="lg"
              loggedOutLabel="Create Free Account"
            />
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">☀</span>
            </div>
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Code of Life
            </span>
          </div>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link
              href="/about"
              className="hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
