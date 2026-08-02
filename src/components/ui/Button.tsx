import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  MouseEvent,
  ReactNode,
} from "react";

/**
 * The only button in the system. Two components rather than one polymorphic
 * one, so a link is genuinely an <a> and a button is genuinely a <button> —
 * no aria patching, no fake roles.
 *
 * Shape note: 2px corners everywhere. The brand is spirits packaging, not a
 * SaaS dashboard, so nothing is pill-shaped.
 *
 * What a press feels like is most of the character here. Hover slides the
 * foil highlight across the fill over 900ms, like light moving over metal;
 * the pointer drags a specular hotspot with it; and the press itself answers
 * in 90ms and relaxes over 560ms. All of that is in `.btn-motion` and
 * `.spec` in globals.css — see the note there about why the transition is
 * not expressed as Tailwind utilities.
 *
 * This module has no "use client" on purpose. Buttons appear in server-
 * rendered pages all over the site and hydrating every one of them to chase
 * a highlight would be a poor trade, so the pointer tracking is delegated to
 * a single document-level listener in InteractionLayer instead.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

/* `isolate` matters: the specular highlight is a ::after, and without a
   stacking context on the button its z-index:-1 would drop it behind the
   button's own fill instead of sitting between the fill and the label. */
const BASE =
  "group/btn relative isolate inline-flex items-center justify-center gap-2.5 " +
  "rounded-[2px] btn-motion " +
  "font-sans font-medium uppercase leading-none whitespace-nowrap select-none " +
  "disabled:pointer-events-none disabled:opacity-40 " +
  "aria-disabled:cursor-progress";

const VARIANTS: Record<ButtonVariant, string> = {
  /* Foil fill. The gradient is twice as wide as the button so hovering slides
     the highlight across it like light moving over metal. */
  primary:
    "text-ink border border-transparent spec " +
    "bg-[linear-gradient(105deg,#b8892a_0%,#e9c86a_22%,#f7e6ae_38%,#d4a63c_58%,#a97c1e_78%,#e2bd5c_100%)] " +
    "bg-[length:220%_100%] bg-[position:12%_0] " +
    "hover:bg-[position:88%_0] hover:shadow-gold",
  secondary:
    "text-gold border border-gold-deep/70 bg-transparent spec spec-gold " +
    "hover:border-gold hover:bg-gold/[0.07] hover:text-gold-bright " +
    "active:bg-gold/[0.14]",
  ghost:
    "text-cream-dim border border-transparent bg-transparent " +
    "hover:text-gold-bright active:bg-gold/[0.06]",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[0.6875rem]",
  md: "h-11 px-6 text-xs",
  lg: "h-12 px-7 text-xs sm:h-14 sm:px-9 sm:text-[0.8125rem]",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: ButtonStyleProps = {}): string {
  return [
    BASE,
    VARIANTS[variant],
    SIZES[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Wide letter-spacing pushes the last glyph off-centre; the matching indent
 * puts the optical centre back where the box centre is.
 */
function Label({ children }: { children: ReactNode }) {
  return (
    <span className="tracking-[0.18em] [text-indent:0.18em]">{children}</span>
  );
}

/**
 * Pending indicator. `data-spinner` is the one thing globals.css lets keep
 * moving under prefers-reduced-motion — see the note there.
 */
function Spinner() {
  return (
    <svg
      data-spinner
      viewBox="0 0 16 16"
      className="-ml-1 h-3.5 w-3.5 shrink-0 animate-spin"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="8"
        cy="8"
        r="6.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        opacity="0.28"
      />
      <path
        d="M8 1.75A6.25 6.25 0 0 1 14.25 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export interface PendingProps {
  /** Shows a spinner, blocks activation, and announces the busy state. */
  pending?: boolean;
  /** Optional replacement label while pending, e.g. "Taking you to Stripe". */
  pendingLabel?: ReactNode;
}

/** Swallows activation while a control is busy. Module level so that a
 *  non-pending button passes the caller's handler straight through and stays
 *  renderable from a server component. */
function swallow(event: MouseEvent<Element>): void {
  event.preventDefault();
  event.stopPropagation();
}

export function Button({
  variant,
  size,
  fullWidth,
  className,
  children,
  type = "button",
  pending = false,
  pendingLabel,
  onClick,
  ...rest
}: ButtonStyleProps &
  PendingProps &
  ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      /* aria-disabled rather than disabled: a button that is disabled while
         it has focus drops the focus on the floor and returns the keyboard
         user to the top of the document. This keeps the focus and simply
         refuses to fire. */
      aria-disabled={pending || undefined}
      aria-busy={pending || undefined}
      data-pending={pending ? "" : undefined}
      onClick={pending ? swallow : onClick}
      {...rest}
    >
      {pending && <Spinner />}
      <Label>{pending && pendingLabel ? pendingLabel : children}</Label>
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  children,
  href,
  pending = false,
  pendingLabel,
  ...rest
}: ButtonStyleProps &
  PendingProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  }) {
  const cls = buttonClasses({ variant, size, fullWidth, className });
  const external = /^(https?:|mailto:|tel:)/.test(href);

  /* Only a pending link gets a handler — see `swallow`. Without that guard
     this component could no longer be rendered from a server component. */
  const shared = {
    className: cls,
    "aria-disabled": pending || undefined,
    "aria-busy": pending || undefined,
    "data-pending": pending ? "" : undefined,
    ...(pending ? { onClick: swallow } : null),
  };

  const content = (
    <>
      {pending && <Spinner />}
      <Label>{pending && pendingLabel ? pendingLabel : children}</Label>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...shared}
        {...rest}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} {...shared} {...rest}>
      {content}
    </Link>
  );
}

export default Button;
