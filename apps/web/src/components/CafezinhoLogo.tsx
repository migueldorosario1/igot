/**
 * Logo do Cafezinho Media Group.
 *
 * Usa a IMAGEM REAL da logo (cafezinho-logo.jpg) — uma xícara de café
 * minimalista preto e branco, com um rosto sorridente integrado no corpo.
 *
 * A imagem é carregada de /cafezinho-logo.jpg (pasta public/).
 * O parâmetro `opacity` controla o quão "vazada" ela aparece (marca d'água).
 *
 * O filtro CSS adapta a logo ao tema:
 *  - Light mode: mix-blend-mode multiply (branco fica transparente)
 *  - Dark mode: brightness(0) invert(1) + screen blend (preto vira branco)
 */
export function CafezinhoLogo({
  size = 24,
  opacity = 1,
  title = "Cafezinho Media Group",
}: {
  size?: number;
  opacity?: number;
  title?: string;
}) {
  return (
    <>
      <img
        src="/cafezinho-logo.jpg"
        width={size}
        height={size}
        alt={title}
        role="img"
        aria-label={title}
        className="cafezinho-logo-img"
        style={{
          opacity,
          display: "block",
          width: size,
          height: size,
          objectFit: "contain",
          borderRadius: 4,
        }}
        draggable={false}
      />
      <style jsx>{`
        .cafezinho-logo-img {
          /* Light mode: branco vira transparente (multiply). */
          mix-blend-mode: multiply;
        }
        @media (prefers-color-scheme: dark) {
          .cafezinho-logo-img {
            /* Dark mode: inverte (preto→branco) e usa screen pra transparentar o fundo. */
            mix-blend-mode: screen;
            filter: brightness(0) invert(1);
          }
        }
      `}</style>
    </>
  );
}
