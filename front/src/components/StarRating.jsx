import React, { useState } from 'react';
import './StarRating.css';

export default function StarRating({ value = 0, onChange = null, readOnly = false, size = 'normal' }) {
    const [hoverValue, setHoverValue] = useState(0);

    const handleClick = (starValue) => {
        if (!readOnly && onChange) {
            onChange(starValue);
        }
    };

    const handleMouseEnter = (starValue) => {
        if (!readOnly) {
            setHoverValue(starValue);
        }
    };

    const handleMouseLeave = () => {
        setHoverValue(0);
    };

    const displayValue = hoverValue || value;

    return (
        <div className={`star-rating ${size} ${readOnly ? 'readonly' : ''}`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`star ${star <= displayValue ? 'filled' : ''}`}
                    onClick={() => handleClick(star)}
                    onMouseEnter={() => handleMouseEnter(star)}
                    onMouseLeave={handleMouseLeave}
                    style={{ cursor: readOnly ? 'default' : 'pointer' }}
                >
                    ★
                </span>
            ))}
        </div>
    );
}
