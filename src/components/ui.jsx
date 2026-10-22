/**
 * Componentes de interface reutilizáveis, seguindo os "Elementos gráficos" da identidade.
 */
import { useEffect, useId, useRef } from 'react';
import { CircleAlert, RefreshCw, X } from 'lucide-react';
import { NIVEL } from '../utils/rules';

/** Painel HUD com canto chanfrado e borda vermelha fina. */
export function HudCard({
  as: Tag = 'div',
  shape = 'tr',
  size,
  tone,
  raised = false,
  label,
  className = '',
  innerClassName = '',
  bodyClassName = 'hud__body',
  children,
  ...rest
}) {
  const classes = [
    'hud',
    `hud--${shape}`,
    size && `hud--${size}`,
    tone && `hud--${tone}`,
    raised && 'hud--raised',
    (typeof Tag !== 'string' || Tag === 'a' || Tag === 'button' || rest.onClick) && 'hud--link',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} {...rest}>
      <div className={`hud__inner ${innerClassName}`}>
        {label && <span className="hud__label">{label}</span>}
        <div className={bodyClassName}>{children}</div>
      </div>
    </Tag>
  );
}

/** Barra de progresso em blocos (assinatura visual da marca). */
export function SegmentBar({ value = 0, max = 100, segments = 12, size, label = 'Progresso' }) {
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const cheios = Math.round(pct * segments);
  return (
    <div
      className={`segbar ${size ? `segbar--${size}` : ''}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
    >
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className={i < cheios ? 'on' : ''} style={{ '--i': i }} />
      ))}
    </div>
  );
}

/** Indicador de dificuldade: 1 a 3 "pips" inclinados + texto. */
export function Dificuldade({ valor, mostrarTexto = true }) {
  const nivel = NIVEL[valor] || 1;
  return (
    <span className="tag" title={`Dificuldade: ${valor}`}>
      <span className="diff-pips" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <i key={n} className={n <= nivel ? 'on' : ''} />
        ))}
      </span>
      {mostrarTexto && valor}
    </span>
  );
}

export function Button({ variant = 'primary', size, block, loading, children, className = '', ...rest }) {
  const classes = ['btn', `btn--${variant}`, size && `btn--${size}`, block && 'btn--block', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button {...rest} className={classes} disabled={loading || rest.disabled} aria-busy={loading || undefined}>
      {loading ? <span className="spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

/** Campo de formulário com rótulo, ícone opcional, erro e dica. */
export function Field({ label, icon: Icon, error, hint, children, action, id: idProp }) {
  const auto = useId();
  const id = idProp || auto;
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  const describedBy = [error && errId, hint && hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`field ${error ? 'field--error' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="field__control">
        {Icon && <Icon size={18} className="field__icon" aria-hidden="true" />}
        {children({ id, 'aria-invalid': Boolean(error) || undefined, 'aria-describedby': describedBy })}
        {action}
      </div>
      {error ? (
        <p className="field__error" id={errId}>
          <CircleAlert size={14} aria-hidden="true" /> {error}
        </p>
      ) : hint ? (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Bottom sheet modal: fecha no backdrop, no X e com Esc; trava o scroll do fundo. */
export function Sheet({ open, onClose, title, children, labelledBy }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        ref={ref}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__grip" aria-hidden="true" />
        {onClose && (
          <button className="icon-btn sheet__close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="empty">
      {Icon && (
        <div className="empty__icon">
          <Icon size={28} aria-hidden="true" />
        </div>
      )}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <EmptyState icon={CircleAlert} title="Algo deu errado">
      {error?.message || 'Não foi possível carregar os dados.'}
      {onRetry && (
        <span style={{ display: 'block', marginTop: 16 }}>
          <Button variant="ghost" size="sm" onClick={onRetry}>
            <RefreshCw size={16} /> Tentar de novo
          </Button>
        </span>
      )}
    </EmptyState>
  );
}

export function Skeleton({ h = 16, w = '100%', style }) {
  return <div className="skeleton" style={{ height: h, width: w, ...style }} aria-hidden="true" />;
}

export function SkeletonList({ n = 4, h = 88 }) {
  return (
    <div className="stack" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: n }, (_, i) => (
        <Skeleton key={i} h={h} />
      ))}
    </div>
  );
}

export function SectionHead({ title, action }) {
  return (
    <div className="section-head">
      <h2 className="section-title">{title}</h2>
      {action}
    </div>
  );
}
