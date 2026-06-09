import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Modal, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import api from '../api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    const token = await AsyncStorage.getItem('token');
    const userData = await AsyncStorage.getItem('user');
    if (token && userData) {
      const user = JSON.parse(userData);
      if (user.role === 'admin' || user.role === 'super_admin') {
        navigation.replace('AdminHome');
      } else {
        navigation.replace('Home');
      }
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Silakan isi email dan password.');
      return;
    }
    try {
      const res = await api.post('/auth/login', { email, password });
      
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      
      if (res.data.user.role === 'admin' || res.data.user.role === 'super_admin') {
        navigation.replace('AdminHome');
      } else {
        navigation.replace('Onboarding', { role: res.data.user.role });
      }
    } catch (error) {
      Alert.alert('Error', 'Login gagal. Cek kembali email dan password Anda.');
    }
  };

  const handleGoogleLogin = async () => {
    if (!googleEmail || !googleEmail.includes('@')) {
      Alert.alert('Error', 'Masukkan email Google yang valid.');
      return;
    }
    setIsGoogleLoading(true);
    try {
      const res = await api.post('/auth/google-login', { email: googleEmail });
      
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      
      setShowGoogleModal(false);
      setGoogleEmail('');

      if (res.data.user.role === 'admin' || res.data.user.role === 'super_admin') {
        navigation.replace('AdminHome');
      } else {
        navigation.replace('Onboarding', { role: res.data.user.role });
      }
    } catch (error) {
      Alert.alert('Error', 'Login dengan Google gagal. Silakan coba lagi.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Text style={styles.title}>LaporPak</Text>
            <Text style={styles.subtitle}>Mari bersama bangun kota yang lebih baik.</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Email atau Nomor Telepon</Text>
            <View style={styles.inputWrapper}>
              <Feather name="user" size={20} color="#7AAACE" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan email atau no telp"
                placeholderTextColor="#7AAACE"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotPassword}>Lupa Password?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={20} color="#7AAACE" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan password"
                placeholderTextColor="#7AAACE"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#7AAACE" style={styles.iconRight} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
              <Text style={styles.loginBtnText}>Masuk</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>Atau masuk dengan</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialBtn} onPress={() => setShowGoogleModal(true)}>
              <FontAwesome5 name="google" size={18} color="#EA4335" style={styles.socialIcon} />
              <Text style={styles.socialBtnText}>Lanjutkan dengan Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}>Daftar sekarang</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Google Login Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showGoogleModal}
        onRequestClose={() => { setShowGoogleModal(false); setGoogleEmail(''); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome5 name="google" size={20} color="#EA4335" style={{ marginRight: 10 }} />
                <Text style={styles.modalTitle}>Masuk dengan Google</Text>
              </View>
              <TouchableOpacity onPress={() => { setShowGoogleModal(false); setGoogleEmail(''); }}>
                <Feather name="x" size={22} color="#999" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: '#777', marginBottom: 16 }}>Masukkan email Google Anda untuk melanjutkan.</Text>

            <View style={[styles.inputWrapper, { marginBottom: 16 }]}>
              <Feather name="mail" size={20} color="#7AAACE" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="email@gmail.com"
                placeholderTextColor="#7AAACE"
                value={googleEmail}
                onChangeText={setGoogleEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.googleSubmitBtn, (!googleEmail || isGoogleLoading) && { opacity: 0.5 }]}
              onPress={handleGoogleLogin}
              disabled={!googleEmail || isGoogleLoading}
            >
              <Text style={styles.googleSubmitBtnText}>
                {isGoogleLoading ? 'Memproses...' : 'Lanjutkan'}
              </Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 11, color: '#AAA', textAlign: 'center', marginTop: 12 }}>
              Jika email belum terdaftar, akun baru akan dibuat otomatis.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8F0',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  forgotPassword: {
    fontSize: 13,
    color: '#666',
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
  loginBtn: {
    backgroundColor: '#355872',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#DDD',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#888',
    fontSize: 13,
  },
  socialContainer: {
    gap: 12,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F8F0',
    borderRadius: 12,
    height: 52,
  },
  socialIcon: {
    marginRight: 12,
  },
  socialBtnText: {
    fontSize: 15,
    color: '#111',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  registerText: {
    color: '#355872',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Google Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#355872',
  },
  googleSubmitBtn: {
    backgroundColor: '#4285F4',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleSubmitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
