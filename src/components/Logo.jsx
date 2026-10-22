/**
 * Logo Fatec Mission: mira segmentada + bandeira + caminho (aproximação vetorial do símbolo).
 * variant: "icon" | "horizontal" | "stacked" · mono: versão monocromática creme.
 */
function arco(r, a1, a2) {
  const rad = (a) => ((a - 90) * Math.PI) / 180;
  const p = (a) => `${50 + r * Math.cos(rad(a))} ${50 + r * Math.sin(rad(a))}`;
  return `M${p(a1)}A${r} ${r} 0 0 1 ${p(a2)}`;
}

export function LogoIcon({ size = 40, mono = false, className, title = 'Fatec Mission' }) {
  const cor = mono ? 'var(--cream)' : 'var(--red)';
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label={title}>
      <g fill="none" stroke={cor} strokeWidth="7">
        {[0, 90, 180, 270].map((a) => (
          <path key={a} d={arco(34, a + 12, a + 78)} />
        ))}
      </g>
      <g stroke={cor} strokeWidth="3.5" strokeLinecap="square">
        <path d="M50 8v12M50 80v12M8 50h12M80 50h12" />
        <path d="M50 60V26" />
      </g>
      <path fill={cor} d="M50 25l17 4-6 5 6 5-17 2z" />
      <path fill={cor} d="M22 84l16-13-5-3 17-9 7 3-14 7 5 4-21 14z" />
    </svg>
  );
}

export default function Logo({ variant = 'horizontal', size = 40, mono = false, className = '' }) {
  if (variant === 'icon') return <LogoIcon size={size} mono={mono} className={className} />;

  return (
    <div className={`logo logo--${variant} ${className}`} role="img" aria-label="Fatec Mission">
      <LogoIcon size={size} mono={mono} title="" />
      <div className="logo__word" aria-hidden="true">
        <span className="logo__fatec">FATEC</span>
        <span className={`logo__mission ${mono ? 'logo__mission--mono' : ''}`}>MISSION</span>
      </div>
    </div>
  );
}
