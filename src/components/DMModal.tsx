'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, X } from 'lucide-react';
import { 
  createConversation, 
  sendMessage, 
  subscribeToMessages, 
  markConversationAsRead,
  findExistingConversation,
  setTypingStatus,
  subscribeToTypingIndicators,
  getUserDisplayName,
  subscribeToUserPresence
} from '@/lib/firebase-services';
import type { Conversation, Message } from '@/types';

interface DMModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  targetUserId?: string;
  targetUserName?: string;
}

export default function DMModal({ isOpen, onClose, conversationId, targetUserId, targetUserName }: DMModalProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [typingUserNames, setTypingUserNames] = useState<{[userId: string]: string}>({});
  const [targetUserOnline, setTargetUserOnline] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && currentConversationId && user) {
      // Mark conversation as read when opened
      markConversationAsRead(currentConversationId);
      
      // Subscribe to messages
      const unsubscribeMessages = subscribeToMessages(currentConversationId, (messages) => {
        setMessages(messages);
      });
      
      // Subscribe to typing indicators
      const unsubscribeTyping = subscribeToTypingIndicators(currentConversationId, user.uid, async (userIds) => {
        console.log('[DEBUG] Typing users changed:', userIds);
        setTypingUsers(userIds);
        
        // Fetch display names for typing users
        const names: {[userId: string]: string} = {};
        for (const userId of userIds) {
          names[userId] = await getUserDisplayName(userId);
        }
        console.log('[DEBUG] Typing user names:', names);
        setTypingUserNames(names);
      });
      
      return () => {
        unsubscribeMessages();
        unsubscribeTyping();
      };
    }
  }, [isOpen, currentConversationId, user]);

  // Subscribe to target user's presence
  useEffect(() => {
    if (isOpen && targetUserId) {
      const unsubscribePresence = subscribeToUserPresence(targetUserId, (isOnline) => {
        setTargetUserOnline(isOnline);
      });
      
      return unsubscribePresence;
    }
  }, [isOpen, targetUserId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    try {
      let conversationToUse = currentConversationId;
      
      if (!currentConversationId) {
        // First, try to find an existing conversation between these participants
        const participants = [user.uid, targetUserId || 'jutwagner'];
        const existingConversationId = await findExistingConversation(participants);
        
        if (existingConversationId) {
          // Use existing conversation
          conversationToUse = existingConversationId;
          setCurrentConversationId(existingConversationId);
        } else {
          // Create new conversation if none exists
          const conversation = await createConversation({
            participants,
            lastMessage: newMessage,
            lastMessageTime: new Date(),
            unreadCount: 1
          });
          conversationToUse = conversation.id;
          setCurrentConversationId(conversation.id);
        }
      }

      await sendMessage({
        conversationId: conversationToUse!,
        senderId: user.uid,
        text: newMessage,
        createdAt: new Date()
      });

      setNewMessage('');
      
      // Clear typing status after sending
      if (currentConversationId) {
        setTypingStatus(currentConversationId, user.uid, false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = () => {
    if (!currentConversationId || !user) return;
    
    console.log('[DEBUG] User is typing, setting status for:', user.uid, 'in conversation:', currentConversationId);
    
    // Set typing status
    setTypingStatus(currentConversationId, user.uid, true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      console.log('[DEBUG] Typing timeout, clearing status for:', user.uid);
      setTypingStatus(currentConversationId, user.uid, false);
    }, 3000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      handleTyping();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg h-[700px] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="text-white">
                <path d="M2 8l8 5 8-5M2 8v6a2 2 0 002 2h12a2 2 0 002-2V8l-8 5-8-5z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Direct Message</h3>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-500">Chat with @{targetUserName || targetUserId || 'user'}</p>
                <div className={`w-2 h-2 rounded-full ${targetUserOnline ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                <span className={`text-xs ${targetUserOnline ? 'text-green-600' : 'text-gray-500'}`}>
                  {targetUserOnline ? 'online' : 'offline'}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-gray-400">
                    <path d="M2 8l8 5 8-5M2 8v6a2 2 0 002 2h12a2 2 0 002-2V8l-8 5-8-5z" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  Send a message to @jutwagner to begin chatting
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-end space-x-2 max-w-xs">
                    {message.senderId !== user?.uid && (
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-white">
                          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                    )}
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-sm ${
                        message.senderId === user?.uid
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      <p className={`text-xs mt-2 ${
                        message.senderId === user?.uid ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {message.createdAt.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    {message.senderId === user?.uid && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="You" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-white">
                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="px-6 py-2 bg-gray-50 border-t">
              {console.log('[DEBUG] Rendering typing indicator for users:', typingUsers)}
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">
                  {typingUsers.length === 1 
                    ? `${typingUserNames[typingUsers[0]] || 'Someone'} is typing...`
                    : `${typingUsers.length} people are typing...`
                  }
                </span>
              </div>
            </div>
          )}
          
          {/* Input Area */}
          <div className="p-6 bg-white border-t">
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={loading}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <Button 
                onClick={handleSendMessage} 
                disabled={loading || !newMessage.trim()}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-2xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
