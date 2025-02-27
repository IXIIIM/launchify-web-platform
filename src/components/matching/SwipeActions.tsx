// src/components/matching/SwipeActions.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { X, Heart, Star } from 'lucide-react';

const SwipeActions = ({ onSwipe, onSuperLike }) => {
  return (
    <div className="flex justify-center items-center space-x-4 p-4">
      {/* Reject Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-16 h-16 flex items-center justify-center bg-white rounded-full shadow-lg border-2 border-red-500 text-red-500"
        onClick={() => onSwipe(false)}
      >
        <X className="w-8 h-8" />
      </motion.button>

      {/* Super Like Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-lg border-2 border-blue-500 text-blue-500"
        onClick={onSuperLike}
      >
        <Star className="w-6 h-6" />
      </motion.button>

      {/* Like Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-16 h-16 flex items-center justify-center bg-white rounded-full shadow-lg border-2 border-emerald-500 text-emerald-500"
        onClick={() => onSwipe(true)}
      >
        <Heart className="w-8 h-8" />
      </motion.button>
    </div>
  );
};

const SwipeIndicators = ({ direction }) => {
  return (
    <>
      {/* Like Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: direction === 'right' ? 1 : 0,
          scale: direction === 'right' ? 1 : 0.5
        }}
        className="absolute top-1/4 right-8 transform rotate-12 border-4 border-emerald-500 text-emerald-500 px-6 py-2 rounded-lg z-20"
      >
        <span className="text-2xl font-bold">LIKE</span>
      </motion.div>

      {/* Nope Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: direction === 'left' ? 1 : 0,
          scale: direction === 'left' ? 1 : 0.5
        }}
        className="absolute top-1/4 left-8 transform -rotate-12 border-4 border-red-500 text-red-500 px-6 py-2 rounded-lg z-20"
      >
        <span className="text-2xl font-bold">NOPE</span>
      </motion.div>
    </>
  );
};

export { SwipeActions, SwipeIndicators };