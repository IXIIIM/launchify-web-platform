// src/mobile/screens/HomeScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button } from '@/mobile/components/ui';
import { MatchCard } from '@/mobile/components/matches';
import { useAuth } from '@/mobile/hooks/useAuth';

const HomeScreen = ({ navigation }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/matches/potential');
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchRecommendations();
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <ScrollView
      className="bg-gray-50 flex-1"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4">
        <Card className="mb-6">
          <Text className="text-2xl font-bold mb-2">
            Welcome back, {user?.name}
          </Text>
          <Text className="text-gray-600">
            You have {recommendations.length} potential matches
          </Text>
        </Card>

        <View className="space-y-4">
          {recommendations.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              onPress={() => navigation.navigate('UserProfile', { id: match.id })}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

// src/mobile/screens/MatchesScreen.tsx

import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Text, Tabs, TabView } from '@/mobile/components/ui';
import { MatchCard } from '@/mobile/components/matches';

const MatchesScreen = ({ navigation }) => {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <View className="flex-1 bg-white">
      <Tabs
        value={tabIndex}
        onChange={setTabIndex}
        items={['Pending', 'Connected', 'Archived']}
      />

      <TabView value={tabIndex}>
        <TabView.Item>
          <PendingMatches navigation={navigation} />
        </TabView.Item>
        <TabView.Item>
          <ConnectedMatches navigation={navigation} />
        </TabView.Item>
        <TabView.Item>
          <ArchivedMatches navigation={navigation} />
        </TabView.Item>
      </TabView>
    </View>
  );
};

// src/mobile/screens/MessagesScreen.tsx

import React from 'react';
import { View, FlatList } from 'react-native';
import { Text, Avatar, Divider } from '@/mobile/components/ui';
import { formatDistanceToNow } from 'date-fns';

const MessagesScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const renderItem = ({ item }) => (
    <View
      className="p-4 flex-row items-center"
      onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
    >
      <Avatar
        source={{ uri: item.participant.photo }}
        size="medium"
        className="mr-3"
      />
      <View className="flex-1">
        <Text className="font-semibold">{item.participant.name}</Text>
        <Text className="text-gray-500" numberOfLines={1}>
          {item.lastMessage?.content}
        </Text>
      </View>
      <Text className="text-xs text-gray-500">
        {formatDistanceToNow(new Date(item.lastMessage?.createdAt))}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={conversations}
      renderItem={renderItem}
      ItemSeparatorComponent={Divider}
      keyExtractor={item => item.id}
    />
  );
};

// src/mobile/screens/ChatScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, FlatList, KeyboardAvoidingView } from 'react-native';
import { Text, Input, Button } from '@/mobile/components/ui';
import { useAuth } from '@/mobile/hooks/useAuth';

const ChatScreen = ({ route }) => {
  const { conversationId } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage })
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const renderMessage = ({ item }) => (
    <View
      className={`p-3 rounded-lg mb-2 max-w-[80%] ${
        item.senderId === user.id
          ? 'bg-blue-500 self-end'
          : 'bg-gray-200 self-start'
      }`}
    >
      <Text
        className={item.senderId === user.id ? 'text-white' : 'text-gray-900'}
      >
        {item.content}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        inverted
      />
      <View className="p-4 border-t border-gray-200 flex-row">
        <Input
          className="flex-1 mr-2"
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
        />
        <Button onPress={sendMessage}>Send</Button>
      </View>
    </KeyboardAvoidingView>
  );
};

export { HomeScreen, MatchesScreen, MessagesScreen, ChatScreen };