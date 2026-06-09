import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Platform, Modal, TextInput, ScrollView, Alert, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api, { API_URL } from '../api';

const IMG_URL = API_URL;

export default function AdminHomeScreen({ navigation }) {
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [responseMsg, setResponseMsg] = useState('');
  const [deleteResponseConfirmId, setDeleteResponseConfirmId] = useState(null);

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Settings / Admin Profile Edit States
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ email: '', password: '' });
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profilePreviewUri, setProfilePreviewUri] = useState(null);

  const pickProfileImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImageFile(result.assets[0]);
      setProfilePreviewUri(result.assets[0].uri);
    }
  };

  // Live Chat States
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [isChatActive, setIsChatActive] = useState(false);

  useEffect(() => {
    fetchComplaints();
    fetchUsers();
    getUserData();

    // Background auto-polling for true real-time reactivity without reload!
    const pollInterval = setInterval(() => {
      fetchComplaints();
      fetchUsers();
    }, 5000);

    const unsubscribe = navigation.addListener('focus', () => {
      fetchComplaints();
      fetchUsers();
      getUserData();
    });
    return () => {
      clearInterval(pollInterval);
      unsubscribe();
    };
  }, [navigation]);

  const fetchChatRooms = async () => {
    try {
      const res = await api.get('/chats/rooms');
      setChatRooms(res.data);
    } catch (error) {
      console.error('Gagal mengambil daftar room chat:', error);
      if (error.response?.status === 401) logout();
    }
  };

  const fetchRoomMessages = async (roomId) => {
    try {
      const res = await api.get(`/chats/messages?room_id=${roomId}`);
      setChatMessages(res.data);
    } catch (error) {
      console.error('Gagal mengambil pesan room:', error);
      if (error.response?.status === 401) logout();
    }
  };

  const handleSendAdminChatMessage = async () => {
    if (!selectedRoomId || !adminChatInput.trim()) return;

    try {
      await api.post('/chats/messages', { 
        room_id: selectedRoomId, 
        message: adminChatInput 
      });
      setAdminChatInput('');
      fetchRoomMessages(selectedRoomId);
      fetchChatRooms();
    } catch (error) {
      console.error('Gagal mengirim pesan:', error);
    }
  };

  // Poll Chat Rooms when activeTab is 'chat'
  useEffect(() => {
    if (activeTab !== 'chat') return;

    fetchChatRooms();
    const roomsInterval = setInterval(() => {
      fetchChatRooms();
    }, 5000); // 5s room list polling

    return () => clearInterval(roomsInterval);
  }, [activeTab]);

  // Poll Messages when room is selected and activeTab is 'chat'
  useEffect(() => {
    if (activeTab !== 'chat' || !selectedRoomId) return;

    fetchRoomMessages(selectedRoomId);
    const msgsInterval = setInterval(() => {
      fetchRoomMessages(selectedRoomId);
    }, 3000); // 3s message polling

    return () => clearInterval(msgsInterval);
  }, [activeTab, selectedRoomId]);

  const getUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (e) {
      console.log(e);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints');
      setComplaints(res.data);
    } catch (error) {
      console.log(error);
      if (error.response?.status === 401) logout();
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      console.log(error);
      if (error.response?.status === 401) logout();
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  const handleEditProfile = async () => {
    if (!editProfileData.email && !editProfileData.password && !profileImageFile) {
      Alert.alert('Info', 'Tidak ada perubahan yang disimpan');
      return;
    }

    setIsSubmittingProfile(true);
    try {
      const formData = new FormData();
      if (editProfileData.email) {
        formData.append('email', editProfileData.email);
      }
      if (editProfileData.password) {
        formData.append('password', editProfileData.password);
      }

      if (profileImageFile) {
        const localUri = profileImageFile.uri;
        const filename = localUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const fileType = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('profile_image', {
          uri: localUri,
          name: filename,
          type: fileType,
        });
      }

      const res = await api.put('/users/profile', formData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Sukses', 'Profil Admin berhasil diperbarui!');

      // Update AsyncStorage and State
      const updatedUser = {
        ...currentUser,
        ...(editProfileData.email ? { email: editProfileData.email } : {}),
        ...(res.data.profile_image ? { profile_image: res.data.profile_image } : {})
      };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      setIsEditProfileModalOpen(false);
      setProfileImageFile(null);
      setProfilePreviewUri(null);
      setEditProfileData({ email: '', password: '' });
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal memperbarui profil admin';
      Alert.alert('Error', msg);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // Admin Actions
  const updateStatus = async (id, status) => {
    try {
      await api.put(`/complaints/${id}/status`, { status });
      fetchComplaints();
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint({ ...selectedComplaint, status });
      }
      Alert.alert('Sukses', `Status diubah menjadi ${status}`);
    } catch (error) {
      Alert.alert('Error', 'Gagal update status');
    }
  };

  const submitResponse = async () => {
    if (!selectedComplaint || !responseMsg.trim()) return;
    try {
      await api.post('/responses', { complaint_id: selectedComplaint.id, message: responseMsg });
      setResponseMsg('');
      const res = await api.get(`/complaints/${selectedComplaint.id}`);
      setSelectedComplaint(res.data);
      fetchComplaints();
      Alert.alert('Sukses', 'Tanggapan berhasil dikirim');
    } catch (error) {
      Alert.alert('Error', 'Gagal mengirim tanggapan');
    }
  };

  const deleteResponse = (responseId) => {
    setDeleteResponseConfirmId(responseId);
  };

  const executeDeleteResponse = async (responseId) => {
    try {
      await api.delete(`/responses/${responseId}`);
      Alert.alert('Sukses', 'Tanggapan berhasil dihapus');
      if (selectedComplaint) {
        const res = await api.get(`/complaints/${selectedComplaint.id}`);
        setSelectedComplaint(res.data);
      }
      fetchComplaints();
    } catch (error) {
      Alert.alert('Error', 'Gagal menghapus tanggapan');
    }
  };

  const handleDeleteComplaint = async (id) => {
    Alert.alert('Hapus', 'Yakin hapus laporan ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/complaints/${id}`);
          setSelectedComplaint(null);
          fetchComplaints();
        } catch (err) {
          Alert.alert('Error', 'Gagal hapus laporan');
        }
      }}
    ]);
  };

  const handleDeleteUser = async (id) => {
    Alert.alert('Hapus User', 'Yakin ingin menghapus pengguna ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/users/${id}`);
          fetchUsers();
          Alert.alert('Sukses', 'Pengguna berhasil dihapus');
        } catch (err) {
          Alert.alert('Error', err.response?.data?.message || 'Gagal menghapus pengguna');
        }
      }}
    ]);
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      Alert.alert('Error', 'Mohon lengkapi semua field');
      return;
    }
    setIsSubmittingUser(true);
    try {
      await api.post('/users', newUser);
      Alert.alert('Sukses', 'Pengguna berhasil ditambahkan!');
      setIsAddUserModalOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'admin' });
      fetchUsers();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Gagal menambahkan pengguna');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Computed
  const totalPending = complaints.filter(c => c.status === 'pending').length;
  const totalResolved = complaints.filter(c => c.status === 'done' || c.status === 'approved').length;
  const totalProcess = complaints.filter(c => c.status === 'process').length;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'done':
      case 'approved':
        return { bg: '#9CD5FF', text: '#355872', label: 'Resolved' };
      case 'process':
        return { bg: '#FFF4E0', text: '#D98A2C', label: 'In Progress' };
      case 'rejected':
        return { bg: '#7AAACE', text: '#D9534F', label: 'Rejected' };
      default:
        return { bg: '#F2F2F2', text: '#7AAACE', label: 'Pending' };
    }
  };

  const renderDashboard = () => (
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.tabContent}>
      <Text style={styles.pageTitle}>Analytics Overview</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Feather name="file-text" size={24} color="#355872" />
          <Text style={styles.statNum}>{complaints.length}</Text>
          <Text style={styles.statLabel}>TOTAL REPORTS</Text>
        </View>
        <View style={styles.statBox}>
          <Feather name="clock" size={24} color="#D98A2C" />
          <Text style={styles.statNum}>{totalPending}</Text>
          <Text style={styles.statLabel}>PENDING</Text>
        </View>
        <View style={styles.statBox}>
          <Feather name="check-circle" size={24} color="#355872" />
          <Text style={styles.statNum}>{totalResolved}</Text>
          <Text style={styles.statLabel}>RESOLVED</Text>
        </View>
        <View style={styles.statBox}>
          <Feather name="users" size={24} color="#1D4ED8" />
          <Text style={styles.statNum}>{users.length}</Text>
          <Text style={styles.statLabel}>TOTAL USERS</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {complaints.slice(0, 5).map((item) => {
        const st = getStatusStyle(item.status);
        return (
          <TouchableOpacity key={item.id} style={styles.recentItem} onPress={() => openComplaintDetail(item)}>
            <View style={styles.recentIcon}>
              <Feather name="file-text" size={18} color="#355872" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.recentSub} numberOfLines={1}>{item.description}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
              <Text style={{ color: st.text, fontSize: 10, fontWeight: 'bold' }}>{st.label}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const openComplaintDetail = async (c) => {
    try {
      const res = await api.get(`/complaints/${c.id}`);
      setSelectedComplaint(res.data);
    } catch (e) {
      setSelectedComplaint(c); // Fallback to list data if fetch fails
    }
  };

  const renderReports = () => (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <Text style={styles.pageTitle}>Report Management</Text>
      </View>
      <FlatList keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        data={complaints}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        renderItem={({ item }) => {
          const st = getStatusStyle(item.status);
          return (
            <TouchableOpacity style={styles.reportCard} onPress={() => openComplaintDetail(item)}>
              <View style={styles.reportHeader}>
                <Text style={styles.reportId}>#LP-{item.id.toString().padStart(4, '0')}</Text>
                <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                  <Text style={{ color: st.text, fontSize: 10, fontWeight: 'bold' }}>{st.label}</Text>
                </View>
              </View>
              <Text style={styles.reportTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.reportDesc} numberOfLines={2}>{item.description}</Text>
              <View style={styles.reportFooter}>
                <View style={styles.reporterInfo}>
                  <View style={[styles.reporterAvatar, { overflow: 'hidden' }]}>
                    {item.user_profile_image ? (
                      <Image source={{ uri: `${IMG_URL}${item.user_profile_image}` }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <Text style={styles.reporterAvatarText}>{item.user_name?.[0]?.toUpperCase() || 'U'}</Text>
                    )}
                  </View>
                  <Text style={styles.reporterName}>{item.user_name}</Text>
                </View>
                <Text style={styles.reportDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  const renderUsers = () => (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.pageTitle}>User Management</Text>
        <TouchableOpacity style={styles.addUserBtn} onPress={() => setIsAddUserModalOpen(true)}>
          <Feather name="user-plus" size={16} color="#FFF" />
          <Text style={styles.addUserBtnText}>Add User</Text>
        </TouchableOpacity>
      </View>
      <FlatList keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        data={users}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={[styles.userAvatar, { overflow: 'hidden' }]}>
              {item.profile_image ? (
                <Image source={{ uri: `${IMG_URL}${item.profile_image}` }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={styles.userAvatarText}>{item.name?.[0]?.toUpperCase() || 'U'}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={[styles.roleBadge, item.role === 'super_admin' && { backgroundColor: '#FFEBE8' }]}>
                <Text style={[styles.roleText, item.role === 'super_admin' && { color: '#C53030' }]}>
                  {item.role.toUpperCase()}
                </Text>
              </View>
              {item.id !== currentUser?.id && (
                <TouchableOpacity onPress={() => handleDeleteUser(item.id)} style={styles.deleteUserBtn}>
                  <Feather name="trash-2" size={14} color="#D9534F" />
                  <Text style={styles.deleteUserText}>Hapus</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );

  const renderChat = () => (
    <View style={{ flex: 1, backgroundColor: '#F9FBF9' }}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#EBECE6', backgroundColor: '#FFF' }}>
        <Text style={styles.pageTitle}>Ruang Chat Warga</Text>
        <Text style={{ fontSize: 11, color: '#7AAACE', marginTop: 2, fontWeight: '500' }}>
          Kelola & respons langsung keluhan warga secara real-time.
        </Text>
      </View>

      <FlatList keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        data={chatRooms}
        keyExtractor={item => item.room_id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center', marginTop: 40 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#9CD5FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Feather name="message-square" size={30} color="#355872" />
            </View>
            <Text style={{ fontWeight: 'bold', color: '#355872', fontSize: 15, marginBottom: 4 }}>Obrolan Kosong</Text>
            <Text style={{ fontSize: 11, color: '#7AAACE', textAlign: 'center' }}>
              Tidak ada obrolan aktif dari warga saat ini.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const hasNewMsg = item.is_admin_reply === 0;
          return (
            <TouchableOpacity
              style={{
                backgroundColor: '#FFF',
                padding: 16,
                borderRadius: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#EBECE6',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1
              }}
              onPress={() => {
                setSelectedRoomId(item.room_id);
                fetchRoomMessages(item.room_id);
                setIsChatActive(true);
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#9CD5FF', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' }}>
                {item.user_profile_image ? (
                  <Image source={{ uri: `${IMG_URL}${item.user_profile_image}` }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text style={{ fontWeight: 'bold', color: '#355872', fontSize: 16 }}>
                    {item.user_name?.[0]?.toUpperCase() || 'W'}
                  </Text>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontWeight: 'bold', color: '#355872', fontSize: 14 }}>
                    {item.user_name}
                  </Text>
                  {item.last_message_time && (
                    <Text style={{ fontSize: 9, color: '#999', fontWeight: '500' }}>
                      {new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>
                <Text style={{ fontSize: 10, color: '#7AAACE', marginTop: 1, fontWeight: '500' }}>
                  {item.user_email}
                </Text>
                <Text 
                  style={{ fontSize: 12, color: hasNewMsg ? '#355872' : '#666', marginTop: 4, fontWeight: hasNewMsg ? 'bold' : '500' }}
                  numberOfLines={1}
                >
                  {item.last_message}
                </Text>
              </View>

              {hasNewMsg && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#355872', marginLeft: 8 }} />
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Admin Chat Overlay Modal */}
      <Modal
        animationType="slide"
        visible={isChatActive}
        onRequestClose={() => setIsChatActive(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FBF9' }}>
          <KeyboardAvoidingView 
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
        

            {/* Chat Header */}
            {/* Chat Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              backgroundColor: '#FFF',
              borderBottomWidth: 1,
              borderBottomColor: '#EBECE6'
            }}>
              <TouchableOpacity onPress={() => setIsChatActive(false)} style={{ padding: 4, marginRight: 8 }}>
                <Feather name="arrow-left" size={24} color="#355872" />
              </TouchableOpacity>

              {(() => {
                const activeRoom = chatRooms.find(r => r.room_id === selectedRoomId);
                return (
                  <>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#9CD5FF', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' }}>
                      {activeRoom?.user_profile_image ? (
                        <Image source={{ uri: `${IMG_URL}${activeRoom.user_profile_image}` }} style={{ width: '100%', height: '100%' }} />
                      ) : (
                        <Text style={{ color: '#355872', fontWeight: 'bold', fontSize: 14 }}>{activeRoom?.user_name?.[0]?.toUpperCase() || 'W'}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', color: '#355872', fontSize: 15 }}>
                        {activeRoom?.user_name || 'Chat Warga'}
                      </Text>
                      <Text style={{ fontSize: 10, color: '#7AAACE', fontWeight: '600' }}>
                        {activeRoom?.user_email}
                      </Text>
                    </View>
                  </>
                );
              })()}
            </View>

            <FlatList keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
              style={{ flex: 1 }}
              data={chatMessages}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isMe = item.is_admin_reply === 1;
                return (
                  <View style={{ flexDirection: 'row', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                    <View style={{
                      maxWidth: '85%',
                      backgroundColor: isMe ? '#355872' : '#FFF',
                      padding: 12,
                      borderRadius: 16,
                      borderTopRightRadius: isMe ? 0 : 16,
                      borderTopLeftRadius: isMe ? 16 : 0,
                      borderWidth: isMe ? 0 : 1,
                      borderColor: '#EBECE6',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1
                    }}>
                      {!isMe && (
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#355872', marginBottom: 2, textTransform: 'uppercase' }}>
                          {item.sender_name}
                        </Text>
                      )}
                      <Text style={{ fontSize: 13, color: isMe ? '#FFF' : '#333', lineHeight: 18 }}>
                        {item.message}
                      </Text>
                      <Text style={{ fontSize: 9, color: isMe ? '#9CD5FF' : '#999', textAlign: 'right', marginTop: 4 }}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />

            {/* Input Footer */}
            <View style={{
              padding: 12,
              backgroundColor: '#FFF',
              borderTopWidth: 1,
              borderTopColor: '#EBECE6',
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: '#F9FBF9',
                  borderWidth: 1,
                  borderColor: '#EBECE6',
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  fontSize: 13,
                  color: '#333',
                  marginRight: 10,
                  maxHeight: 80
                }}
                placeholder="Ketik balasan untuk warga..."
                placeholderTextColor="#A0A0A0"
                value={adminChatInput}
                onChangeText={setAdminChatInput}
                multiline
              />
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#355872',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#355872',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 3,
                  elevation: 3
                }}
                onPress={handleSendAdminChatMessage}
              >
                <Feather name="send" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          
          
      </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.hamburgerBtn}>
            <Feather name="menu" size={24} color="#355872" />
          </TouchableOpacity>
          <View style={styles.logoIcon}>
            <Feather name="shield" size={20} color="#FFF" />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.logo}>Admin Panel</Text>
            <Text style={styles.logoSub}>{currentUser?.role === 'super_admin' ? 'Super Admin' : 'Admin System'}</Text>
          </View>
        </View>
        
        {/* Right side profile avatar button */}
        <TouchableOpacity 
          style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#9CD5FF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#355872' }} 
          onPress={() => setIsSidebarOpen(true)}
        >
          {currentUser?.profile_image ? (
            <Image 
              source={{ uri: `${IMG_URL}${currentUser.profile_image}` }} 
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <Text style={{ color: '#355872', fontWeight: 'bold', fontSize: 13 }}>{currentUser?.name?.[0]?.toUpperCase() || 'A'}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'reports' && renderReports()}
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'chat' && renderChat()}

      {/* Sidebar Overlay (Drawer) */}
      {isSidebarOpen && (
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity style={styles.sidebarCloseArea} onPress={() => setIsSidebarOpen(false)} activeOpacity={1} />
          <View style={styles.sidebar}>
            
            <View style={styles.sidebarHeader}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#9CD5FF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                {currentUser?.profile_image && currentUser?.role !== 'super_admin' ? (
                  <Image source={{ uri: `${IMG_URL}${currentUser.profile_image}` }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text style={{ color: '#355872', fontWeight: 'bold', fontSize: 18 }}>{currentUser?.name?.[0]?.toUpperCase() || 'A'}</Text>
                )}
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[styles.logo, { fontSize: 15 }]} numberOfLines={1}>{currentUser?.name || 'Admin Panel'}</Text>
                <Text style={styles.logoSub}>{currentUser?.role === 'super_admin' ? 'Super Admin' : 'Admin System'}</Text>
              </View>
            </View>

            <View style={styles.sidebarNav}>
              <TouchableOpacity style={[styles.sidebarNavItem, activeTab === 'dashboard' && styles.sidebarNavItemActive]} onPress={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}>
                <Feather name="grid" size={20} color={activeTab === 'dashboard' ? '#355872' : '#7AAACE'} />
                <Text style={[styles.sidebarNavText, activeTab === 'dashboard' && styles.sidebarNavTextActive]}>Dashboard</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.sidebarNavItem, activeTab === 'reports' && styles.sidebarNavItemActive]} onPress={() => { setActiveTab('reports'); setIsSidebarOpen(false); }}>
                <Feather name="file-text" size={20} color={activeTab === 'reports' ? '#355872' : '#7AAACE'} />
                <Text style={[styles.sidebarNavText, activeTab === 'reports' && styles.sidebarNavTextActive]}>Reports</Text>
              </TouchableOpacity>

              {(currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && (
                <TouchableOpacity style={[styles.sidebarNavItem, activeTab === 'users' && styles.sidebarNavItemActive]} onPress={() => { setActiveTab('users'); setIsSidebarOpen(false); }}>
                  <Feather name="users" size={20} color={activeTab === 'users' ? '#355872' : '#7AAACE'} />
                  <Text style={[styles.sidebarNavText, activeTab === 'users' && styles.sidebarNavTextActive]}>Users</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={[styles.sidebarNavItem, activeTab === 'chat' && styles.sidebarNavItemActive]} onPress={() => { setActiveTab('chat'); setIsSidebarOpen(false); }}>
                <Feather name="message-square" size={20} color={activeTab === 'chat' ? '#355872' : '#7AAACE'} />
                <Text style={[styles.sidebarNavText, activeTab === 'chat' && styles.sidebarNavTextActive]}>Live Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.sidebarNavItem} 
                onPress={() => { 
                  setEditProfileData({ email: currentUser?.email || '', password: '' });
                  setIsEditProfileModalOpen(true);
                  setIsSidebarOpen(false); 
                }}
              >
                <Feather name="settings" size={20} color="#7AAACE" />
                <Text style={styles.sidebarNavText}>Settings</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.sidebarLogoutBtn} onPress={logout}>
                <Feather name="log-out" size={20} color="#D9534F" />
                <Text style={styles.sidebarLogoutText}>Logout</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      )}

      {/* Detail Modal */}
      <Modal visible={!!selectedComplaint} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setSelectedComplaint(null)}>
        {selectedComplaint && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Laporan</Text>
              <TouchableOpacity onPress={() => setSelectedComplaint(null)} style={styles.closeBtn}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" style={{ flex: 1, padding: 16 }}>
              {/* Status Controls */}
              <View style={styles.statusControlCard}>
                <Text style={styles.controlLabel}>UPDATE STATUS</Text>
                <View style={styles.statusButtons}>
                  <TouchableOpacity onPress={() => updateStatus(selectedComplaint.id, 'pending')} style={[styles.statusBtn, selectedComplaint.status === 'pending' && styles.statusBtnActive]}>
                    <Text style={[styles.statusBtnText, selectedComplaint.status === 'pending' && styles.statusBtnTextActive]}>Pending</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => updateStatus(selectedComplaint.id, 'process')} style={[styles.statusBtn, selectedComplaint.status === 'process' && styles.statusBtnActiveProc]}>
                    <Text style={[styles.statusBtnText, selectedComplaint.status === 'process' && styles.statusBtnTextActive]}>In Progress</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => updateStatus(selectedComplaint.id, 'done')} style={[styles.statusBtn, selectedComplaint.status === 'done' && styles.statusBtnActiveDone]}>
                    <Text style={[styles.statusBtnText, selectedComplaint.status === 'done' && styles.statusBtnTextActive]}>Resolved</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Details */}
              <Text style={styles.detailTitle}>{selectedComplaint.title}</Text>
              <Text style={styles.detailDesc}>{selectedComplaint.description}</Text>
              
              {selectedComplaint.image && (
                (() => {
                  const images = selectedComplaint.image.split(',');
                  if (images.length === 1) {
                    return <Image source={{ uri: `${IMG_URL}${images[0]}` }} style={styles.detailImage} />;
                  }
                  return (
                    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                      {images.map((imgUrl, index) => (
                        <Image 
                          key={index}
                          source={{ uri: `${IMG_URL}${imgUrl}` }} 
                          style={[styles.detailImage, { width: 300, marginRight: 10, marginBottom: 0 }]} 
                        />
                      ))}
                    </ScrollView>
                  );
                })()
              )}

              {/* Responses */}
              <Text style={styles.sectionTitle}>Tanggapan Resmi</Text>
              {selectedComplaint.responses && selectedComplaint.responses.length > 0 ? (
                selectedComplaint.responses.map((resp, idx) => (
                  <View key={idx} style={styles.responseBubble}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#355872', marginRight: 8 }}>{resp.admin_name}</Text>
                        <Text style={styles.respDate}>{new Date(resp.created_at).toLocaleDateString()}</Text>
                      </View>
                      {currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
                        <TouchableOpacity onPress={() => deleteResponse(resp.id)} style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
                          <Text style={{ color: '#D9534F', fontWeight: 'bold', fontSize: 12 }}>Hapus</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.respText}>{resp.message}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: 'gray', fontStyle: 'italic', marginBottom: 16 }}>Belum ada tanggapan.</Text>
              )}

              {/* Add Response Form */}
              <View style={styles.addResponseCard}>
                <Text style={styles.controlLabel}>TAMBAH TANGGAPAN</Text>
                <TextInput 
                  style={styles.responseInput} 
                  placeholder="Ketik tanggapan resmi..." 
                  multiline 
                  value={responseMsg}
                  onChangeText={setResponseMsg}
                />
                <TouchableOpacity style={styles.submitRespBtn} onPress={submitResponse}>
                  <Text style={styles.submitRespText}>Kirim Tanggapan</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteComplaint(selectedComplaint.id)}>
                <Feather name="trash-2" size={18} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: 'bold', marginLeft: 8 }}>Hapus Laporan Ini</Text>
              </TouchableOpacity>
              
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Add User Modal */}
      <Modal visible={isAddUserModalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsAddUserModalOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tambah Pengguna Baru</Text>
            <TouchableOpacity onPress={() => setIsAddUserModalOpen(false)} style={styles.closeBtn}>
              <Feather name="x" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" style={{ flex: 1, padding: 20 }}>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NAMA LENGKAP</Text>
              <TextInput 
                style={styles.textInput}
                placeholder="Contoh: Admin Desa"
                value={newUser.name}
                onChangeText={t => setNewUser({...newUser, name: t})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <TextInput 
                style={styles.textInput}
                placeholder="admin@laporpak.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={newUser.email}
                onChangeText={t => setNewUser({...newUser, email: t})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput 
                style={styles.textInput}
                placeholder="Minimal 6 karakter"
                secureTextEntry
                value={newUser.password}
                onChangeText={t => setNewUser({...newUser, password: t})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ROLE PENGGUNA</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <TouchableOpacity 
                  style={[styles.roleSelectBtn, newUser.role === 'admin' && styles.roleSelectBtnActive]}
                  onPress={() => setNewUser({...newUser, role: 'admin'})}
                >
                  <Text style={[styles.roleSelectText, newUser.role === 'admin' && styles.roleSelectTextActive]}>Admin System</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.roleSelectBtn, newUser.role === 'user' && styles.roleSelectBtnActive]}
                  onPress={() => setNewUser({...newUser, role: 'user'})}
                >
                  <Text style={[styles.roleSelectText, newUser.role === 'user' && styles.roleSelectTextActive]}>Warga / User</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitRespBtn, { marginTop: 24, paddingVertical: 14 }]} 
              onPress={handleAddUser}
              disabled={isSubmittingUser}
            >
              <Text style={styles.submitRespText}>{isSubmittingUser ? 'Menyimpan...' : 'Simpan Pengguna'}</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditProfileModalOpen}
        onRequestClose={() => setIsEditProfileModalOpen(false)}
      >
        <View style={styles.modalOverlayStyle}>
          <View style={styles.modalContentStyle}>
            <View style={styles.modalHeaderStyle}>
              <View>
                <Text style={styles.modalTitleStyle}>Edit Profil Admin</Text>
                <Text style={styles.modalSubTitleStyle}>Perbarui email atau kata sandi Anda.</Text>
              </View>
              <TouchableOpacity onPress={() => setIsEditProfileModalOpen(false)}>
                <Feather name="x" size={20} color="#7AAACE" />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              {currentUser?.role === 'super_admin' ? (
                <View style={{ alignItems: 'center' }}>
                  <View 
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: 45,
                      backgroundColor: '#F3F4F0',
                      justifyContent: 'center',
                      alignItems: 'center',
                      overflow: 'hidden',
                      borderWidth: 2,
                      borderColor: '#D1D5DB',
                    }}
                  >
                    <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#9CA3AF' }}>
                      {currentUser?.name?.[0]?.toUpperCase() || 'A'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#DC2626', marginTop: 10, textAlign: 'center', paddingHorizontal: 16 }}>
                    Super Administrator tidak diperbolehkan menggunakan foto profil
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={pickProfileImage}
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: 45,
                      backgroundColor: '#9CD5FF',
                      justifyContent: 'center',
                      alignItems: 'center',
                      overflow: 'hidden',
                      borderWidth: 2,
                      borderColor: '#355872',
                      position: 'relative',
                    }}
                  >
                    {profilePreviewUri ? (
                      <Image source={{ uri: profilePreviewUri }} style={{ width: '100%', height: '100%' }} />
                    ) : currentUser?.profile_image ? (
                      <Image source={{ uri: `${IMG_URL}${currentUser.profile_image}` }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#355872' }}>
                        {currentUser?.name?.[0]?.toUpperCase() || 'A'}
                      </Text>
                    )}
                    {/* Camera Icon Overlay */}
                    <View style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 28,
                      backgroundColor: 'rgba(0,0,0,0.4)',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      <Feather name="camera" size={14} color="#FFF" />
                    </View>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#355872', marginTop: 8 }}>
                    KETUK LINGKARAN UNTUK MENGGANTI FOTO PROFIL
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.formGroupStyle}>
              <Text style={styles.inputLabelStyle}>EMAIL ADMIN</Text>
              <TextInput
                style={styles.textInputStyle}
                placeholder="admin@laporpak.com"
                placeholderTextColor="#A0A0A0"
                value={editProfileData.email}
                onChangeText={(text) => setEditProfileData({ ...editProfileData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroupStyle}>
              <Text style={styles.inputLabelStyle}>PASSWORD BARU</Text>
              <TextInput
                style={styles.textInputStyle}
                placeholder="Kosongkan jika tidak ingin diubah"
                placeholderTextColor="#A0A0A0"
                value={editProfileData.password}
                onChangeText={(text) => setEditProfileData({ ...editProfileData, password: text })}
                secureTextEntry={true}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalActionsStyle}>
              <TouchableOpacity 
                style={[styles.modalBtnStyle, styles.cancelBtnStyle]} 
                onPress={() => setIsEditProfileModalOpen(false)}
              >
                <Text style={styles.cancelBtnTextStyle}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtnStyle, styles.saveBtnStyle]} 
                onPress={handleEditProfile}
                disabled={isSubmittingProfile}
              >
                <Text style={styles.saveBtnTextStyle}>
                  {isSubmittingProfile ? 'Menyimpan...' : 'Simpan'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Beautiful Custom Delete Response Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteResponseConfirmId !== null}
        onRequestClose={() => setDeleteResponseConfirmId(null)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmContent}>
            <View style={styles.confirmHeader}>
              <View style={styles.confirmIconContainer}>
                <Feather name="trash-2" size={20} color="#D9534F" />
              </View>
              <Text style={styles.confirmTitle}>Hapus Tanggapan?</Text>
            </View>
            <Text style={styles.confirmSub}>Apakah Anda yakin ingin menghapus tanggapan resmi ini? Tindakan ini tidak dapat dibatalkan.</Text>
            
            <View style={styles.confirmActions}>
              <TouchableOpacity 
                style={[styles.confirmBtn, styles.confirmCancelBtn]}
                onPress={() => setDeleteResponseConfirmId(null)}
              >
                <Text style={styles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmBtn, styles.confirmDeleteBtn]}
                onPress={async () => {
                  if (deleteResponseConfirmId !== null) {
                    await executeDeleteResponse(deleteResponseConfirmId);
                    setDeleteResponseConfirmId(null);
                  }
                }}
              >
                <Text style={styles.confirmDeleteText}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FBF9' },
  navbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  logoIcon: { width: 36, height: 36, backgroundColor: '#355872', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 18, fontWeight: 'bold', color: '#355872' },
  logoSub: { fontSize: 11, color: '#7AAACE', fontWeight: 'bold' },
  logoutBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#7AAACE', justifyContent: 'center', alignItems: 'center' },
  tabContent: { padding: 16, paddingBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#355872', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statBox: { width: '48%', backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  statNum: { fontSize: 24, fontWeight: '900', color: '#355872', marginTop: 8 },
  statLabel: { fontSize: 10, fontWeight: 'bold', color: '#7AAACE', marginTop: 4, letterSpacing: 0.5 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#355872', marginBottom: 12, marginTop: 10 },
  recentItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  recentIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0F3EF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recentTitle: { fontSize: 14, fontWeight: 'bold', color: '#355872', marginBottom: 2 },
  recentSub: { fontSize: 12, color: '#777' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  
  reportCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reportId: { fontSize: 12, fontWeight: 'bold', color: '#355872' },
  reportTitle: { fontSize: 16, fontWeight: 'bold', color: '#355872', marginBottom: 4 },
  reportDesc: { fontSize: 13, color: '#666', marginBottom: 12 },
  reportFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 12 },
  reporterInfo: { flexDirection: 'row', alignItems: 'center' },
  reporterAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#9CD5FF', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  reporterAvatarText: { fontSize: 10, fontWeight: 'bold', color: '#355872' },
  reporterName: { fontSize: 12, fontWeight: 'bold', color: '#333' },
  reportDate: { fontSize: 11, color: '#999' },

  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  userAvatarText: { fontSize: 16, fontWeight: 'bold', color: '#1D4ED8' },
  userName: { fontSize: 15, fontWeight: 'bold', color: '#355872' },
  userEmail: { fontSize: 12, color: '#666', marginTop: 2 },
  roleBadge: { backgroundColor: '#E6F4EA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  roleText: { fontSize: 10, fontWeight: 'bold', color: '#166534' },
  deleteUserBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#7AAACE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  deleteUserText: { fontSize: 10, fontWeight: 'bold', color: '#D9534F', marginLeft: 4 },
  addUserBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#355872', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  addUserBtnText: { fontSize: 12, fontWeight: 'bold', color: '#FFF', marginLeft: 6 },

  hamburgerBtn: { marginRight: 16, padding: 4 },
  sidebarOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 100, flexDirection: 'row' },
  sidebarCloseArea: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sidebar: { width: 260, backgroundColor: '#FFF', height: '100%', elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#F9FBF9' },
  sidebarNav: { flex: 1, padding: 16 },
  sidebarNavItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8 },
  sidebarNavItemActive: { backgroundColor: '#F0F3EF' },
  sidebarNavText: { fontSize: 15, fontWeight: 'bold', color: '#7AAACE', marginLeft: 12 },
  sidebarNavTextActive: { color: '#355872' },
  sidebarFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  sidebarLogoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: '#7AAACE' },
  sidebarLogoutText: { fontSize: 15, fontWeight: 'bold', color: '#D9534F', marginLeft: 12 },

  modalContainer: { flex: 1, backgroundColor: '#F9FBF9' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#355872' },
  closeBtn: { padding: 4 },
  
  statusControlCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#EAEFE8' },
  controlLabel: { fontSize: 10, fontWeight: 'bold', color: '#A0A0A0', marginBottom: 10 },
  statusButtons: { flexDirection: 'row', gap: 8 },
  statusBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
  statusBtnActive: { backgroundColor: '#4B5563', borderColor: '#4B5563' },
  statusBtnActiveProc: { backgroundColor: '#D97706', borderColor: '#D97706' },
  statusBtnActiveDone: { backgroundColor: '#166534', borderColor: '#166534' },
  statusBtnText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  statusBtnTextActive: { color: '#FFF' },

  detailTitle: { fontSize: 20, fontWeight: 'black', color: '#355872', marginBottom: 8 },
  detailDesc: { fontSize: 14, color: '#444', lineHeight: 22, marginBottom: 16, backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  detailImage: { width: '100%', height: 200, borderRadius: 16, marginBottom: 20 },

  responseBubble: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0', borderLeftWidth: 4, borderLeftColor: '#355872' },
  respAdminName: { fontSize: 12, fontWeight: 'bold', color: '#355872', flex: 1 },
  respDate: { fontSize: 10, color: '#999' },
  respText: { fontSize: 13, color: '#555', marginTop: 4 },

  addResponseCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#EAEFE8', marginTop: 10 },
  responseInput: { backgroundColor: '#F9FBF9', borderRadius: 12, padding: 12, height: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 12 },
  submitRespBtn: { backgroundColor: '#355872', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  submitRespText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  deleteBtn: { backgroundColor: '#D9534F', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 20 },

  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#A0A0A0', marginBottom: 6, letterSpacing: 0.5 },
  textInput: { backgroundColor: '#F9FBF9', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#333' },
  roleSelectBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', alignItems: 'center', backgroundColor: '#FFF' },
  roleSelectBtnActive: { backgroundColor: '#9CD5FF', borderColor: '#9CD5FF' },
  roleSelectText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  roleSelectTextActive: { color: '#355872' },

  modalOverlayStyle: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentStyle: {
    backgroundColor: '#FFF',
    width: '100%',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeaderStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitleStyle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  modalSubTitleStyle: {
    fontSize: 12,
    color: '#666',
  },
  formGroupStyle: {
    marginBottom: 16,
  },
  inputLabelStyle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4B5563',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  textInputStyle: {
    backgroundColor: '#F9FBF9',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111',
  },
  modalActionsStyle: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtnStyle: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnStyle: {
    backgroundColor: '#F3F4EE',
  },
  cancelBtnTextStyle: {
    color: '#555',
    fontWeight: 'bold',
  },
  saveBtnStyle: {
    backgroundColor: '#355872',
  },
  saveBtnTextStyle: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 32, 24, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  confirmIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#355872',
  },
  confirmSub: {
    fontSize: 12,
    color: '#7AAACE',
    lineHeight: 18,
    marginBottom: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  confirmCancelBtn: {
    backgroundColor: '#F5F5F5',
  },
  confirmCancelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
  },
  confirmDeleteBtn: {
    backgroundColor: '#D9534F',
  },
  confirmDeleteText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
});
