// src/pages/settings/components/ProfileSettings.tsx

import React, { useState, useEffect } from 'react';
import { Shield, Users } from 'lucide-react';
import { ImageUpload } from '@/components/common/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneVerification } from '@/components/auth/PhoneVerification';
import { Profile } from '@/types/user';

interface ProfileSettingsProps {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onError, onSuccess }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      onError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (data: Partial<Profile>) => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update profile');
      
      setProfile(prev => ({ ...prev, ...data }));
      onSuccess('Profile updated successfully');
    } catch (error) {
      onError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-32 bg-gray-200 rounded-lg"></div>
      <div className="space-y-2">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Profile Information</h3>
      
      {/* Profile Photo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Photo
        </label>
        <ImageUpload
          currentImage={profile?.photo}
          onUpload={(url) => handleProfileUpdate({ photo: url })}
          className="w-32 h-32"
        />
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <div className="mt-1 flex items-center">
            <input
              type="email"
              id="email"
              value={profile?.email}
              disabled
              className="block w-full rounded-md border-gray-300 bg-gray-50"
            />
            {profile?.emailVerified ? (
              <Shield className="w-5 h-5 text-green-500 ml-2" />
            ) : (
              <Button
                variant="link"
                size="sm"
                className="ml-2"
                onClick={() => {/* Handle email verification */}}
              >
                Verify
              </Button>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <div className="mt-1 flex items-center">
            <input
              type="tel"
              id="phone"
              value={profile?.phone}
              disabled
              className="block w-full rounded-md border-gray-300 bg-gray-50"
            />
            {profile?.phoneVerified ? (
              <Shield className="w-5 h-5 text-green-500 ml-2" />
            ) : (
              <Button
                variant="link"
                size="sm"
                className="ml-2"
                onClick={() => setIsVerifyingPhone(true)}
              >
                Verify
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Type-specific Fields */}
      {profile?.type === 'entrepreneur' ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
              Project/Business Name
            </label>
            <Input
              type="text"
              id="projectName"
              value={profile?.projectName || ''}
              onChange={(e) => handleProfileUpdate({ projectName: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
              Industry
            </label>
            <Input
              type="text"
              id="industry"
              value={profile?.industry || ''}
              onChange={(e) => handleProfileUpdate({ industry: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
              Company/Fund Name
            </label>
            <Input
              type="text"
              id="companyName"
              value={profile?.companyName || ''}
              onChange={(e) => handleProfileUpdate({ companyName: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="investmentFocus" className="block text-sm font-medium text-gray-700">
              Investment Focus
            </label>
            <Input
              type="text"
              id="investmentFocus"
              value={profile?.investmentFocus || ''}
              onChange={(e) => handleProfileUpdate({ investmentFocus: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>
      )}

      {/* Phone Verification Modal */}
      {isVerifyingPhone && (
        <PhoneVerification
          onClose={() => setIsVerifyingPhone(false)}
          onVerified={() => {
            setIsVerifyingPhone(false);
            fetchProfile();
          }}
        />
      )}
    </div>
  );
};

export default ProfileSettings;