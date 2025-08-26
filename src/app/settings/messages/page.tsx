'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserConversations, getMessages, sendMessage, getUserDisplayName } from '@/lib/firebase-services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: Date;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.uid) {
      loadConversations();
    }
  }, [user?.uid]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const convos = await getUserConversations(user!.uid);
      
      // Ensure all timestamps are properly converted
      const processedConvos = convos.map(convo => ({
        ...convo,
        lastMessageTime: convo.lastMessageTime instanceof Date ? convo.lastMessageTime : new Date(),
        unreadCount: typeof convo.unreadCount === 'number' ? convo.unreadCount : 0,
      }));
      
      // Get display names for all participants
      const allParticipants = new Set<string>();
      processedConvos.forEach(convo => {
        convo.participants.forEach(p => {
          if (p !== user!.uid) allParticipants.add(p);
        });
      });
      
      const namePromises = Array.from(allParticipants).map(async (userId) => {
        const displayName = await getUserDisplayName(userId);
        return { userId, displayName };
      });
      
      const nameResults = await Promise.all(namePromises);
      const names: Record<string, string> = {};
      nameResults.forEach(({ userId, displayName }) => {
        names[userId] = displayName;
      });
      
      setParticipantNames(names);
      setConversations(processedConvos);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      const msgs = await getMessages(conversationId);
      
      // Ensure timestamps are converted
      const processedMsgs = msgs.map(msg => ({
        ...msg,
        createdAt: msg.createdAt instanceof Date ? msg.createdAt : new Date(),
      }));
      setMessages(processedMsgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user || sending) return;

    try {
      setSending(true);
      await sendMessage({
        conversationId: selectedConversation.id,
        senderId: user.uid,
        text: newMessage.trim(),
        createdAt: new Date(),
      });
      
      setNewMessage('');
      // Reload messages to show the new one
      await loadMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return formatTime(date);
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p>Please sign in to view your messages.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        <p>Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg border border-gray-200 h-[600px] flex">
        {/* Conversations List */}
        <div className={`${selectedConversation ? 'hidden md:block' : 'block'} w-full md:w-1/3 border-r border-gray-200`}>
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold">Messages</h1>
          </div>
          
          <div className="overflow-y-auto h-full">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No conversations yet.
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium text-sm">
                      {conversation.participants.filter(p => p !== user.uid).map(participantId => 
                        participantNames[participantId] || participantId
                      ).join(', ') || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(conversation.lastMessageTime)}
                    </div>
                  </div>
                  
                  <div className="text-gray-600 text-sm truncate mb-1">
                    {conversation.lastMessage || 'No messages yet'}
                  </div>
                  
                  {conversation.unreadCount > 0 && (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {conversation.unreadCount} unread
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messages View */}
        <div className={`${selectedConversation ? 'block' : 'hidden md:block'} w-full md:w-2/3 flex flex-col`}>
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConversation(null)}
                  className="mr-2 md:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="font-semibold">
                  {selectedConversation.participants.filter(p => p !== user.uid).map(participantId => 
                    participantNames[participantId] || participantId
                  ).join(', ') || 'Unknown'}
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="text-center text-gray-500">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
                ) : (
                  (() => {
                    // Group consecutive messages from the same sender
                    const groupedMessages = [];
                    let currentGroup = null;

                    messages.forEach((message, index) => {
                      const isFromSameSender = currentGroup && currentGroup.senderId === message.senderId;
                      const timeDiff = currentGroup ? 
                        Math.abs(message.createdAt.getTime() - currentGroup.messages[currentGroup.messages.length - 1].createdAt.getTime()) / (1000 * 60) : 0;
                      
                      // Group consecutive messages from the same sender
                      // Allow up to 4 hours between messages
                      const shouldGroup = isFromSameSender && timeDiff <= 240;
                      
                      if (shouldGroup) {
                        currentGroup.messages.push(message);
                      } else {
                        if (currentGroup) {
                          groupedMessages.push(currentGroup);
                        }
                        currentGroup = {
                          senderId: message.senderId,
                          messages: [message]
                        };
                      }
                    });

                    if (currentGroup) {
                      groupedMessages.push(currentGroup);
                    }



                    return groupedMessages.map((group, groupIndex) => (
                      <div
                        key={`group-${groupIndex}`}
                        className={`flex ${group.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="max-w-xs lg:max-w-md space-y-1">
                          {group.messages.map((message, messageIndex) => (
                            <div
                              key={message.id}
                              className={`px-4 py-2 rounded-lg ${
                                group.senderId === user.uid
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-800'
                              } ${
                                // Add different border radius for grouped messages
                                group.messages.length > 1 
                                  ? messageIndex === 0 
                                    ? group.senderId === user.uid ? 'rounded-br-md' : 'rounded-bl-md'
                                    : messageIndex === group.messages.length - 1 
                                    ? group.senderId === user.uid ? 'rounded-tr-md' : 'rounded-tl-md'
                                    : group.senderId === user.uid ? 'rounded-r-md' : 'rounded-l-md'
                                  : ''
                              }`}
                            >
                              <div className="text-sm">{message.text}</div>
                              {/* Only show timestamp on the last message of each group */}
                              {messageIndex === group.messages.length - 1 && (
                                <div
                                  className={`text-xs mt-1 ${
                                    group.senderId === user.uid ? 'text-blue-100' : 'text-gray-500'
                                  }`}
                                >
                                  {formatTime(message.createdAt)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-3"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
