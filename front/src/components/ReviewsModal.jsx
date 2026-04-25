import React, { useState } from 'react';
import StarRating from './StarRating';
import './ReviewsModal.css';

export default function ReviewsModal({ reviews, averageRating, onClose }) {
    const [sortBy, setSortBy] = useState('recent'); // 'recent', 'highestRating', 'lowestRating'

    const getSortedReviews = () => {
        const sorted = [...reviews];

        if (sortBy === 'recent') {
            return sorted.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
        } else if (sortBy === 'highestRating') {
            return sorted.sort((a, b) => b.calificacion - a.calificacion);
        } else if (sortBy === 'lowestRating') {
            return sorted.sort((a, b) => a.calificacion - b.calificacion);
        }

        return sorted;
    };

    const sortedReviews = getSortedReviews();

    return (
        <>
            <div className="modal-overlay" onClick={onClose}></div>
            <div className="reviews-modal">
                <div className="modal-header">
                    <h2>Todas las Opiniones</h2>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-stats">
                    <div className="stat-item">
                        <span className="stat-label">Promedio</span>
                        <div className="stat-value">
                            <span className="average-number">{averageRating.toFixed(1)}</span>
                            <div className="stars">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span key={star} className={`star ${star <= Math.round(averageRating) ? 'filled' : ''}`}>
                                        ★
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Total de Opiniones</span>
                        <span className="stat-value number">{reviews.length}</span>
                    </div>
                </div>

                <div className="sort-controls">
                    <label htmlFor="sort-select">Ordenar por:</label>
                    <select 
                        id="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="recent">Más Recientes</option>
                        <option value="highestRating">Mayor Calificación</option>
                        <option value="lowestRating">Menor Calificación</option>
                    </select>
                </div>

                <div className="reviews-modal-list">
                    {sortedReviews.map((review) => (
                        <div key={review.id} className="modal-review-card">
                            <div className="modal-review-header">
                                <div>
                                    <h4 className="modal-review-title">{review.titulo}</h4>
                                    <p className="modal-review-author">Usuario Anónimo</p>
                                    <p className="modal-review-date">
                                        {new Date(review.fecha_creacion).toLocaleDateString('es-AR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <StarRating value={review.calificacion} readOnly size="small" />
                            </div>
                            <p className="modal-review-content">{review.contenido}</p>
                        </div>
                    ))}
                </div>

                <button className="btn-close-modal" onClick={onClose}>Cerrar</button>
            </div>
        </>
    );
}
