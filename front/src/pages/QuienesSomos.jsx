import React, { useEffect } from 'react';
import Breadcrumbs from '../components/Breadcrumbs';
import './QuienesSomos.css';
import equipoImg from '../assets/QUIENESSOMOS.png'; // Usamos la imagen especificada

export default function QuienesSomos() {
    // Al entrar desde el footer, forzamos que scrollee arriba a la primera impresión
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="qs-page">
            <Breadcrumbs />
            <div className="qs-container">
                
                {/* 1. Cabecera (Hero Text) */}
                <header className="qs-hero">
                    <h1 className="qs-title">No hacemos solo mates.<br />Compartimos historias.</h1>
                    <p className="qs-subtitle">
                        Creemos que detrás de cada infusión hay una conversación, una pausa y un momento para conectar. Esa es nuestra verdadera materia prima.
                    </p>
                </header>

                {/* 2. Imagen inmersiva grande */}
                <div className="qs-image-wrapper">
                    <img src={equipoImg} alt="El equipo de Mate Único" className="qs-main-img" />
                    <div className="qs-image-overlay"></div>
                </div>

                {/* 3. La Historia (El Tridente) */}
                <section className="qs-story-section">
                    <div className="qs-story-text">
                        <h2 className="qs-section-title">Nuestra Historia</h2>
                        <h3 className="qs-founders">Santino, Tobías y Lucrecia</h3>
                        <p>
                            Mate Único no nació en una junta de negocios ni en una oficina corporativa; nació, irónicamente, <em>tomando mates</em>. Los tres compartíamos la misma frustración: encontrar un mate que no solo mantenga bien el calor y tenga buenos materiales, sino que además sea una pieza de diseño digna de llevar a todos lados.
                        </p>
                        <p>
                            Lo que empezó como una pequeña búsqueda personal de calabazas de paredes gruesas y fundas de cuero legítimo, se convirtió en una obsesión por el estándar de calidad más riguroso del mercado.
                        </p>
                        <p>
                            Hoy, seleccionamos, pulimos, forramos y empaquetamos cada mate con la misma pasión que le poníamos al primero. Cuidamos cada detalle porque sabemos perfectamente que un mate nunca es "sólo" un mate; va a ser, literalmente, el mejor compañero de tus mañanas por muchísimos años.
                        </p>
                    </div>
                </section>

                {/* 4. Valores Fundamentales */}
                <section className="qs-values-grid">
                    <div className="qs-value-card">
                        <span className="qs-value-icon">🌿</span>
                        <h4>Materiales Nobles</h4>
                        <p>Elegimos a mano cada pieza priorizando durabilidad y texturas orgánicas.</p>
                    </div>
                    <div className="qs-value-card">
                        <span className="qs-value-icon">🤲</span>
                        <h4>Artesanía Real</h4>
                        <p>Terminaciones cuidadas y manufactura hecha por gente apasionada, no por máquinas.</p>
                    </div>
                    <div className="qs-value-card">
                        <span className="qs-value-icon">🤝</span>
                        <h4>Comunidad</h4>
                        <p>Conectamos desde la empatía. Cada cliente pasa a ser un compañero matero más.</p>
                    </div>
                </section>

            </div>
        </div>
    );
}
