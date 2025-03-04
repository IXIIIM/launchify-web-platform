// src/mobile/components/ui/index.ts

export * from './Text';
export * from './Button';
export * from './Card';
export * from './Input';
export * from './Avatar';
export * from './Tabs';

// src/mobile/components/matches/MatchCard.tsx

import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { Text } from '../ui';
import { Star } from 'lucide-react-native';

export const MatchCard = ({ match, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl shadow-sm overflow-hidden"
    >
      <Image
        source={{ uri: match.user.photo }}
        className="w-full h-48"
        resizeMode="cover"
      />
      <View className="p-4">
        <View className="flex-row justify-between items-start">
          <View>
            <Text className="text-lg font-bold">
              {match.user.type === 'entrepreneur'
                ? match.user.projectName
                : match.user.name}
            </Text>
            <Text className="text-gray-500">
              {match.user.industries.join(', ')}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Star size={16} color="#FBC02D" />
            <Text className="ml-1 font-semibold">
              {match.compatibility}% Match
            </Text>
          </View>
        </View>

        <View className="mt-3">
          <Text className="text-sm text-gray-600">
            {match.user.type === 'entrepreneur'
              ? `Seeking $${match.user.desiredInvestment.amount.toLocaleString()}`
              : `Investing up to $${match.user.availableFunds.toLocaleString()}`}
          </Text>
        </View>

        <View className="mt-3">
          {match.matchReasons.map((reason, index) => (
            <Text key={index} className="text-sm text-gray-600 flex-row items-center">
              <Text className="text-green-500 mr-1">✓</Text> {reason}
            </Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// src/mobile/components/ui/Text.tsx

import React from 'react';
import { Text as RNText } from 'react-native';

export const Text = ({ className, ...props }) => (
  <RNText 
    className={`text-gray-900 ${className || ''}`}
    {...props}
  />
);

// src/mobile/components/ui/Button.tsx

import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Text } from './Text';

export const Button = ({ 
  children, 
  variant = 'primary',
  size = 'medium',
  className,
  ...props 
}) => {
  const variants = {
    primary: 'bg-blue-600 text-white',
    secondary: 'bg-gray-200 text-gray-900',
    outline: 'border border-gray-300 text-gray-900'
  };

  const sizes = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3 text-lg'
  };

  return (
    <TouchableOpacity
      className={`rounded-lg ${variants[variant]} ${sizes[size]} ${className || ''}`}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text className={variant === 'primary' ? 'text-white' : 'text-gray-900'}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

// src/mobile/components/ui/Card.tsx

import React from 'react';
import { View } from 'react-native';

export const Card = ({ children, className, ...props }) => (
  <View
    className={`bg-white rounded-xl shadow-sm p-4 ${className || ''}`}
    {...props}
  >
    {children}
  </View>
);

// src/mobile/components/ui/Input.tsx

import React from 'react';
import { TextInput } from 'react-native';

export const Input = ({ className, ...props }) => (
  <TextInput
    className={`bg-white border border-gray-300 rounded-lg px-4 py-2 ${className || ''}`}
    placeholderTextColor="#9CA3AF"
    {...props}
  />
);