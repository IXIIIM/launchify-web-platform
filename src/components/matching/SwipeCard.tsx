import React from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Star, Briefcase, Users } from 'lucide-react';
import { Entrepreneur, Funder } from '@/types/user';

interface SwipeCardProps {
  match: {
    id: string;
    user: Entrepreneur | Funder;
    compatibility: number;
    matchReason: string[];
  };
  index: number;
  onSwipe: (direction: 'left' | 'right') => void;
  totalCards: number;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ match, index, onSwipe, totalCards }) => {
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      onSwipe(info.offset.x > 0 ? 'right' : 'left');
    }
  };

  return (
    <motion.div
      className="absolute w-full h-full"
      style={{
        zIndex: totalCards - index,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05 }}
      animate={{
        scale: 1,
        opacity: 1,
        rotateZ: 0,
      }}
    >
      <div className="w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Profile Image */}
        <div className="relative h-2/3">
          <img
            src={match.user.photo}
            alt="Profile"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <h2 className="text-2xl font-bold text-white">
              {match.user.type === 'entrepreneur'
                ? (match.user as Entrepreneur).projectName
                : (match.user as Funder).name}
            </h2>
            <div className="flex items-center space-x-2 mt-2">
              <span className="px-2 py-1 bg-white/20 rounded-full text-white text-sm">
                {match.compatibility}% Match
              </span>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center text-sm text-gray-500">
              <Briefcase className="w-4 h-4 mr-1" />
              {match.user.yearsExperience} years experience
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Users className="w-4 h-4 mr-1" />
              {match.user.type}
            </div>
          </div>

          {/* Match Reasons */}
          <div className="space-y-2">
            {match.matchReason.map((reason, index) => (
              <div key={index} className="flex items-center text-sm text-gray-600">
                <Star className="w-4 h-4 text-yellow-400 mr-2" />
                {reason}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeCard;