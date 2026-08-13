export function BrandTexture({ opacity = 0.05, invert = false }: { opacity?: number; invert?: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${invert ? "brightness-0 invert" : ""}`}
      style={{
        opacity,
        backgroundImage: "url('/brand/pattern-tile.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "72px 72px",
      }}
      aria-hidden
    />
  );
}
