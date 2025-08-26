'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserConversations } from '@/lib/firebase-services';

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadConversations();
    }
  }, [user?.uid]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const convos = await getUserConversations(user!.uid);
      setConversations(convos);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p>Please sign in to view your messages.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        <p>Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      {conversations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No conversations yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium">
                  Conversation with {conversation.participants.filter(p => p !== user.uid).join(', ')}
                </div>
                <div className="text-sm text-gray-500">
                  {conversation.lastMessageTime.toLocaleDateString()}
                </div>
              </div>
              
              <div className="text-gray-600 text-sm mb-2">
                {conversation.lastMessage}
              </div>
              
              {conversation.unreadCount > 0 && (
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {conversation.unreadCount} unread
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
