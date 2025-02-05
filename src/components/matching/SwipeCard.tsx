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
  const x = motion.useMotionValue(0);
  const rotate = motion.useTransform(x, [-200, 200], [-25, 25]);
  const opacity = motion.useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      onSwipe(info.offset.x > 0 ? 'right' : 'left');
    }
  };

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: totalCards - index,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="touch-none"
    >
      <div className="w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden">
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

        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Why you might match</h3>
            <ul className="space-y-2">
              {match.matchReason.map((reason, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  <Star className="w-4 h-4 text-yellow-400 mr-2" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-gray-600">
                {match.user.yearsExperience} years experience
              </span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-gray-600 capitalize">
                {match.user.type}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeCard;