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
  findExistingConversation
} from '@/lib/firebase-services';
import type { Conversation, Message } from '@/types';

interface DMModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
}

export default function DMModal({ isOpen, onClose, conversationId }: DMModalProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && currentConversationId) {
      // Mark conversation as read when opened
      markConversationAsRead(currentConversationId);
      
      // Subscribe to messages
      const unsubscribe = subscribeToMessages(currentConversationId, (messages) => {
        setMessages(messages);
      });
      
      return unsubscribe;
    }
  }, [isOpen, currentConversationId]);

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
        const participants = [user.uid, 'jutwagner']; // Hardcoded for now
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
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
              <p className="text-sm text-gray-500">Chat with @jutwagner</p>
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
          
          {/* Input Area */}
          <div className="p-6 bg-white border-t">
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
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
