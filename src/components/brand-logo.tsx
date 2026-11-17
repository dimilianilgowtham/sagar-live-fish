import Image from "next/image";

/** Banner-inspired artwork keeps the shop's illustrated lettering intact. */
export default function BrandLogo({
  className = "",
  preload = false,
  sizes = "(max-width: 380px) 148px, (max-width: 760px) 180px, (max-width: 960px) 210px, 240px",
  variant = "full",
}: {
  className?: string;
  preload?: boolean;
  sizes?: string;
  variant?: "full" | "crest" | "wordmark";
}) {
  return (
    <span className={`brand-artwork brand-artwork--${variant} ${className}`.trim()}>
      <Image
        className="brand-artwork-image"
        src="/images/sagar-logo.png"
        alt={
          variant === "crest"
            ? "Sagar Live Fish crowned shield logo"
            : variant === "wordmark"
              ? "Sagar Live Fish"
              : "Sagar Live Fish — crowned fish crest and blue and red lettering"
        }
        width={2172}
        height={724}
        sizes={sizes}
        preload={preload}
      />
    </span>
  );
}
