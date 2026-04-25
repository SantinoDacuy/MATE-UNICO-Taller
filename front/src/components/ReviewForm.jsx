import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';
import './ReviewForm.css';

export default function ReviewForm({ productId, productType = 'producto', onReviewSubmitted = null }) {
    const [canReview, setCanReview] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState(''); // 'success' o 'error'

    const [formData, setFormData] = useState({
        titulo: '',
        contenido: '',
        calificacion: 0
    });

    // Verificar si el usuario puede dejar reseña
    useEffect(() => {
        const checkIfCanReview = async () => {
            try {
                const response = await fetch(
                    `http://localhost:3001/api/reviews/can-review?productId=${productId}&productType=${productType}`,
                    { credentials: 'include' }
                );
                const data = await response.json();
                setCanReview(data.canReview);
                if (data.message) {
                    setMessage(data.message);
                    setMessageType(data.canReview ? 'success' : 'info');
                }
            } catch (err) {
                console.error('Error al verificar permisos de reseña:', err);
                setCanReview(false);
            } finally {
                setLoading(false);
            }
        };

        checkIfCanReview();
    }, [productId, productType]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.calificacion || !formData.titulo.trim()) {
            setMessage('Por favor completa la calificación y el título');
            setMessageType('error');
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch('http://localhost:3001/api/reviews', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    productType,
                    titulo: formData.titulo,
                    contenido: formData.contenido,
                    calificacion: formData.calificacion
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('¡Gracias por compartir tu experiencia con Mate Único! 🧉');
                setMessageType('success');
                setFormData({ titulo: '', contenido: '', calificacion: 0 });
                setCanReview(false);
                
                // Callback para recargar reseñas
                if (onReviewSubmitted) {
                    onReviewSubmitted();
                }

                // Limpiar mensaje después de 4 segundos
                setTimeout(() => setMessage(null), 4000);
            } else {
                setMessage(data.error || 'Error al enviar la reseña');
                setMessageType('error');
            }
        } catch (err) {
            console.error('Error enviando reseña:', err);
            setMessage('Error de conexión');
            setMessageType('error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="review-form-loading">Cargando...</div>;
    }

    if (!canReview) {
        return (
            <div className="review-form-disabled">
                <p className="disabled-message">
                    {message || '🔒 Debes comprar este producto para dejar una opinión.'}
                </p>
            </div>
        );
    }

    return (
        <form className="review-form" onSubmit={handleSubmit}>
            {message && (
                <div className={`message message-${messageType}`}>
                    {message}
                </div>
            )}

            <h3 className="form-title">Comparte tu Opinión</h3>

            <div className="form-group">
                <label>Calificación *</label>
                <StarRating 
                    value={formData.calificacion}
                    onChange={(val) => setFormData({ ...formData, calificacion: val })}
                    size="large"
                />
            </div>

            <div className="form-group">
                <label htmlFor="titulo">Título de tu Reseña *</label>
                <input
                    id="titulo"
                    type="text"
                    placeholder="Ej: ¡Excelente calidad!"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    maxLength="100"
                />
                <span className="char-count">{formData.titulo.length}/100</span>
            </div>

            <div className="form-group">
                <label htmlFor="contenido">Tu Opinión</label>
                <textarea
                    id="contenido"
                    placeholder="Cuéntanos tu experiencia con este mate..."
                    value={formData.contenido}
                    onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                    maxLength="500"
                    rows="5"
                />
                <span className="char-count">{formData.contenido.length}/500</span>
            </div>

            <button 
                type="submit" 
                className="btn-submit"
                disabled={submitting}
            >
                {submitting ? 'Enviando...' : 'Enviar Reseña'}
            </button>
        </form>
    );
}
