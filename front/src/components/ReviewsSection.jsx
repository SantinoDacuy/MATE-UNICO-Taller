import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import ReviewsModal from './ReviewsModal';
import './ReviewsSection.css';

export default function ReviewsSection({ productId, productType = 'producto' }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [averageRating, setAverageRating] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Cargar reseñas
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await fetch(
                    `http://localhost:3001/api/reviews?productId=${productId}&productType=${productType}`
                );
                const data = await response.json();

                if (data.success) {
                    setReviews(data.reviews || []);
                    setAverageRating(data.averageRating || 0);
                }
            } catch (err) {
                console.error('Error cargando reseñas:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [productId, productType, refreshTrigger]);

    const handleReviewSubmitted = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const visibleReviews = reviews.slice(0, 3);
    const hasMoreReviews = reviews.length > 3;
    const fourthReview = reviews[3];

    if (loading) {
        return <div className="reviews-section-loading">Cargando opiniones...</div>;
    }

    return (
        <>
            <section className="reviews-section">
                <div className="reviews-header">
                    <h2>Opiniones de Clientes</h2>
                    {reviews.length > 0 && (
                        <div className="average-rating">
                            <span className="average-number">{averageRating.toFixed(1)}</span>
                            <div className="stars">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span key={star} className={`star ${star <= Math.round(averageRating) ? 'filled' : ''}`}>
                                        ★
                                    </span>
                                ))}
                            </div>
                            <span className="average-text">({reviews.length} {reviews.length === 1 ? 'opinión' : 'opiniones'})</span>
                        </div>
                    )}
                </div>

                {/* Formulario para dejar reseña */}
                <ReviewForm 
                    productId={productId}
                    productType={productType}
                    onReviewSubmitted={handleReviewSubmitted}
                />

                {/* Reseñas */}
                {reviews.length === 0 ? (
                    <div className="no-reviews">
                        <p>Aún no hay opiniones. ¡Sé el primero en compartir tu experiencia!</p>
                    </div>
                ) : (
                    <div className="reviews-list">
                        {visibleReviews.map((review) => (
                            <div key={review.id} className="review-card">
                                <div className="review-header">
                                    <div>
                                        <h4 className="review-title">{review.titulo}</h4>
                                        <p className="review-author">{review.usuario_nombre || 'Usuario'}</p>
                                    </div>
                                    <StarRating value={review.calificacion} readOnly size="small" />
                                </div>
                                <p className="review-date">{new Date(review.fecha_creacion).toLocaleDateString('es-AR')}</p>
                                <p className="review-content">{review.contenido}</p>
                            </div>
                        ))}

                        {/* Cuarta reseña con blur */}
                        {fourthReview && (
                            <div className="review-card review-card-blur">
                                <div className="blur-overlay"></div>
                                <div className="blur-content">
                                    <div className="review-header">
                                        <div>
                                            <h4 className="review-title">{fourthReview.titulo}</h4>
                                            <p className="review-author">{fourthReview.usuario_nombre || 'Usuario'}</p>
                                        </div>
                                        <StarRating value={fourthReview.calificacion} readOnly size="small" />
                                    </div>
                                    <p className="review-date">{new Date(fourthReview.fecha_creacion).toLocaleDateString('es-AR')}</p>
                                    <p className="review-content">{fourthReview.contenido}</p>
                                </div>
                                <button 
                                    className="btn-see-more-overlay"
                                    onClick={() => setShowModal(true)}
                                >
                                    Ver Más Opiniones
                                </button>
                            </div>
                        )}

                        {/* Botón Ver más si hay más de 4 reseñas */}
                        {reviews.length > 4 && !hasMoreReviews && (
                            <button 
                                className="btn-see-more"
                                onClick={() => setShowModal(true)}
                            >
                                Ver {reviews.length - 3} opiniones más
                            </button>
                        )}
                    </div>
                )}
            </section>

            {/* Modal de reseñas completas */}
            {showModal && (
                <ReviewsModal 
                    reviews={reviews}
                    averageRating={averageRating}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}
