'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUser, subscribeToConversations } from '@/lib/firebase-services';
import type { Conversation, UserDoc } from '@/types';
import DMModal from '@/components/DMModal';
import { MessageCircle, User } from 'lucide-react';

export default function MessagesSection() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [participants, setParticipants] = useState<Record<string, UserDoc>>({});
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToConversations(user.uid, (conversations) => {
      setConversations(conversations);
      
      // Fetch participant data for each conversation
      conversations.forEach(async (conversation) => {
        conversation.participants.forEach(async (participantId) => {
          if (participantId !== user.uid && !participants[participantId]) {
            const participant = await getUser(participantId);
            if (participant) {
              setParticipants(prev => ({
                ...prev,
                [participantId]: participant
              }));
            }
          }
        });
      });
    });

    return unsubscribe;
  }, [user?.uid]);

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsModalOpen(true);
  };

  const getOtherParticipant = (conversation: Conversation) => {
    const otherId = conversation.participants.find(id => id !== user?.uid);
    return otherId ? participants[otherId] : null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Messages</h2>
        <p className="text-gray-600">Manage your direct messages and conversations.</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Conversations</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No conversations yet</p>
              <p className="text-sm">Start a conversation to see your messages here.</p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              return (
                <div
                  key={conversation.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleConversationClick(conversation)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {otherParticipant?.avatarUrl ? (
                        <img
                          src={otherParticipant.avatarUrl}
                          alt={otherParticipant.displayName}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {otherParticipant?.displayName || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-gray-500">
                        {conversation.lastMessageTime.toLocaleDateString()}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <div className="mt-1">
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <DMModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        conversationId={selectedConversation?.id}
      />
    </div>
  );
}
