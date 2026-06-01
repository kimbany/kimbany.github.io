import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Taste OS — the air you keep returning to";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Cinematic social card — generated, no hype. Warm darkness, a faint sigil,
 * a single quiet line. (Latin text keeps it font-robust; the Korean voice
 * lives inside the experience.)
 */
export default function OpenGraphImage() {
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
          background: "#0E0C0B",
          position: "relative",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* ambient warmth */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(620px 460px at 42% 40%, rgba(176,118,114,0.30), transparent 70%), radial-gradient(560px 460px at 70% 76%, rgba(217,166,108,0.20), transparent 72%)",
          }}
        />
        {/* sigil */}
        <div style={{ display: "flex", position: "absolute", top: 72, left: 80, color: "rgba(154,142,129,0.6)" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <path d="M12 3.5 A 8.5 8.5 0 1 0 20.4 11.2" />
          </svg>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 14,
            textTransform: "uppercase",
            color: "rgba(154,142,129,0.7)",
            marginBottom: 28,
          }}
        >
          Taste OS
        </div>
        <div
          style={{
            display: "flex",
            fontStyle: "italic",
            fontSize: 64,
            lineHeight: 1.25,
            color: "#D8C7AC",
            textAlign: "center",
            maxWidth: 880,
            padding: "0 60px",
          }}
        >
          the air you keep returning to
        </div>
        <div
          style={{
            display: "flex",
            fontStyle: "italic",
            fontSize: 26,
            color: "rgba(154,142,129,0.75)",
            marginTop: 30,
          }}
        >
          a quiet emotional atmosphere
        </div>
      </div>
    ),
    size
  );
}
