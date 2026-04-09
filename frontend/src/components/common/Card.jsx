/**
 * Reusable Card Component
 */
export default function Card({ title, children, className = '', glass = false, style }) {
  const cardClasses = `card ${glass ? 'card-glass' : ''} ${className}`;
  
  return (
    <div className={cardClasses} style={style}>
      {title && <h3 style={{ marginBottom: 'var(--space-md)' }}>{title}</h3>}
      {children}
    </div>
  );
}
