/**
 * Reusable Button Component
 */
export default function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  type = 'button', 
  disabled = false, 
  fullWidth = false,
  className = '',
  icon,
  style
}) {
  const baseClass = `btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`;
  
  return (
    <button 
      type={type} 
      className={baseClass} 
      onClick={onClick} 
      disabled={disabled}
      style={style}
    >
      {icon && <span className="btn-icon-wrapper">{icon}</span>}
      {children}
    </button>
  );
}
