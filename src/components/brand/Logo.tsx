/**
 * The Juice Cartel bottle mark, redrawn as vector so it stays crisp at any
 * size and can be recoloured. Matches the gold line-art bottle used on the
 * bottle labels and flyers.
 */
export function BottleMark({
  className = "",
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 88"
      fill="none"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {/* cap */}
      <rect
        x="22" y="3" width="20" height="9" rx="2.5"
        fill="currentColor"
      />
      {/* neck */}
      <path
        d="M26 12h12v6H26z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* body outline */}
      <path
        d="M26 18c0 3.5-11 7.5-11 14v45a6 6 0 0 0 6 6h22a6 6 0 0 0 6-6V32c0-6.5-11-10.5-11-14"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* juice line */}
      <path
        d="M16.5 41c4.5 0 6.5-2.6 11-2.6s6.5 2.6 11 2.6 6.5-2.6 9-2.6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* droplet */}
      <path
        d="M32 52c0 0-7 7.2-7 11.6a7 7 0 0 0 14 0C39 59.2 32 52 32 52Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Full lockup: mark over wordmark, as it appears on the packaging. */
export function LogoLockup({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const scale = {
    sm: { mark: "h-7", word: "text-base", sub: "text-[0.6rem]" },
    md: { mark: "h-12", word: "text-2xl", sub: "text-[0.7rem]" },
    lg: { mark: "h-20", word: "text-4xl sm:text-5xl", sub: "text-xs" },
  }[size];

  return (
    <span
      className={`inline-flex flex-col items-center gap-2 text-gold ${className}`}
    >
      <BottleMark className={`${scale.mark} w-auto`} />
      <span className="flex flex-col items-center leading-[0.95]">
        <span
          className={`font-display font-medium tracking-[0.14em] text-foil ${scale.word}`}
        >
          JUICE
        </span>
        <span
          className={`font-display font-medium tracking-[0.2em] text-foil ${scale.word}`}
        >
          CARTEL
        </span>
      </span>
    </span>
  );
}

/** Horizontal lockup for the header, where vertical space is tight. */
export function LogoInline({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-gold ${className}`}>
      <BottleMark className="h-8 w-auto" title="Juice Cartel" />
      <span className="flex flex-col leading-[0.88]">
        <span className="font-display text-lg font-medium tracking-[0.13em] text-foil">
          JUICE
        </span>
        <span className="font-display text-lg font-medium tracking-[0.19em] text-foil">
          CARTEL
        </span>
      </span>
    </span>
  );
}
