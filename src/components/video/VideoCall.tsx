// src/components/video/VideoCall.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, Settings,
  Camera, CameraOff, Monitor, User
} from 'lucide-react';

// WebRTC Video Call Component
export const VideoCall: React.FC<{
  matchId: string;
  callId: string;
  remoteUserId: string;
  onEndCall: () => void;
}> = ({ matchId, callId, remoteUserId, onEndCall }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const screenStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    initializeCall();
    return () => cleanup();
  }, []);

  const initializeCall = async () => {
    try {
      // Get WebRTC configuration
      const response = await fetch('/api/video-call/config');
      const config = await response.json();

      // Create peer connection
      peerConnection.current = new RTCPeerConnection(config);

      // Set up local media stream
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Add tracks to peer connection
      localStream.current.getTracks().forEach(track => {
        if (localStream.current) {
          peerConnection.current?.addTrack(track, localStream.current);
        }
      });

      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
      }

      // Handle incoming tracks
      peerConnection.current.ontrack = handleTrackEvent;
      peerConnection.current.onicecandidate = handleICECandidate;
      peerConnection.current.onconnectionstatechange = handleConnectionStateChange;

      // Set up socket listeners for signaling
      setupSignalingListeners();

      // Create and send offer if initiator
      if (isInitiator()) {
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        sendSignalingMessage('offer', offer);
      }
    } catch (error) {
      console.error('Error initializing call:', error);
      setError('Failed to initialize video call');
      onEndCall();
    }
  };

  const setupSignalingListeners = () => {
    // Listen for signaling messages
    window.addEventListener('signaling-message', handleSignalingMessage);
  };

  const handleSignalingMessage = async (event: any) => {
    const { type, data } = event.detail;

    try {
      switch (type) {
        case 'offer':
          if (peerConnection.current) {
            await peerConnection.current.setRemoteDescription(data);
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            sendSignalingMessage('answer', answer);
          }
          break;

        case 'answer':
          if (peerConnection.current) {
            await peerConnection.current.setRemoteDescription(data);
          }
          break;

        case 'ice-candidate':
          if (peerConnection.current) {
            await peerConnection.current.addIceCandidate(data);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
      setError('Connection error');
    }
  };

  const handleTrackEvent = (event: RTCTrackEvent) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = event.streams[0];
    }
  };

  const handleICECandidate = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      sendSignalingMessage('ice-candidate', event.candidate);
    }
  };

  const handleConnectionStateChange = () => {
    if (peerConnection.current) {
      const state = peerConnection.current.connectionState;
      setIsConnecting(state === 'connecting' || state === 'new');
      
      if (state === 'failed' || state === 'disconnected' || state === 'closed') {
        setError('Connection lost');
        onEndCall();
      }
    }
  };

  const sendSignalingMessage = (type: string, data: any) => {
    // Dispatch message to signaling service
    const event = new CustomEvent('send-signaling', {
      detail: {
        type,
        data,
        toUserId: remoteUserId,
        matchId
      }
    });
    window.dispatchEvent(event);
  };

  const toggleMute = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream.current) {
      localStream.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        screenStream.current?.getTracks().forEach(track => {
          track.stop();
          if (peerConnection.current) {
            const sender = peerConnection.current.getSenders().find(s => 
              s.track?.kind === track.kind
            );
            if (sender) {
              localStream.current?.getTracks().forEach(track => {
                if (track.kind === sender.track?.kind) {
                  sender.replaceTrack(track);
                }
              });
            }
          }
        });
      } else {
        // Start screen sharing
        screenStream.current = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });

        screenStream.current.getTracks().forEach(track => {
          if (peerConnection.current) {
            const sender = peerConnection.current.getSenders().find(s => 
              s.track?.kind === track.kind
            );
            if (sender) {
              sender.replaceTrack(track);
            }
          }
        });

        // Listen for when user stops screen sharing
        screenStream.current.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
      }

      setIsScreenSharing(!isScreenSharing);
    } catch (error) {
      console.error('Error toggling screen share:', error);
      setError('Failed to share screen');
    }
  };

  const cleanup = () => {
    // Stop all tracks
    localStream.current?.getTracks().forEach(track => track.stop());
    screenStream.current?.getTracks().forEach(track => track.stop());

    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    // Remove event listeners
    window.removeEventListener('signaling-message', handleSignalingMessage);
  };

  const isInitiator = () => {
    // Determine if this user initiated the call
    // This would be based on the callId and user info
    return true; // Logic to be implemented
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Error Alert */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
            {error}
          </div>
        </div>
      )}

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        {/* Local Video */}
        <div className="relative">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute bottom-4 left-4 bg-black/50 px-2 py-1 rounded text-white text-sm">
            You
          </div>
        </div>

        {/* Remote Video */}
        <div className="relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover rounded-lg"
          />
          {isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto" />
                <p className="mt-4">Connecting...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-gray-900 p-4">
        <div className="flex justify-center space-x-4">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full ${
              isMuted ? 'bg-red-500' : 'bg-gray-700'
            } hover:bg-opacity-80 transition-colors`}
          >
            {isMuted ? (
              <MicOff className="h-6 w-6 text-white" />
            ) : (
              <Mic className="h-6 w-6 text-white" />
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full ${
              !isVideoEnabled ? 'bg-red-500' : 'bg-gray-700'
            } hover:bg-opacity-80 transition-colors`}
          >
            {isVideoEnabled ? (
              <Video className="h-6 w-6 text-white" />
            ) : (
              <VideoOff className="h-6 w-6 text-white" />
            )}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full ${
              isScreenSharing ? 'bg-blue-500' : 'bg-gray-700'
            } hover:bg-opacity-80 transition-colors`}
          >
            <Monitor className="h-6 w-6 text-white" />
          </button>

          <button
            onClick={onEndCall}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
          >
            <PhoneOff className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Incoming Call Dialog
export const IncomingCallDialog: React.FC<{
  caller: {
    id: string;
    name: string;
    photo: string;
  };
  onAccept: () => void;
  onReject: () => void;
}> = ({ caller, onAccept, onReject }) => {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onReject();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 w-80"
    >
      <div className="text-center">
        <img
          src={caller.photo}
          alt={caller.name}
          className="w-20 h-20 rounded-full mx-auto mb-4"
        />
        <h3 className="font-semibold text-lg">{caller.name}</h3>
        <p className="text-gray-500">Incoming video call</p>
        <div className="mt-2 text-sm text-gray-400">
          Auto-declining in {timeLeft}s
        </div>
      </div>

      <div className="flex justify-center space-x-4 mt-4">
        <button
          onClick={onReject}
          className="p-3 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
        <button
          onClick={onAccept}
          className="p-3 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
        >
          <Video className="h-6 w-6" />
        </button>
      </div>
    </motion.div>
  );
};

// Call Settings Dialog
export const CallSettings: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onDeviceChange: (deviceId: string, type: 'audio' | 'video') => void;
}> = ({ isOpen, onClose, onDeviceChange }) => {
  const [devices, setDevices] = useState<{
    audioinput: MediaDeviceInfo[];
    videoinput: MediaDeviceInfo[];
  }>({
    audioinput: [],
    videoinput: []
  });

  useEffect(() => {
    if (isOpen) {
      loadDevices();
    }
  }, [isOpen]);

  const loadDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        audioinput: allDevices.filter(d => d.kind === 'audioinput'),
        videoinput: allDevices.filter(d => d.kind === 'videoinput')
      });
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Call Settings</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Camera Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Camera
            </label>
            <select
              className="w-full border rounded-lg p-2"
              onChange={(e) => onDeviceChange(e.target.value, 'video')}
            >
              {devices.videoinput.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Microphone Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Microphone
            </label>
            <select
              className="w-full border rounded-lg p-2"
              onChange={(e) => onDeviceChange(e.target.value, 'audio')}
            >
              {devices.audioinput.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export { VideoCall, IncomingCallDialog, CallSettings };