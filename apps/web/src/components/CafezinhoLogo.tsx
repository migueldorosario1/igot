/**
 * Logo do Cafezinho Media Group.
 *
 * Xícara de café estilizada em SVG vetorial (escalável, nítida em qualquer
 * DPI). Usa `currentColor` pra herdar a cor do texto — funciona em light/dark.
 *
 * Modo "vazada" (padrão): só o contorno, sutil, como marca d'água.
 * Modo "cheia": preenchido, pra usar em cabeçalhos com destaque.
 *
 * Inspirado na arte oficial do Cafezinho Media Group (Niterói, RJ).
 */
export function CafezinhoLogo({
  size = 24,
  filled = false,
  opacity = 1,
  title = "Cafezinho Media Group",
}: {
  size?: number;
  filled?: boolean;
  opacity?: number;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      style={{ opacity, display: "block" }}
    >
      <title>{title}</title>
      {/* Vapor: três linhas onduladas acima da xícara */}
      <path
        d="M24 10c-1.5 2-1.5 4 0 6M32 8c-1.5 2-1.5 4 0 6M40 10c-1.5 2-1.5 4 0 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      {/* Corpo da xícara (caneca) — traço arredondado */}
      <path
        d="M16 22h28v18a14 14 0 0 1-28 0V22z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Asa (ala) da xícara */}
      <path
        d="M44 26h4a6 6 0 0 1 0 12h-4"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Pires sob a xícara */}
      <path
        d="M12 58h36"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
