import React, { useState } from 'react';
import Breadcrumbs from '../components/Breadcrumbs';
import './FAQ.css';

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(null);

    const questions = [
        {
            question: "¿Es seguro realizar mi compra en la tienda?",
            answer: "Totalmente. Procesamos todos los pagos a través de Mercado Pago, lo cual garantiza tecnología de encriptación de punta a punta. Nosotros nunca almacenamos ni tenemos acceso a los datos de tu tarjeta de crédito. Tu seguridad es primero."
        },
        {
            question: "¿Qué garantía tienen los productos y qué pasa si llegan dañados?",
            answer: "Trabajamos incansablemente para asegurar la máxima calidad de cada mate o accesorio. Si por algún motivo relacionado a la logística tu producto llega con un daño o defecto, ofrecemos garantía de reemplazo integral sin costo adicional dentro de los primeros 10 días de recibido."
        },
        {
            question: "¿Cómo realizan los envíos y cuánto demoran?",
            answer: "Realizamos envíos asegurados a todo el país a través de correos logísticos de confianza. El tiempo usual de entrega varía entre 3 y 7 días hábiles según la región. Podrás seguir el paquete en todo momento mediante un código de rastreo oficial."
        },
        {
            question: "¿De qué materiales están compuestos los mates?",
            answer: "Nuestra selección prioriza calidad suprema y autenticidad. Los mates de calabaza son seleccionados uno a uno por su grosor y curado, recubiertos en cuero legítimo. También ofrecemos mates de acero inoxidable de doble pared para garantizar total higiene y aislamiento térmico perfecto."
        },
        {
            question: "¿Tienen local físico para verlos antes de comprar?",
            answer: "Por el momento, Mate Único opera de manera 100% digital. Esta estrategia nos permite optimizar costos corporativos para ofrecerte precios ultra competitivos sin descuidar la calidad artesanal. Además, contamos con distintos canales dispuestos a mandarte fotos o resolver cualquier inquietud antes de tu compra."
        }
    ];

    const toggleAccordion = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="faq-page">
            <Breadcrumbs />
            <div className="faq-main-wrapper">
                <div className="faq-header-content">
                    <h1 className="faq-creative-title">Preguntas Frecuentes</h1>
                    <p className="faq-creative-subtitle">
                        Transparencia total. Despejá tus dudas y preparate para disfrutar de una experiencia única junto al mejor compañero de tus mañanas.
                    </p>
                </div>

                <div className="faq-questions-container">
                    <div className="faq-accordion">
                        {questions.map((item, index) => {
                            const isOpen = openIndex === index;
                            return (
                                <div className={`faq-item ${isOpen ? 'open' : ''}`} key={index}>
                                    <button className="faq-question" onClick={() => toggleAccordion(index)}>
                                        <span className="faq-question-text">{item.question}</span>
                                        <div className={`faq-icon-circle ${isOpen ? 'rotate' : ''}`}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </div>
                                    </button>
                                    <div className="faq-answer-wrapper" style={{ maxHeight: isOpen ? '250px' : '0' }}>
                                        <div className="faq-answer">
                                            {item.answer}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
