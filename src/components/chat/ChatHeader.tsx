// src/components/chat/ChatHeader.tsx
import React, { useState } from 'react';
import { Video, Phone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VideoCall, IncomingCallDialog } from '../video';

interface ChatHeaderProps {
  participant: {
    id: string;
    name: string;
    photo: string;
    userType: string;
    subscriptionTier: string;
  };
  matchId: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ participant, matchId }) => {
  const [isInCall, setIsInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const initiateVideoCall = async () => {
    try {
      const response = await fetch('/api/video-call/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          recipientId: participant.id
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to initiate call');
      }

      const { callId } = await response.json();
      setIsInCall(true);
    } catch (error) {
      console.error('Error initiating call:', error);
      setError(error instanceof Error ? error.message : 'Failed to start call');
    }
  };

  const handleIncomingCall = (call: any) => {
    setIncomingCall(call);
  };

  const acceptCall = async () => {
    try {
      await fetch('/api/video-call/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: incomingCall.callId,
          accept: true
        }),
      });

      setIncomingCall(null);
      setIsInCall(true);
    } catch (error) {
      console.error('Error accepting call:', error);
      setError('Failed to accept call');
    }
  };

  const rejectCall = async () => {
    try {
      await fetch('/api/video-call/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: incomingCall.callId,
          accept: false
        }),
      });

      setIncomingCall(null);
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  };

  const endCall = async () => {
    try {
      await fetch(`/api/video-call/${incomingCall?.callId || ''}/end`, {
        method: 'POST',
      });

      setIsInCall(false);
      setIncomingCall(null);
    } catch (error) {
      console.error('Error ending call:', error);
      setError('Failed to end call');
    }
  };

  return (
    <>
      <div className="p-4 border-b bg-white flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img
            src={participant.photo}
            alt={participant.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold">{participant.name}</h3>
            <p className="text-sm text-gray-500">{participant.userType}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Video Call Button */}
          <button
            onClick={initiateVideoCall}
            disabled={isInCall}
            className={`p-2 rounded-full transition-colors ${
              isInCall
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title={
              participant.subscriptionTier === 'Basic'
                ? 'Video calls require Gold or Platinum subscription'
                : 'Start video call'
            }
          >
            <Video className="h-5 w-5" />
          </button>

          {/* Regular Call Button (for future use) */}
          <button
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            title="Voice calls coming soon"
          >
            <Phone className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Video Call Modal */}
      {isInCall && (
        <VideoCall
          matchId={matchId}
          callId={incomingCall?.callId || ''}
          remoteUserId={participant.id}
          onEndCall={endCall}
        />
      )}

      {/* Incoming Call Dialog */}
      {incomingCall && !isInCall && (
        <IncomingCallDialog
          caller={participant}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}
    </>
  );
};

// Update src/components/chat/ChatWindow.tsx to use the new header
import { ChatHeader } from './ChatHeader';

const ChatWindow: React.FC<{
  matchId: string;
  participant: any;
}> = ({ matchId, participant }) => {
  return (
    <div className="flex flex-col h-full">
      <ChatHeader participant={participant} matchId={matchId} />
      {/* Rest of the chat window implementation */}
    </div>
  );
};