import React, { useState, useEffect } from 'react';
import { Heart, Star, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SuperLikeStatus {
  limit: number;
  remaining: number;
  used: number;
  resetsIn: number;
}

interface SuperLikeProps {
  targetUserId: string;
  onSuperLike: () => void;
  onMatch?: () => void;
}

const SuperLike: React.FC<SuperLikeProps> = ({ targetUserId, onSuperLike, onMatch }) => {
  const [status, setStatus] = useState<SuperLikeStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/matches/super-like/status');
      if (!response.ok) throw new Error('Failed to fetch super like status');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError('Failed to load super like status');
      console.error(err);
    }
  };

  const handleSuperLike = async () => {
    if (!status?.remaining) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/matches/super-like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });

      if (!response.ok) throw new Error('Failed to send super like');
      
      const data = await response.json();
      await fetchStatus(); // Refresh status
      
      if (data.isMatch && onMatch) {
        onMatch();
      }
      
      onSuperLike();
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 3000);
    } catch (err) {
      setError('Failed to send super like');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (!status) return null;

  return (
    <div className="relative">
      {/* Super Like Button */}
      <button
        onClick={handleSuperLike}
        disabled={loading || status.remaining === 0}
        className={`relative group ${
          status.remaining > 0
            ? 'hover:scale-110 transition-transform'
            : 'opacity-50 cursor-not-allowed'
        }`}
      >
        <Star
          className={`w-12 h-12 ${
            status.remaining > 0 ? 'text-blue-500' : 'text-gray-400'
          }`}
        />
        
        {/* Remaining Count Badge */}
        {status.remaining > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-blue-600 text-white text-xs font-bold rounded-full">
            {status.remaining}
          </span>
        )}

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {status.remaining > 0
            ? `${status.remaining} Super ${status.remaining === 1 ? 'Like' : 'Likes'} remaining`
            : `Resets in ${formatTimeRemaining(status.resetsIn)}`
        }
        </div>
      </button>

      {/* Success Animation */}
      {showConfirm && (
        <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
          <div className="animate-ping">
            <Star className="w-16 h-16 text-blue-500" />
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Card */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">Super Like Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Daily Limit</span>
              <span>{status.limit}</span>
            </div>
            <div className="flex justify-between">
              <span>Used Today</span>
              <span>{status.used}</span>
            </div>
            <div className="flex justify-between">
              <span>Remaining</span>
              <span>{status.remaining}</span>
            </div>
            {status.remaining === 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Resets In</span>
                <span>{formatTimeRemaining(status.resetsIn)}</span>
              </div>
            )}
          </div>

          {status.remaining === 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              Need more Super Likes? Upgrade your subscription tier to increase your daily limit!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperLike;