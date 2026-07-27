import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

/**
 * The only button in the system. Two components rather than one polymorphic
 * one, so a link is genuinely an <a> and a button is genuinely a <button> —
 * no aria patching, no fake roles.
 *
 * Shape note: 2px corners everywhere. The brand is spirits packaging, not a
 * SaaS dashboard, so nothing is pill-shaped.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

const BASE =
  "group/btn relative inline-flex items-center justify-center gap-2.5 rounded-[2px] " +
  "font-sans font-medium uppercase leading-none whitespace-nowrap " +
  "transition-[background-position,background-color,border-color,color,box-shadow] " +
  "duration-500 ease-out select-none " +
  "disabled:pointer-events-none disabled:opacity-40";

const VARIANTS: Record<ButtonVariant, string> = {
  /* Foil fill. The gradient is twice as wide as the button so hovering slides
     the highlight across it like light moving over metal. */
  primary:
    "text-ink border border-transparent " +
    "bg-[linear-gradient(105deg,#b8892a_0%,#e9c86a_22%,#f7e6ae_38%,#d4a63c_58%,#a97c1e_78%,#e2bd5c_100%)] " +
    "bg-[length:220%_100%] bg-[position:12%_0] " +
    "hover:bg-[position:88%_0] hover:shadow-gold",
  secondary:
    "text-gold border border-gold-deep/70 bg-transparent " +
    "hover:border-gold hover:bg-gold/[0.07] hover:text-gold-bright",
  ghost:
    "text-cream-dim border border-transparent bg-transparent " +
    "hover:text-gold-bright",
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

export function Button({
  variant,
  size,
  fullWidth,
  className,
  children,
  type = "button",
  ...rest
}: ButtonStyleProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      <Label>{children}</Label>
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
  ...rest
}: ButtonStyleProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  }) {
  const cls = buttonClasses({ variant, size, fullWidth, className });
  const external = /^(https?:|mailto:|tel:)/.test(href);

  if (external) {
    return (
      <a
        href={href}
        className={cls}
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        <Label>{children}</Label>
      </a>
    );
  }

  return (
    <Link href={href} className={cls} {...rest}>
      <Label>{children}</Label>
    </Link>
  );
}

export default Button;
