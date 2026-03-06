import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function ChatsScreen({ navigation }) {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const fetchChats = async () => {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/chats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(res.data);
    };
    fetchChats();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() => navigation.navigate('Chat', { chatId: item.id })}
          >
            <Text>{item.name || `Чат #${item.id}`}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  chatItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' }
});
