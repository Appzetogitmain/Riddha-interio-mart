import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

// 1-5 stars (with half stars) plus the review count. Renders nothing when there is no rating to show.
const StarRating = ({ rating, count, size = 12, showNumber = true, className = '' }) => {
  if (!rating || rating <= 0) return null;
  const stars = [1, 2, 3, 4, 5].map(i => {
    if (rating >= i - 0.25) return <FaStar key={i} size={size} className="text-amber-400" />;
    if (rating >= i - 0.75) return <FaStarHalfAlt key={i} size={size} className="text-amber-400" />;
    return <FaRegStar key={i} size={size} className="text-gray-300" />;
  });
  return (
    <div className={`flex items-center gap-1 min-w-0 ${className}`} aria-label={`Rated ${rating} out of 5`}>
      <div className="flex items-center gap-0.5 shrink-0">{stars}</div>
      {showNumber && <span className="text-[11px] md:text-xs font-bold text-gray-700">{Number(rating).toFixed(1)}</span>}
      {count > 0 && <span className="text-[10px] md:text-xs font-medium text-gray-400">({count.toLocaleString('en-IN')})</span>}
    </div>
  );
};

export default StarRating;
