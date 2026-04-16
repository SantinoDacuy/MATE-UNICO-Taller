import React, { useEffect } from 'react';
import './Toast.css';

export const Toast = ({ message, type = 'info', visible = true, onClose }) => {
  useEffect(() => {
    if (!visible) return;
    
    const timer = setTimeout(() => {
      onClose();
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [visible, onClose]);

  if (!visible) return null;

  const getIcon = () => {
    switch(type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '•';
    }
  };

  return (
    <div className={`mu-toast mu-toast-${type}`} role="status">
      <div className="mu-toast-container">
        <div className="mu-toast-header">
          <span className="mu-toast-logo">MATE UNICO</span>
        </div>
        <div className="mu-toast-content">
          <span className={`mu-toast-icon mu-toast-icon-${type}`}>{getIcon()}</span>
          <p className="mu-toast-message">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default Toast;
