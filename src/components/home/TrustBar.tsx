/**
 * The three phrases are verbatim from the packaging and flyers. They are not
 * marketing copy to be rewritten — treat them as fixed.
 */
const PHRASES = ["Fresh Ingredients", "Freshly Made", "Made With Love"] as const;

/** Repeated so the track fills a wide desktop viewport before it loops. */
const RUNS = 4;

function Run() {
  return (
    <div className="flex shrink-0 items-center">
      {Array.from({ length: RUNS }).flatMap((_, run) =>
        PHRASES.map((phrase) => (
          <span key={`${run}-${phrase}`} className="flex items-center">
            <span className="px-6 font-sans text-[0.6875rem] tracking-label whitespace-nowrap text-gold uppercase sm:px-9 sm:text-xs">
              {phrase}
            </span>
            <span className="h-3 w-px shrink-0 bg-gold-deep/60" />
          </span>
        )),
      )}
    </div>
  );
}

export function TrustBar() {
  return (
    <section
      aria-label="What goes into every bottle"
      className="relative border-y border-ink-line bg-ink-raised py-4 sm:py-5"
    >
      {/* Said once for assistive tech; the visual track repeats itself. */}
      <p className="sr-only">
        Fresh ingredients. Freshly made. Made with love.
      </p>

      <div
        aria-hidden="true"
        className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]"
      >
        {/* The duplicate track is what makes the loop seamless: the animation
            translates exactly -50%, so run two lands where run one started.
            Reduced motion parks it, and the mask keeps the ends soft. */}
        <div className="animate-marquee flex w-max motion-reduce:animate-none">
          <Run />
          <Run />
        </div>
      </div>
    </section>
  );
}

export default TrustBar;
