import { Isotype } from "./isotype";

/**
 * Marca del panel: isotipo "db" + wordmark "Daniel Brosed" con el subtítulo
 * del centro. Se usa en el sidebar y en el login (antes había un escudo SVG
 * duplicado en ambos sitios). Wordmark en Bricolage Grotesque (var --font-display).
 */
export function Brand({
  size = 30,
  subtitle = "Centro de Operaciones",
  animated = false,
}: {
  size?: number;
  subtitle?: string;
  animated?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Isotype size={size} animated={animated} />
      <div className="leading-tight">
        <p
          className="text-sm text-fg"
          style={{ fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "-0.01em" }}
        >
          Daniel Brosed
        </p>
        <p className="db-kicker text-[10px] text-anthracite-400">{subtitle}</p>
      </div>
    </div>
  );
}
