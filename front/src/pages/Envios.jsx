import React, { useEffect } from 'react';
import './Envios.css';

export default function Envios() {
    // Para que al entrar haga scroll al tope por si venía de nav inferior
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="envios-page">
            <div className="envios-container">
                
                {/* Cabecera */}
                <div className="envios-hero">
                    <h1 className="envios-title">Llevamos la tradición a tu puerta.</h1>
                    <p className="envios-subtitle">
                        Conocemos la ansiedad de probar ese primer amargo en tu nuevo mate. Por eso, optimizamos toda nuestra logística para que lo recibas rápido, seguro y en perfectas condiciones.
                    </p>
                </div>

                {/* Grilla de 3 Pilares (Íconos) */}
                <div className="envios-features-grid">
                    <div className="envios-feature">
                        <div className="envios-icon-box">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="1" y="3" width="15" height="13"></rect>
                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                                <circle cx="18.5" cy="18.5" r="2.5"></circle>
                            </svg>
                        </div>
                        <h3>Despachos Rápidos</h3>
                        <p>Armamos y embalamos tu pedido en 24 a 48hs hábiles desde que confirmás tu compra.</p>
                    </div>

                    <div className="envios-feature">
                        <div className="envios-icon-box">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                        </div>
                        <h3>Seguimiento en Vivo</h3>
                        <p>Te enviamos un código de rastreo oficial por email para que sepas en dónde está tu mate en cada etapa del viaje.</p>
                    </div>

                    <div className="envios-feature">
                        <div className="envios-icon-box">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                        </div>
                        <h3>100% Asegurado</h3>
                        <p>Los mates viajan con embalaje anti-impactos. Si llega a sufrir daños en el correo, te enviamos otro nuevo gratis.</p>
                    </div>
                </div>

                {/* Políticas Detalladas */}
                <div className="envios-policy-body">
                    <section className="envios-section">
                        <h2>¿Con qué logística trabajamos?</h2>
                        <p>
                            Para garantizar la mayor cobertura nacional, formamos alianzas estratégicas con las principales empresas de logística del país, como <strong>Correo Argentino</strong> y <strong>Andreani</strong>. Dependiendo de tu código postal, el sistema seleccionará automáticamente el servicio de recolección más veloz y seguro para tu zona.
                        </p>
                    </section>

                    <section className="envios-section">
                        <h2>Tiempos reales de entrega</h2>
                        <p>
                            Una vez que el paquete abandona nuestro taller (dentro de las primeras 48hs hábiles), los tiempos estimados del correo son:
                        </p>
                        <ul className="envios-list">
                            <li><strong>CABA y Gran Buenos Aires:</strong> 2 a 4 días hábiles.</li>
                            <li><strong>Interior del país y provincias periféricas:</strong> 4 a 8 días hábiles.</li>
                            <li><strong>Envíos Express (solo zonas habilitadas):</strong> 24 a 48 hs desde el despacho.</li>
                        </ul>
                    </section>

                    <section className="envios-section">
                        <h2>Costos y cotización</h2>
                        <p>
                            El valor de envío exacto lo podés calcular directamente en el <em>Carrito de Compras</em> o en el <em>Checkout</em>, ingresando simplemente tu Código Postal. Trabajamos constantemente para negociar las mejores tarifas y que recibas calidad a precios accesibles. Además, solemos lanzar promociones de <strong>Envío Gratis</strong> para compras que superen un monto específico (verificado en la cabecera de la tienda).
                        </p>
                    </section>

                    <section className="envios-section">
                        <h2>¿Qué pasa si no estoy en mi domicilio?</h2>
                        <p>
                            No hay problema. El correo realiza, por norma general, hasta <strong>dos intentos de visita</strong>. Si en ambas ocasiones no pueden dar con nadie que reciba el paquete, el mate quedará en la sucursal del correo más cercana a tu domicilio esperando a ser retirado. Tenés un plazo aproximado de 5 días hábiles para buscarlo con tu DNI antes de que retorne a nuestro taller.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
