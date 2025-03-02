// src/components/chat/ChatWindow.tsx

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Paperclip, Image, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUpload, FilePreview, FileMessage, FileList } from './components';
import { Entrepreneur, Funder } from '@/types/user';

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  hasFiles?: boolean;
  files?: any[];
}

interface ChatWindowProps {
  participant: Entrepreneur | Funder;
  onBack?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ participant, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [isShowingFiles, setIsShowingFiles] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Handle keyboard events on mobile
  useEffect(() => {
    if (!isMobile) return;

    const handleKeyboardShow = () => {
      // Use viewport height to detect keyboard
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const keyboardHeight = window.innerHeight - viewportHeight;
      setKeyboardHeight(keyboardHeight);
      setTimeout(scrollToBottom, 100); // Scroll after layout updates
    };

    const handleKeyboardHide = () => {
      setKeyboardHeight(0);
    };

    // Listen for viewport changes (keyboard show/hide)
    window.visualViewport?.addEventListener('resize', handleKeyboardShow);
    window.addEventListener('focusout', handleKeyboardHide);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleKeyboardShow);
      window.removeEventListener('focusout', handleKeyboardHide);
    };
  }, [isMobile]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages/${participant.id}`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data);
        scrollToBottom();
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Error loading messages');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [participant.id]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:8080');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'NEW_MESSAGE':
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
        break;
      case 'TYPING_STATUS':
        setIsTyping(data.isTyping);
        break;
      // Handle other message types
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() && files.length === 0) return;

    const tempId = Date.now().toString();
    const tempMessage: Message = {
      id: tempId,
      content: newMessage,
      senderId: 'currentUser',
      timestamp: new Date().toISOString(),
      status: 'sending'
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    scrollToBottom();

    try {
      // If there are files, upload them first
      if (files.length > 0) {
        await uploadFiles();
      }

      const response = await fetch(`/api/messages/${participant.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const sentMessage = await response.json();
      setMessages(prev => 
        prev.map(msg => msg.id === tempId ? sentMessage : msg)
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error state for failed message
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? { ...msg, status: 'error' as Message['status'] }
            : msg
        )
      );
    }
  };

  const handleFilesSelected = async (selectedFiles: File[]) => {
    // Update files state
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/chat/${participant.id}/files`);
      
      // Add auth token
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(prev => ({
            ...prev,
            [files[0].name]: progress // Simplifying to track overall progress
          }));
        }
      };

      // Handle response
      xhr.onload = async () => {
        if (xhr.status === 200) {
          const uploadedFiles = JSON.parse(xhr.responseText);
          // Files are attached to message via backend
          setFiles([]);
          setUploadProgress({});
        } else {
          throw new Error('Upload failed');
        }
      };

      xhr.onerror = () => {
        throw new Error('Upload failed');
      };

      xhr.send(formData);
    } catch (error) {
      console.error('Error uploading files:', error);
      setError('Error uploading files');
    }
  };

  const handleDownloadFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/chat/files/${fileId}`);
      if (!response.ok) throw new Error('Failed to get download URL');
      
      const { url } = await response.json();
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Error downloading file');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center">
        {isMobile && onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <img
          src={participant.photo}
          alt="Profile"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="ml-3">
          <h3 className="font-semibold">
            {participant.type === 'entrepreneur'
              ? (participant as Entrepreneur).projectName
              : (participant as Funder).name}
          </h3>
          {isTyping ? (
            <p className="text-sm text-blue-600">Typing...</p>
          ) : (
            <p className="text-sm text-gray-500">
              {participant.type === 'entrepreneur' ? 'Entrepreneur' : 'Funder'}
            </p>
          )}
        </div>
        <button
          onClick={() => setIsShowingFiles(!isShowingFiles)}
          className="text-gray-500 hover:text-gray-700 ml-auto"
        >
          {isShowingFiles ? 'Hide Files' : 'Show Files'}
        </button>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ paddingBottom: isMobile ? `${keyboardHeight}px` : undefined }}
      >
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.senderId === 'currentUser' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.hasFiles ? (
              <div className="space-y-2">
                {message.files.map((file: any) => (
                  <FileMessage
                    key={file.id}
                    file={file}
                    isOwn={message.senderId === 'currentUser'}
                    onDownload={() => handleDownloadFile(file.id)}
                  />
                ))}
                {message.content && (
                  <p className={`text-sm ${
                    message.senderId === 'currentUser'
                      ? 'text-gray-200'
                      : 'text-gray-500'
                  }`}>
                    {message.content}
                  </p>
                )}
              </div>
            ) : (
              <div
                className={`max-w-[70%] p-3 rounded-lg space-y-1 ${
                  message.senderId === 'currentUser'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border'
                }`}
              >
                <p className="break-words">{message.content}</p>
                <div className="flex items-center justify-end space-x-1">
                  <span className="text-xs opacity-75">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {message.senderId === 'currentUser' && (
                    <MessageStatusIcon status={message.status} />
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* File Upload Preview */}
      {files.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <div className="space-y-2">
            {files.map((file, index) => (
              <FilePreview
                key={index}
                file={file}
                onRemove={() => handleRemoveFile(index)}
                uploadProgress={uploadProgress[file.name]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSend} className="bg-white border-t p-4">
        <div className="flex items-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAttachmentOptions(true)}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 max-h-32 p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() && files.length === 0}
            className="px-4"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        {/* Hidden file input */}
        <FileUpload
          onUpload={handleFilesSelected}
          maxFiles={5}
        />
      </form>

      {/* Attachment Options Bottom Sheet */}
      <BottomSheet
        isOpen={showAttachmentOptions}
        onClose={() => setShowAttachmentOptions(false)}
        title="Add Attachment"
      >
        <div className="p-4 space-y-4">
          <button
            onClick={() => handleAttachment('image')}
            className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 rounded-lg"
          >
            <Image className="h-6 w-6 text-blue-600" />
            <span>Upload Image</span>
          </button>
          <button
            onClick={() => handleAttachment('file')}
            className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 rounded-lg"
          >
            <Paperclip className="h-6 w-6 text-blue-600" />
            <span>Upload File</span>
          </button>
        </div>
      </BottomSheet>

      {/* Files Sidebar */}
      {isShowingFiles && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l shadow-lg">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Shared Files</h3>
              <button
                onClick={() => setIsShowingFiles(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <FileList
              files={messages
                .filter(m => m.hasFiles)
                .flatMap(m => m.files)}
              onDownload={handleDownloadFile}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;