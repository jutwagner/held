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
  markConversationAsRead 
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
      if (!currentConversationId) {
        // Create new conversation if none exists
        const conversation = await createConversation({
          participants: [user.uid, 'jutwagner'], // Hardcoded for now
          lastMessage: newMessage,
          lastMessageTime: new Date(),
          unreadCount: 1
        });
        setCurrentConversationId(conversation.id);
      }

      await sendMessage({
        conversationId: currentConversationId!,
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
      <DialogContent className="max-w-md h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Direct Message</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.senderId === user?.uid
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.createdAt.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={loading}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={loading || !newMessage.trim()}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
