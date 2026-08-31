import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-primary/10 bg-surface2/40">
      <div className="max-w-7xl mx-auto px-5 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 grid place-items-center">
              <span className="w-2 h-2 rounded-full bg-primary" />
            </span>
            <span className="font-heading font-bold text-white">DRISHTI</span>
          </div>
          <p className="text-sm text-foreground/60 leading-relaxed">
            Trust-gated diabetic retinopathy screening for rural India. AI that
            knows when to trust itself.
          </p>
        </div>

        <div className="text-sm text-foreground/60">
          <p className="font-medium text-foreground mb-3">Project</p>
          <p>Smart India Hackathon 2026 · PS 26038 · MathWorks</p>
          <p className="mt-2">
            Team Neural Minds — finalist product demo for the SIH finale.
          </p>
        </div>

        <div className="text-sm text-foreground/60">
          <p className="font-medium text-foreground mb-3">Links</p>
          <div className="flex flex-col gap-2">
            <Link href="https://github.com" className="hover:text-primary transition-colors">
              GitHub
            </Link>
            <Link href="/validation" className="hover:text-primary transition-colors">
              Validation & Evidence
            </Link>
            <Link href="/about" className="hover:text-primary transition-colors">
              About the project
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-primary/10">
        <div className="max-w-7xl mx-auto px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-foreground/40">
          <p>© 2026 DRISHTI · Team Neural Minds</p>
          <p>
            Screened on 550 held-out APTOS images — validated, not certified.
            Data: APTOS 2019, Aravind Eye Hospital.
          </p>
        </div>
      </div>
    </footer>
  );
}
