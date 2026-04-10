import React, { useEffect } from 'react';
import './Modal.css';

/**
 * Modal Component
 * 
 * Implementación con dos capas separadas:
 *   - .modal-backdrop: fixed, cubre toda la pantalla, z-index 2000, cierra el modal al clickar
 *   - .modal-content: fixed, centrado, z-index 2001 (SOBRE el backdrop), recibe todos los clicks
 * 
 * IMPORTANTE: el contenido y el backdrop son elementos hermanos (no padre-hijo)
 * y se posicionan de forma independiente. Esto garantiza que los clicks
 * en los botones del modal NUNCA lleguen al backdrop.
 * 
 * Para cambiar el tamaño máximo del modal: editar max-width en .modal-content (Modal.css)
 * Para desactivar el cierre al clickar fuera: quitar onClick del .modal-backdrop
 */
export default function Modal({ isOpen, onClose, title, children, footer }) {
  // Cerrar modal con la tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Capa 1: Fondo oscuro (z-index 2000). Clickar aquí cierra el modal. */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Capa 2: Contenido del modal (z-index 2001). Completamente independiente del backdrop. */}
      <div className="modal-content animate-slide-up" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar">
            &times;
          </button>
        </div>

        <div className="modal-body">
          {children}
        </div>

        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
