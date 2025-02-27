// src/components/matching/MatchCard.tsx

import React from 'react';
import { motion, PanInfo, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { MapPin, Star, Shield, Award, Briefcase } from 'lucide-react';

const MatchCard = ({ match, onSwipe, index, totalCards }) => {
  const x = useMotionValue(0);
  const scale = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);
  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25]);
  const controls = useAnimation();

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const direction = info.offset.x > 0 ? 'right' : 'left';
    const velocity = Math.abs(info.velocity.x);
    
    if (Math.abs(info.offset.x) > 100 || velocity > 800) {
      await controls.start({
        x: direction === 'right' ? 1000 : -1000,
        transition: { duration: 0.5 }
      });
      onSwipe(direction === 'right');
    } else {
      controls.start({ x: 0 });
    }
  };

  const getMatchQualityColor = (quality) => {
    switch (quality) {
      case 'HIGH': return 'bg-emerald-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const renderMatchFactors = (factors) => {
    const factorIcons = {
      industryAlignment: <Briefcase className="w-4 h-4" />,
      investmentAlignment: <Award className="w-4 h-4" />,
      verificationScore: <Shield className="w-4 h-4" />
    };

    return Object.entries(factors).map(([key, value]) => {
      if (!factorIcons[key]) return null;
      const percentage = Math.round((value as number) * 100);
      
      return (
        <div key={key} className="flex items-center space-x-2">
          {factorIcons[key]}
          <div className="flex-1">
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-blue-600 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-medium">{percentage}%</span>
        </div>
      );
    });
  };

  return (
    <motion.div
      style={{
        x,
        rotate,
        scale,
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        zIndex: totalCards - index,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      className="touch-none"
    >
      <div className="w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header Image */}
        <div className="relative h-2/3">
          <img
            src={match.user.photo}
            alt={match.user.name || match.user.projectName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Match Quality Badge */}
          <div className="absolute top-4 right-4">
            <div className={`px-3 py-1 rounded-full text-white flex items-center space-x-1 ${getMatchQualityColor(match.matchQuality)}`}>
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium">{match.compatibility}% Match</span>
            </div>
          </div>

          {/* Title Section */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-2xl font-bold text-white">
              {match.user.type === 'entrepreneur' ? match.user.projectName : match.user.name}
            </h2>
            
            {match.user.location && (
              <div className="flex items-center space-x-2 text-white/80 mt-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
                  {match.user.location.city}, {match.user.location.country}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Match Factors */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Match Factors</h3>
              {renderMatchFactors(match.factors)}
            </div>

            {/* Key Information */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-gray-500">Industry</span>
                  <span className="font-medium">{match.user.industries[0]}</span>
                </div>
                <div>
                  <span className="block text-gray-500">Experience</span>
                  <span className="font-medium">{match.user.yearsExperience} years</span>
                </div>
                {match.user.type === 'entrepreneur' ? (
                  <>
                    <div>
                      <span className="block text-gray-500">Seeking</span>
                      <span className="font-medium">
                        ${(match.user.desiredInvestment.amount).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-gray-500">Timeline</span>
                      <span className="font-medium">{match.user.desiredInvestment.timeframe}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="block text-gray-500">Investment Range</span>
                      <span className="font-medium">
                        Up to ${(match.user.availableFunds).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-gray-500">Focus Areas</span>
                      <span className="font-medium">{match.user.areasOfInterest[0]}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Match Reasons */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Why you might match</h3>
              <ul className="space-y-1">
                {match.matchReasons.map((reason, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MatchCard;