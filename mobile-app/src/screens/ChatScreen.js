import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import axios from 'axios';

export default function ChatScreen({ route }) {
  const { chatId } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socketRef = useRef();

  useEffect(() => {
    const setupSocket = async () => {
      const token = await AsyncStorage.getItem('token');
      socketRef.current = io('http://localhost:3000', {
        auth: { token }
      });

      socketRef.current.on('new-message', (message) => {
        setMessages(prev => [...prev, message]);
      });

      socketRef.current.emit('join-chats', [chatId]);
    };

    const fetchMessages = async () => {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`http://localhost:3000/api/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    };

    setupSocket();
    fetchMessages();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [chatId]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socketRef.current.emit('send-message', { chatId, content: input });
    setInput('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.message}>
            <Text style={styles.username}>{item.username}:</Text>
            <Text style={styles.content}>{item.content}</Text>
          </View>
        )}
        style={styles.messagesList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Повідомлення"
        />
        <Button title="Відправити" onPress={sendMessage} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messagesList: { flex: 1, padding: 10 },
  message: { flexDirection: 'row', marginBottom: 5 },
  username: { fontWeight: 'bold', marginRight: 5 },
  content: { flex: 1 },
  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderColor: '#ccc' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 8, marginRight: 10, borderRadius: 5 }
});
