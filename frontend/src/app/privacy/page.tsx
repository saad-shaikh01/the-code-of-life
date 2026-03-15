import Link from "next/link";

const legalLinks = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export default function PrivacyPage() {
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
              <p className="text-sm text-muted-foreground">Privacy Policy</p>
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
            Privacy
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            This policy explains what information The Code of Life collects,
            how it is used to run the game, and how billing-related data is
            handled when subscriptions are purchased through Stripe.
          </p>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-2xl font-semibold mb-3">Information we collect</h2>
            <p className="text-muted-foreground leading-7">
              We collect the information needed to operate the game, including
              your email address, username, puzzle progress, achievements,
              streaks, subscription status, and related account settings. If
              you purchase a subscription, billing and payment details are
              processed by Stripe rather than stored directly by us.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-2xl font-semibold mb-3">How we use your data</h2>
            <p className="text-muted-foreground leading-7">
              We use your data to provide gameplay features, save your progress,
              show rankings and achievements, manage subscriptions, prevent
              abuse, and improve the reliability of the service. We do not sell
              personal data to third parties.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-2xl font-semibold mb-3">Payments and third parties</h2>
            <p className="text-muted-foreground leading-7">
              Subscription billing is handled by Stripe. Stripe may collect
              payment information such as card details, billing address, and
              transaction metadata in accordance with its own privacy policy.
              We use Stripe only to process billing and confirm subscription
              status inside the game.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-2xl font-semibold mb-3">Retention and deletion</h2>
            <p className="text-muted-foreground leading-7">
              Account and gameplay data are retained while your account remains
              active so the game can function correctly. If you delete your
              account through the app settings or contact us for a privacy
              request, we will remove or anonymize the relevant account data
              unless we must keep limited records for legal, billing, or fraud
              prevention reasons.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-2xl font-semibold mb-3">Contact</h2>
            <p className="text-muted-foreground leading-7">
              For privacy questions or data requests, contact{" "}
              <a
                href="mailto:privacy@thecodeoflife.com"
                className="text-amber-300 hover:text-amber-200 transition-colors"
              >
                privacy@thecodeoflife.com
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
