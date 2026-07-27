import { ImageResponse } from "next/og";

/**
 * The link preview card.
 *
 * Nearly all traffic arrives from a link pasted into Snapchat, TikTok bio,
 * Instagram or WhatsApp, so this image is the first thing most customers
 * ever see of the business. It is generated at the edge so it never needs
 * a designer to update.
 */

export const alt = "Juice Cartel — Nottingham's No.1 Juice Spot";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse 90% 70% at 50% 0%, #241a08 0%, #080706 65%)",
          position: "relative",
        }}
      >
        {/* gold hairline frame */}
        <div
          style={{
            position: "absolute",
            inset: 28,
            border: "1px solid #6b5220",
            display: "flex",
          }}
        />

        {/* bottle mark */}
        <svg width="88" height="121" viewBox="0 0 64 88" fill="none">
          <rect x="22" y="3" width="20" height="9" rx="2.5" fill="#d4a63c" />
          <path d="M26 12h12v6H26z" fill="#d4a63c" />
          <path
            d="M26 18c0 3.5-11 7.5-11 14v45a6 6 0 0 0 6 6h22a6 6 0 0 0 6-6V32c0-6.5-11-10.5-11-14"
            stroke="#d4a63c"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path
            d="M16.5 41c4.5 0 6.5-2.6 11-2.6s6.5 2.6 11 2.6 6.5-2.6 9-2.6"
            stroke="#d4a63c"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M32 52s-7 7.2-7 11.6a7 7 0 0 0 14 0C39 59.2 32 52 32 52Z"
            fill="#d4a63c"
          />
        </svg>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 26,
            lineHeight: 1,
          }}
        >
          <div
            style={{
              fontSize: 76,
              letterSpacing: 14,
              color: "#e8c66a",
              fontWeight: 500,
            }}
          >
            JUICE
          </div>
          <div
            style={{
              fontSize: 76,
              letterSpacing: 20,
              color: "#e8c66a",
              fontWeight: 500,
              marginTop: 6,
            }}
          >
            CARTEL
          </div>
        </div>

        <div
          style={{
            width: 320,
            height: 1,
            background: "#6b5220",
            marginTop: 40,
            display: "flex",
          }}
        />

        <div
          style={{
            fontSize: 27,
            letterSpacing: 7,
            color: "#f7f1e4",
            marginTop: 34,
            display: "flex",
          }}
        >
          NOTTINGHAM&apos;S NO.1 JUICE SPOT
        </div>

        <div
          style={{
            fontSize: 20,
            letterSpacing: 4,
            color: "#b8ad99",
            marginTop: 20,
            display: "flex",
          }}
        >
          FRESHLY MADE · DELIVERED TO YOUR DOOR
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 58,
            fontSize: 19,
            letterSpacing: 6,
            color: "#8a6015",
            display: "flex",
          }}
        >
          JUICECARTEL.UK
        </div>
      </div>
    ),
    size,
  );
}
