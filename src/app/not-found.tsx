import Link from "next/link";
import { BottleMark } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <section className="bg-grain mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 py-24 text-center">
      <BottleMark className="h-16 w-auto text-gold-deep" />
      <p className="numeric mt-8 font-display text-6xl text-foil">404</p>
      <h1 className="mt-4 font-display text-2xl tracking-wide text-cream sm:text-3xl">
        This one&apos;s sold out
      </h1>
      <p className="mt-4 max-w-md text-cream-dim">
        The page you were after isn&apos;t here. The juice, however, very much
        is.
      </p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/menu"
          className="bg-gold px-7 py-3 text-[0.68rem] font-semibold uppercase tracking-label text-ink transition-colors hover:bg-gold-bright"
        >
          See the Menu
        </Link>
        <Link
          href="/"
          className="border border-gold-dim/60 px-7 py-3 text-[0.68rem] font-semibold uppercase tracking-label text-gold transition-colors hover:border-gold hover:bg-gold/10"
        >
          Back Home
        </Link>
      </div>
    </section>
  );
}
