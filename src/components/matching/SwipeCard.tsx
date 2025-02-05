import React from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Briefcase, Users, Star } from 'lucide-react';
import { Entrepreneur, Funder } from '@/types/user';

interface MatchCardProps {
  user: Entrepreneur | Funder;
  onSwipe: (direction: 'left' | 'right') => void;
  matchReason: string[];
  compatibility: number;
}

const SwipeCard: React.FC<MatchCardProps> = ({
  user,
  onSwipe,
  matchReason,
  compatibility
}) => {
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      onSwipe(info.offset.x > 0 ? 'right' : 'left');
    }
  };

  return (
    <motion.div
      className="absolute w-full h-full"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Profile Image */}
        <div className="relative h-2/3">
          {user.photo ? (
            <img
              src={user.photo}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Users className="w-20 h-20 text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <h2 className="text-2xl font-bold text-white">
              {user.type === 'entrepreneur' 
                ? (user as Entrepreneur).projectName
                : (user as Funder).name}
            </h2>
            <div className="flex items-center mt-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm">
                {compatibility}% Match
              </span>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center text-sm text-gray-500">
              <Briefcase className="w-4 h-4 mr-1" />
              {user.yearsExperience} years experience
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Users className="w-4 h-4 mr-1" />
              {user.type === 'entrepreneur' ? 'B2B' : 'Investor'}
            </div>
          </div>

          {/* Match Reasons */}
          <div className="space-y-2">
            {matchReason.map((reason, index) => (
              <div key={index} className="flex items-center text-sm text-gray-600">
                <Star className="w-4 h-4 text-yellow-400 mr-2" />
                {reason}
              </div>
            ))}
          </div>

          {/* Action Overlay */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              opacity: 0
            }}
            whileDrag={{
              opacity: 1
            }}
          >
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white rounded-full shadow-lg">
                <motion.div
                  style={{
                    opacity: 0,
                    rotate: -45
                  }}
                  whileDrag={{
                    opacity: 1,
                    rotate: 0
                  }}
                >
                  ❌
                </motion.div>
              </div>
              <div className="p-4 bg-white rounded-full shadow-lg">
                <motion.div
                  style={{
                    opacity: 0,
                    rotate: 45
                  }}
                  whileDrag={{
                    opacity: 1,
                    rotate: 0
                  }}
                >
                  ✅
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeCard;