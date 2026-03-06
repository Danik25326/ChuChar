import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Помилка', 'Паролі не співпадають');
      return;
    }
    try {
      const res = await axios.post('http://localhost:3000/api/auth/register', { username, password });
      await AsyncStorage.setItem('token', res.data.token);
      navigation.replace('Chats');
    } catch (err) {
      Alert.alert('Помилка', err.response?.data?.error || 'Помилка реєстрації');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ChuChar</Text>
      <TextInput
        style={styles.input}
        placeholder="Ім'я користувача"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Пароль"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Підтвердьте пароль"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <Button title="Зареєструватись" onPress={handleRegister} />
      <Button title="Вже є акаунт? Увійти" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 }
});
