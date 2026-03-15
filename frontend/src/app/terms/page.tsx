import Link from "next/link";

const legalLinks = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export default function TermsPage() {
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
                Terms of Service
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
            Terms
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            These terms govern your access to The Code of Life, including
            account creation, use of gameplay features, and any subscription
            purchased through Stripe.
          </p>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-2xl font-semibold mb-3">Accounts and eligibility</h2>
            <p className="text-muted-foreground leading-7">
              You are responsible for maintaining the security of your account
              credentials and for all activity that occurs under your account.
              By using the service, you confirm that you are legally able to
              enter into these terms or have the consent of a parent or guardian
              if required by your local law.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-2xl font-semibold mb-3">Acceptable use</h2>
            <p className="text-muted-foreground leading-7">
              You may not use the game to harass other players, cheat, exploit
              bugs, reverse engineer paid features, attack the service, or
              violate any law. We may suspend or terminate accounts that abuse
              multiplayer systems, payment flows, or community features.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-2xl font-semibold mb-3">Subscriptions and billing</h2>
            <p className="text-muted-foreground leading-7">
              Paid subscriptions may be offered on monthly or annual billing
              cycles through Stripe. By subscribing, you authorize recurring
              billing for the selected plan until cancellation. You can cancel
              at any time, and access continues through the end of the active
              billing period unless otherwise stated at checkout.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-2xl font-semibold mb-3">No warranty</h2>
            <p className="text-muted-foreground leading-7">
              The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis.
              We do not guarantee uninterrupted availability, error-free
              gameplay, or that every feature will always remain unchanged.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-2xl font-semibold mb-3">Limitation of liability</h2>
            <p className="text-muted-foreground leading-7">
              To the fullest extent allowed by law, The Code of Life and its
              operators are not liable for indirect, incidental, or
              consequential damages arising from your use of the service,
              including lost progress, lost access, or subscription disputes
              handled by third-party payment providers.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-2xl font-semibold mb-3">Contact</h2>
            <p className="text-muted-foreground leading-7">
              Questions about these terms can be sent to{" "}
              <a
                href="mailto:legal@thecodeoflife.com"
                className="text-amber-300 hover:text-amber-200 transition-colors"
              >
                legal@thecodeoflife.com
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
