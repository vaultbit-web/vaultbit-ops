import type { CSSProperties } from "react";

/*
 * Isotipo "db" de Daniel Brosed, portado de danielbrosed.com (maqueta-v1).
 * Cuatro squircles de vidrio en diamante 2x2, iluminados por detrás por tres
 * luces (periwinkle #b3bcff / ember #fc8323 / cobalt #0856ff) sobre near-black.
 *
 * - static (default): luz congelada (periwinkle arriba, ember abajo).
 * - animated: las tres luces orbitan (keyframes orbA/B/C en globals.css).
 *   La clase `db-orb` permite desactivar el movimiento con prefers-reduced-motion.
 * - light: variante para superficies claras (vidrio de tinta, tinte suave).
 */
export function Isotype({
  size = 28,
  animated = false,
  light = false,
}: {
  size?: number;
  animated?: boolean;
  light?: boolean;
}) {
  const n = size;

  const tile = (key: string, rim: string, sheen: string) => (
    <span
      key={key}
      style={{
        borderRadius: "34%",
        padding: Math.max(1, n * 0.02),
        background: rim,
        display: "block",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      <span
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          borderRadius: "inherit",
          background: light
            ? "linear-gradient(160deg, rgba(21,23,28,0.10) 0%, rgba(21,23,28,0.04) 60%)"
            : sheen,
          backdropFilter: "blur(" + Math.max(3, n * 0.1) + "px) saturate(1.35)",
          WebkitBackdropFilter: "blur(" + Math.max(3, n * 0.1) + "px) saturate(1.35)",
        }}
      />
    </span>
  );

  const blob = (key: string, color: string, pos: CSSProperties, dur: string, nm: string) => {
    const st: CSSProperties = {
      position: "absolute",
      width: "72%",
      aspectRatio: "1",
      borderRadius: "50%",
      background: "radial-gradient(circle, " + color + " 0%, transparent 68%)",
      filter: "blur(" + Math.max(4, n * 0.16) + "px)",
      mixBlendMode: light ? "multiply" : "screen",
      opacity: light ? 0.22 : 1,
      ...pos,
    };
    if (animated) st.animation = nm + " " + dur + " ease-in-out infinite alternate";
    return <span key={key} className={animated ? "db-orb" : undefined} style={st} />;
  };

  const rimGlass = light ? "rgba(21,23,28,0.18)" : "rgba(255,255,255,0.14)";
  const rims = {
    tl: "linear-gradient(135deg, rgba(179,188,255,0.85), " + rimGlass + " 55%)",
    tr: "linear-gradient(225deg, rgba(179,188,255,0.55), " + rimGlass + " 55%)",
    bl: "linear-gradient(45deg, rgba(252,131,35,0.5), " + rimGlass + " 55%)",
    br: "linear-gradient(315deg, rgba(252,131,35,0.85), " + rimGlass + " 55%)",
  };
  const sheens = {
    tl: "linear-gradient(160deg, rgba(245,244,239,0.22) 0%, rgba(255,255,255,0.03) 62%)",
    tr: "linear-gradient(200deg, rgba(179,188,255,0.16) 0%, rgba(255,255,255,0.03) 62%)",
    bl: "linear-gradient(20deg, rgba(252,131,35,0.14) 0%, rgba(255,255,255,0.03) 62%)",
    br: "linear-gradient(340deg, rgba(252,131,35,0.20) 0%, rgba(255,255,255,0.03) 62%)",
  };

  return (
    <span
      aria-hidden
      style={{
        position: "relative",
        display: "block",
        width: n,
        height: n,
        flex: "none",
        filter: light
          ? "none"
          : "drop-shadow(0 0 " +
            Math.max(4, n * 0.18) +
            "px rgba(179,188,255,0.28)) drop-shadow(0 " +
            Math.max(2, n * 0.08) +
            "px " +
            Math.max(5, n * 0.22) +
            "px rgba(252,131,35,0.22))",
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: "-22%",
          display: "block",
          borderRadius: "50%",
          overflow: "hidden",
        }}
      >
        {blob("a", "#b3bcff", { top: "-14%", right: "-10%" }, "17s", "orbA")}
        {blob("b", "#fc8323", { bottom: "-14%", left: "-10%" }, "13s", "orbB")}
        {blob("c", "#0856ff", { top: "26%", left: "16%" }, "21s", "orbC")}
      </span>
      <span
        style={{
          position: "absolute",
          left: "13%",
          top: "13%",
          width: "74%",
          height: "74%",
          transform: "rotate(45deg)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: Math.max(1.5, n * 0.06),
        }}
      >
        {tile("tl", rims.tl, sheens.tl)}
        {tile("tr", rims.tr, sheens.tr)}
        {tile("bl", rims.bl, sheens.bl)}
        {tile("br", rims.br, sheens.br)}
      </span>
    </span>
  );
}
