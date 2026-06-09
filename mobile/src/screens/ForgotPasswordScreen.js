import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import api from '../api';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Silakan isi semua kolom.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Password baru dan konfirmasi password tidak cocok.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password minimal terdiri dari 6 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email, newPassword });
      Alert.alert('Sukses', 'Password berhasil diperbarui! Silakan masuk kembali.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Gagal mengatur ulang sandi. Pastikan email Anda benar.';
      Alert.alert('Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>

        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#355872" />
            <Text style={styles.backText}>Kembali ke Masuk</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>LaporPak</Text>
            <Text style={styles.subtitle}>Atur ulang password akun Anda.</Text>
          </View>

          <View style={styles.formContainer}>
            
            {/* Email Field */}
            <Text style={styles.label}>Email Terdaftar</Text>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={20} color="#7AAACE" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan email terdaftar"
                placeholderTextColor="#7AAACE"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Password Baru Field */}
            <Text style={styles.label}>Password Baru</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={20} color="#7AAACE" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan password baru"
                placeholderTextColor="#7AAACE"
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#7AAACE" style={styles.iconRight} />
              </TouchableOpacity>
            </View>

            {/* Konfirmasi Password Baru Field */}
            <Text style={styles.label}>Konfirmasi Password Baru</Text>
            <View style={styles.inputWrapper}>
              <Feather name="shield" size={20} color="#7AAACE" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Konfirmasi password baru"
                placeholderTextColor="#7AAACE"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={[styles.resetBtn, isLoading && styles.btnDisabled]} 
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              <Text style={styles.resetBtnText}>{isLoading ? 'Memproses...' : 'Ubah Password'}</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8F0',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  backText: {
    fontSize: 14,
    color: '#355872',
    fontWeight: '600',
    marginLeft: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#355872',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
  },
  formContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  icon: {
    marginRight: 12,
  },
  iconRight: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  resetBtn: {
    backgroundColor: '#355872',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  resetBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
