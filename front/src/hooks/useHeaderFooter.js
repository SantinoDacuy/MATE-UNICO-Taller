import { useState, useEffect } from 'react';

/**
 * Custom hook para cargar header y footer compartidos
 * Maneja la carga paralela de HTML y asegura que los estilos estén cargados
 * @returns {Object} { headerHtml, footerHtml, isLoading }
 */
export function useHeaderFooter() {
  const [headerHtml, setHeaderHtml] = useState('');
  const [footerHtml, setFooterHtml] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cargar header/footer en paralelo
    Promise.all([
      fetch('/src/components/header.html').then(r => r.text()).catch(() => ''),
      fetch('/src/components/footer.html').then(r => r.text()).catch(() => '')
    ]).then(([header, footer]) => {
      setHeaderHtml(header);
      setFooterHtml(footer);
      setIsLoading(false);
    });

    // Asegurar que los estilos compartidos estén cargados
    if (!document.querySelector('link[href="/src/components/styles.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/src/components/styles.css';
      document.head.appendChild(link);
    }
  }, []);

  return { headerHtml, footerHtml, isLoading };
}
