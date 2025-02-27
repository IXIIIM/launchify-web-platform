import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: 'default' | 'small';
}

const StarRating = ({ value, onChange, size = 'default' }: StarRatingProps) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={`focus:outline-none ${
            size === 'small' ? 'p-1' : 'p-2'
          }`}
        >
          <Star
            className={`${
              star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            } ${size === 'small' ? 'w-4 h-4' : 'w-6 h-6'}`}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;