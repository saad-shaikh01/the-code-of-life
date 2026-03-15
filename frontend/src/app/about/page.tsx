import Link from "next/link";

const legalLinks = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-foreground">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent pointer-events-none" />

      <header className="relative z-10 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-sm font-bold text-white">CL</span>
            </div>
            <div>
              <p className="font-bold text-xl text-gradient-gold">
                The Code of Life
              </p>
              <p className="text-sm text-muted-foreground">
                Decode symbols, unlock wisdom
              </p>
            </div>
          </Link>

          <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80 mb-4">
            About
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            A puzzle journey built around hidden meaning
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            The Code of Life is a symbolic puzzle game inspired by a cipher
            system from a book. Players decode reflections, unlock story
            chapters, return for daily puzzles, and compete in real-time battle
            matches against other players.
          </p>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-2xl font-semibold mb-3">What the game offers</h2>
            <p className="text-muted-foreground leading-7">
              Story Mode follows a guided path through progressively deeper
              puzzles. Daily Puzzles provide a fresh decode each day. Battle
              Mode turns the same cipher mechanics into a head-to-head race.
              Together, those modes turn a simple decoding mechanic into a full
              play loop built around reflection, mastery, and replayability.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-2xl font-semibold mb-3">How the experience works</h2>
            <p className="text-muted-foreground leading-7">
              Each puzzle presents an encrypted pattern that must be translated
              back into readable text. As you complete puzzles, the game tracks
              progress, scores, streaks, achievements, and subscription-based
              access to premium modes. The goal is not just speed, but learning
              the structure behind the cipher and improving over time.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-2xl font-semibold mb-3">Contact</h2>
            <p className="text-muted-foreground leading-7">
              Questions about the product, partnerships, or legal policies can
              be sent to{" "}
              <a
                href="mailto:hello@thecodeoflife.com"
                className="text-amber-300 hover:text-amber-200 transition-colors"
              >
                hello@thecodeoflife.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
          <p>Last updated March 15, 2026.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
