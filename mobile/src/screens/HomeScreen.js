import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Platform, Modal, TextInput, Alert, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import api, { API_URL } from '../api';

const IMG_URL = API_URL;

export default function HomeScreen({ navigation }) {
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [profileTab, setProfileTab] = useState('laporan_saya');
  const [notifications, setNotifications] = useState([]);
  const [readResponseIds, setReadResponseIds] = useState([]);
  const [user, setUser] = useState(null);

  // Saved, category filter, and guide states
  const [savedIds, setSavedIds] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [deleteResponseConfirmId, setDeleteResponseConfirmId] = useState(null);

  // Live Chat States
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // Create complaint states (direct from feed like web)
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [newLocation, setNewLocation] = useState(null);
  const [newCategory, setNewCategory] = useState('Infrastruktur Jalan');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  // Inline comments states
  const [openComments, setOpenComments] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [commentInput, setCommentInput] = useState({});

  // Edit Profile States
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

  useEffect(() => {
    fetchComplaints();
    fetchNotifications();
    getUserData();
    getSavedComplaints();
    loadReadNotifications();

    // Background auto-polling for true real-time reactivity without reload!
    const pollInterval = setInterval(() => {
      fetchComplaints();
      fetchNotifications();
    }, 5000);

    const unsubscribe = navigation.addListener('focus', () => {
      fetchComplaints();
      fetchNotifications();
      getUserData();
      getSavedComplaints();
      loadReadNotifications();
    });
    return () => {
      clearInterval(pollInterval);
      unsubscribe();
    };
  }, [navigation]);

  const fetchChatMessages = async () => {
    try {
      const res = await api.get('/chats/messages');
      setChatMessages(res.data);
    } catch (error) {
      console.error('Gagal mengambil pesan chat:', error);
      if (error.response?.status === 401) logout();
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;

    try {
      await api.post('/chats/messages', { message: chatInput });
      setChatInput('');
      fetchChatMessages();
    } catch (error) {
      console.error('Gagal mengirim pesan:', error);
    }
  };

  // Poll chat messages every 3 seconds when Chat tab is active
  useEffect(() => {
    if (activeTab !== 'chat') return;

    fetchChatMessages();
    const chatInterval = setInterval(() => {
      fetchChatMessages();
    }, 3000);

    return () => clearInterval(chatInterval);
  }, [activeTab]);

  const loadReadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem('read_response_ids');
      if (stored) {
        setReadResponseIds(JSON.parse(stored));
      }
    } catch (e) {
      console.log('Error loading read notifications:', e);
    }
  };

  const handleNotificationPress = async (notification) => {
    try {
      if (!readResponseIds.includes(notification.id)) {
        const updated = [...readResponseIds, notification.id];
        setReadResponseIds(updated);
        await AsyncStorage.setItem('read_response_ids', JSON.stringify(updated));
      }
    } catch (e) {
      console.log('Error saving read notification:', e);
    }
    navigation.navigate('Detail', { id: notification.complaint_id });
  };

  const getSavedComplaints = async () => {
    try {
      const saved = await AsyncStorage.getItem('saved_complaints');
      if (saved) {
        setSavedIds(JSON.parse(saved));
      }
    } catch (e) {
      console.log(e);
    }
  };

  const toggleSave = async (id) => {
    try {
      let updated;
      if (savedIds.includes(id)) {
        updated = savedIds.filter(savedId => savedId !== id);
        Alert.alert('Info', 'Laporan dihapus dari daftar tersimpan');
      } else {
        updated = [...savedIds, id];
        Alert.alert('Sukses', 'Laporan berhasil disimpan!');
      }
      setSavedIds(updated);
      await AsyncStorage.setItem('saved_complaints', JSON.stringify(updated));
    } catch (e) {
      console.log(e);
    }
  };

  const pickNewImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setNewImage(result.assets[0]);
    }
  };

  const getNewLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Aplikasi butuh izin lokasi.');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setNewLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      Alert.alert('Sukses', 'Lokasi berhasil disematkan!');
    } catch (error) {
      Alert.alert('Error', 'Gagal mendapatkan lokasi.');
    }
  };

  const submitNewComplaint = async () => {
    if (!newTitle || !newDescription) {
      Alert.alert('Error', 'Judul dan deskripsi wajib diisi');
      return;
    }

    setIsSubmittingComplaint(true);
    try {
      if (newImage) {
        const formData = new FormData();
        formData.append('title', newTitle);
        formData.append('description', newDescription);
        
        const localUri = newImage.uri;
        const filename = localUri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const fileType = match ? `image/${match[1]}` : `image/jpeg`;
        
        formData.append('image', {
          uri: localUri,
          name: filename,
          type: fileType,
        });

        if (newLocation) {
          formData.append('latitude', newLocation.latitude.toString());
          formData.append('longitude', newLocation.longitude.toString());
        }
        formData.append('category', newCategory);

        await api.post('/complaints', formData, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        const payload = {
          title: newTitle,
          description: newDescription,
          category: newCategory,
          latitude: newLocation ? newLocation.latitude.toString() : null,
          longitude: newLocation ? newLocation.longitude.toString() : null,
        };

        await api.post('/complaints', payload);
      }

      Alert.alert('Sukses', 'Pengaduan berhasil dikirim!');
      setNewTitle('');
      setNewDescription('');
      setNewImage(null);
      setNewLocation(null);
      fetchComplaints();
    } catch (error) {
      Alert.alert('Error', 'Gagal mengirim pengaduan.');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const toggleCommentSection = async (complaintId) => {
    const isOpen = !openComments[complaintId];
    setOpenComments(prev => ({ ...prev, [complaintId]: isOpen }));

    if (isOpen) {
      try {
        const res = await api.get(`/complaints/${complaintId}/comments`);
        setCommentsData(prev => ({ ...prev, [complaintId]: res.data }));
      } catch (error) {
        console.log('Error fetching comments:', error);
      }
    }
  };

  const submitComment = async (complaintId) => {
    const text = commentInput[complaintId];
    if (!text || text.trim() === '') return;

    try {
      await api.post(`/complaints/${complaintId}/comments`, { comment: text });
      setCommentInput(prev => ({ ...prev, [complaintId]: '' }));
      const res = await api.get(`/complaints/${complaintId}/comments`);
      setCommentsData(prev => ({ ...prev, [complaintId]: res.data }));
      fetchComplaints();
    } catch (error) {
      console.log('Error submitting comment:', error);
    }
  };

  const getUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
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

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/complaints/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.log('Error fetching notifications', error);
      if (error.response?.status === 401) logout();
    }
  };

  const deleteNotificationResponse = (id) => {
    setDeleteResponseConfirmId(id);
  };

  const executeDeleteNotificationResponse = async (id) => {
    try {
      await api.delete(`/responses/${id}`);
      Alert.alert('Sukses', 'Tanggapan berhasil dihapus');
      fetchNotifications();
    } catch (error) {
      Alert.alert('Error', 'Gagal menghapus tanggapan');
    }
  };

  const toggleLike = async (id) => {
    try {
      await api.post(`/complaints/${id}/like`);
      fetchComplaints();
    } catch (error) {
      console.log('Error toggling like', error);
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

      Alert.alert('Sukses', 'Profil berhasil diperbarui!');

      // Update AsyncStorage and State
      const updatedUser = {
        ...user,
        ...(editProfileData.email ? { email: editProfileData.email } : {}),
        ...(res.data.profile_image ? { profile_image: res.data.profile_image } : {})
      };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setIsEditProfileModalOpen(false);
      setProfileImageFile(null);
      setProfilePreviewUri(null);
      setEditProfileData({ email: '', password: '' });
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal memperbarui profil';
      Alert.alert('Error', msg);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'done':
      case 'approved':
        return { bg: '#9CD5FF', text: '#355872' };
      case 'process':
        return { bg: '#FFF4E0', text: '#D98A2C' };
      case 'rejected':
        return { bg: '#7AAACE', text: '#D9534F' };
      default:
        return { bg: '#F2F2F2', text: '#7AAACE' };
    }
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.9}
        onPress={() => navigation.navigate('Detail', { id: item.id })}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { overflow: 'hidden' }]}>
              {item.user_profile_image ? (
                <Image 
                  source={{ uri: `${IMG_URL}${item.user_profile_image}` }} 
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <Text style={styles.avatarText}>{item.user_name?.[0]?.toUpperCase() || 'U'}</Text>
              )}
            </View>
            <View>
              <Text style={styles.userName}>{item.user_name}</Text>
              <Text style={styles.timestamp}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => toggleSave(item.id)}>
            <Feather 
              name="bookmark" 
              size={20} 
              color={savedIds.includes(item.id) ? "#355872" : "#7AAACE"} 
            />
          </TouchableOpacity>
        </View>

        {/* Tags */}
        <View style={styles.tagContainer}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status.toUpperCase()}</Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category || 'Fasilitas Umum'}</Text>
          </View>
        </View>

        {/* Content */}
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={3}>{item.description}</Text>

        {/* Image */}
        {item.image && (
          (() => {
            const firstImg = item.image.split(',')[0];
            return (
              <Image 
                source={{ uri: `${IMG_URL}${firstImg}` }} 
                style={styles.postImage} 
                resizeMode="cover"
              />
            );
          })()
        )}

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(item.id)}>
            <Feather 
              name="thumbs-up" 
              size={18} 
              color={item.is_liked_by_me ? "#355872" : "#7AAACE"} 
            />
            <Text style={[styles.actionText, item.is_liked_by_me && { color: '#355872' }]}>
              {item.likes_count || 0} Dukungan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => toggleCommentSection(item.id)}>
            <Feather name="message-square" size={18} color={openComments[item.id] ? "#355872" : "#7AAACE"} />
            <Text style={[styles.actionText, openComments[item.id] && { color: '#355872' }]}>{item.comments_count || 0} Komentar</Text>
          </TouchableOpacity>
        </View>

        {/* Inline Comments Section (Parity with Web Dashboard) */}
        {openComments[item.id] && (
          <View style={styles.inlineCommentsContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.commentsList}>
              {commentsData[item.id]?.length > 0 ? (
                commentsData[item.id].map((comment) => (
                  <View key={comment.id} style={{ flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#9CD5FF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginTop: 2 }}>
                      {comment.user_profile_image ? (
                        <Image source={{ uri: `${IMG_URL}${comment.user_profile_image}` }} style={{ width: '100%', height: '100%' }} />
                      ) : (
                        <Text style={{ color: '#355872', fontWeight: 'bold', fontSize: 11 }}>{comment.user_name?.[0]?.toUpperCase() || 'U'}</Text>
                      )}
                    </View>
                    <View style={[styles.inlineCommentBubble, { flex: 1, marginBottom: 0 }]}>
                      <View style={styles.inlineCommentHeader}>
                        <Text style={styles.inlineCommentUser}>{comment.user_name}</Text>
                        <Text style={styles.inlineCommentTime}>{new Date(comment.created_at).toLocaleDateString()}</Text>
                      </View>
                      <Text style={styles.inlineCommentText}>{comment.comment}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noCommentsText}>Belum ada komentar. Jadilah yang pertama!</Text>
              )}
            </View>

            <View style={styles.inlineCommentInputRow}>
              <View style={[styles.inlineAvatarCircle, { overflow: 'hidden' }]}>
                {user?.profile_image ? (
                  <Image 
                    source={{ uri: `${IMG_URL}${user.profile_image}` }} 
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <Text style={styles.inlineAvatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
                )}
              </View>
              <TextInput 
                style={styles.inlineCommentInput} 
                placeholder="Tulis komentar..." 
                placeholderTextColor="#A0A0A0"
                value={commentInput[item.id] || ''}
                onChangeText={(text) => setCommentInput(prev => ({ ...prev, [item.id]: text }))}
              />
              <TouchableOpacity 
                style={[styles.inlineSendBtn, !commentInput[item.id]?.trim() && styles.inlineSendBtnDisabled]}
                onPress={() => submitComment(item.id)}
                disabled={!commentInput[item.id]?.trim()}
              >
                <Feather name="send" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const filteredComplaints = selectedCategory 
    ? complaints.filter(c => (c.category || 'Lainnya') === selectedCategory)
    : complaints;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navbar */}
      {/* Modern Top Navbar */}
      <View style={styles.navbar}>
        <Text style={styles.logo}>LaporPak</Text>
        <View style={styles.navActionGroup}>
          {/* Notification Icon */}
          <TouchableOpacity 
            style={styles.navIconBtn} 
            onPress={() => {
              setShowNotifDropdown(!showNotifDropdown);
              fetchNotifications();
            }}
          >
            <Feather name="bell" size={22} color={showNotifDropdown || activeTab === 'notifications' ? '#355872' : '#6B7280'} />
            {notifications.filter(n => !readResponseIds.includes(n.id)).length > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>
                  {notifications.filter(n => !readResponseIds.includes(n.id)).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          {/* Profile Avatar Circle Icon */}
          <TouchableOpacity 
            style={[styles.navAvatarBtn, activeTab === 'profile' && { borderColor: '#355872' }]} 
            onPress={() => {
              setShowNotifDropdown(false);
              setActiveTab('profile');
              getUserData();
            }}
          >
            {user?.profile_image && user?.role !== 'super_admin' ? (
              <Image 
                source={{ uri: `${IMG_URL}${user.profile_image}` }} 
                style={{ width: 31, height: 31, borderRadius: 15.5 }}
              />
            ) : (
              <Feather name="user" size={18} color={activeTab === 'profile' ? '#355872' : '#6B7280'} />
            )}
          </TouchableOpacity>
        </View>
      </View>


      {/* Main Content Area based on Tab */}
      {activeTab === 'home' && (
        <View style={{ flex: 1 }}>
          <FlatList keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
            data={filteredComplaints}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.feedContainer}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.homeHeader}>
                {/* Guide Banner */}
                <View style={styles.guideBanner}>
                  <View style={styles.guideBannerContent}>
                    <Text style={styles.guideBannerTitle}>Jadilah Warga Aktif!</Text>
                    <Text style={styles.guideBannerSub}>Laporan Anda membantu pemerintah mempercepat perbaikan fasilitas desa kita.</Text>
                    <TouchableOpacity 
                      style={styles.guideBannerBtn} 
                      onPress={() => setIsGuideModalOpen(true)}
                    >
                      <Feather name="book-open" size={14} color="#355872" style={{ marginRight: 6 }} />
                      <Text style={styles.guideBannerBtnText}>Panduan Melapor</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Categories Scroll */}
                <Text style={styles.sectionTitle}>Saring Laporan</Text>
                <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.categoriesScrollContainer}
                  style={styles.categoriesScrollView}
                >
                  {['Semua', 'Infrastruktur Jalan', 'Fasilitas Umum', 'Kesehatan', 'Keamanan', 'Lainnya'].map((cat) => {
                    const isSelected = (cat === 'Semua' && !selectedCategory) || (selectedCategory === cat);
                    return (
                      <TouchableOpacity 
                        key={cat} 
                        style={[styles.categoryChip, isSelected && styles.activeCategoryChip]} 
                        onPress={() => setSelectedCategory(cat === 'Semua' ? null : cat)}
                      >
                        <Text style={[styles.categoryChipText, isSelected && styles.activeCategoryChipText]}>{cat}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {selectedCategory && (
                  <View style={styles.filterAlertBar}>
                    <Text style={styles.filterAlertText}>Menampilkan: {selectedCategory}</Text>
                    <TouchableOpacity onPress={() => setSelectedCategory(null)} style={styles.resetBtnContainer}>
                      <Text style={styles.filterAlertReset}>Reset</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Belum ada laporan dalam kategori ini. Mulai lapor sekarang!</Text>
              </View>
            }
          />
          {/* Floating Action Button */}
          <TouchableOpacity 
            style={styles.fab} 
            onPress={() => navigation.navigate('CreateComplaint')}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'notifications' && (
        <View style={styles.tabContentContainer}>
          <Text style={styles.tabTitle}>Notifikasi Tanggapan</Text>
          <FlatList keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
            data={notifications}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
            renderItem={({ item }) => {
              const isUnread = !readResponseIds.includes(item.id);
              return (
                <TouchableOpacity 
                  style={[
                    styles.notificationCard,
                    isUnread && { borderLeftWidth: 4, borderLeftColor: '#D9534F' }
                  ]}
                  activeOpacity={0.9}
                  onPress={() => handleNotificationPress(item)}
                >
                  <View style={styles.notificationHeader}>
                    <View style={styles.notificationAvatar}>
                      <Text style={styles.avatarText}>{item.admin_name?.[0]?.toUpperCase() || 'A'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text style={[styles.notificationText, { flex: 1, paddingRight: 8 }]}>
                          <Text style={{ fontWeight: 'bold', color: '#111' }}>{item.admin_name}</Text> memberikan tanggapan pada laporan Anda:{" "}
                          <Text style={{ fontWeight: '600', color: '#355872' }}>"{item.complaint_title}"</Text>
                        </Text>
                        {user && (user.role === 'admin' || user.role === 'super_admin') && (
                          <TouchableOpacity onPress={() => deleteNotificationResponse(item.id)}>
                            <Text style={{ color: '#D9534F', fontWeight: 'bold', fontSize: 11, backgroundColor: '#FDF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#FDE8E8' }}>Hapus</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <View style={styles.responseBubble}>
                        <Text style={styles.responseText}>"{item.message}"</Text>
                      </View>
                      
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                        <Text style={styles.notificationTime}>{new Date(item.created_at).toLocaleString()}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          {isUnread && (
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#D9534F', marginRight: 4 }} />
                          )}
                          <Text style={{ fontSize: 11, color: '#355872', fontWeight: 'bold' }}>Detail Laporan</Text>
                          <Feather name="arrow-right" size={11} color="#355872" />
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Belum ada tanggapan dari Admin.</Text>
              </View>
            }
          />
        </View>
      )}

      {activeTab === 'profile' && (
        <View style={styles.tabContentContainer}>
          <FlatList keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
            data={
              profileTab === 'laporan_saya' 
                ? [
                    { id: 'create_shortcut_btn', type: 'action' },
                    ...complaints.filter(c => c.user_id === user?.id)
                  ]
                : profileTab === 'tersimpan'
                ? complaints.filter(c => savedIds.includes(c.id))
                : complaints.filter(c => c.is_liked_by_me)
            }
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            numColumns={1} // Stacks nicely on mobile
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
            ListHeaderComponent={
              <View>
                {/* Premium Profile Header */}
                <View style={styles.modernProfileCard}>
                  <View style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(91,110,83,0.05)' }} />
                  <View style={styles.modernProfileHeader}>
                    <View style={[styles.modernAvatarContainer, { overflow: 'hidden' }]}>
                      {user?.profile_image && user?.role !== 'super_admin' ? (
                        <Image 
                          source={{ uri: `${IMG_URL}${user.profile_image}` }} 
                          style={{ width: '100%', height: '100%' }}
                        />
                      ) : (
                        <Text style={styles.modernAvatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
                      )}
                    </View>
                    <View style={styles.modernProfileInfo}>
                      <Text style={styles.modernProfileName} numberOfLines={1}>{user?.name}</Text>
                      <View style={styles.locationRow}>
                        <Feather name="map-pin" size={12} color="#355872" />
                        <Text style={styles.locationText}>Kelurahan Menteng, Jakarta</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity 
                        onPress={() => {
                          setEditProfileData({ email: user?.email || '', password: '' });
                          setIsEditProfileModalOpen(true);
                        }} 
                        style={styles.editProfileBtn}
                      >
                        <Feather name="edit-2" size={14} color="#FFF" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                        <Feather name="log-out" size={14} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Distinct Stats Boxes */}
                  <View style={styles.newStatsRow}>
                    <View style={[styles.newStatBox, { backgroundColor: '#F3F4EE' }]}>
                      <Text style={[styles.newStatNum, { color: '#333' }]}>{complaints.filter(c => c.user_id === user?.id).length}</Text>
                      <Text style={styles.newStatLabel}>REPORTS</Text>
                    </View>
                    <View style={[styles.newStatBox, { backgroundColor: '#FDF2EE' }]}>
                      <Text style={[styles.newStatNum, { color: '#BA7257' }]}>{complaints.filter(c => c.user_id === user?.id && (c.status === 'done' || c.status === 'approved')).length}</Text>
                      <Text style={styles.newStatLabel}>APPROVED</Text>
                    </View>
                    <View style={[styles.newStatBox, { backgroundColor: '#F7F8F0' }]}>
                      <Text style={[styles.newStatNum, { color: '#355872' }]}>{complaints.filter(c => c.user_id === user?.id && c.status === 'process').length}</Text>
                      <Text style={styles.newStatLabel}>IN PROG</Text>
                    </View>
                  </View>
                </View>

                {/* Sub Tabs Navigation */}
                <View style={styles.subTabsContainer}>
                  <TouchableOpacity onPress={() => setProfileTab('laporan_saya')} style={profileTab === 'laporan_saya' ? styles.activeSubTab : styles.inactiveSubTab}>
                    <Text style={profileTab === 'laporan_saya' ? styles.activeSubTabText : styles.inactiveSubTabText}>Laporan Saya</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setProfileTab('tersimpan')} style={profileTab === 'tersimpan' ? styles.activeSubTab : styles.inactiveSubTab}>
                    <Text style={profileTab === 'tersimpan' ? styles.activeSubTabText : styles.inactiveSubTabText}>Tersimpan</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setProfileTab('aktivitas')} style={profileTab === 'aktivitas' ? styles.activeSubTab : styles.inactiveSubTab}>
                    <Text style={profileTab === 'aktivitas' ? styles.activeSubTabText : styles.inactiveSubTabText}>Aktivitas</Text>
                  </TouchableOpacity>
                </View>

                {profileTab === 'tersimpan' && complaints.filter(c => savedIds.includes(c.id)).length === 0 && (
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <Feather name="bookmark" size={32} color="#D1D5DB" style={{ marginBottom: 10 }} />
                    <Text style={{ fontWeight: 'bold', color: '#111', marginBottom: 4 }}>Belum Ada Laporan Tersimpan</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center' }}>Anda belum menyimpan laporan apapun untuk dibaca nanti.</Text>
                  </View>
                )}

                {profileTab === 'aktivitas' && complaints.filter(c => c.is_liked_by_me).length === 0 && (
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <Feather name="activity" size={32} color="#D1D5DB" style={{ marginBottom: 10 }} />
                    <Text style={{ fontWeight: 'bold', color: '#111', marginBottom: 4 }}>Riwayat Aktivitas Kosong</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center' }}>Aktivitas menyukai laporan akan muncul di sini.</Text>
                  </View>
                )}
              </View>
            }
            renderItem={({ item }) => {
              if (item.type === 'action') {
                return (
                  <TouchableOpacity 
                    style={styles.mobileAddReportCard}
                    onPress={() => navigation.navigate('CreateComplaint')}
                  >
                    <View style={styles.addCircle}>
                      <Feather name="plus" size={24} color="#355872" />
                    </View>
                    <Text style={styles.addCardTitle}>Buat Laporan Baru</Text>
                    <Text style={styles.addCardSub}>Ada masalah? Laporkan sekarang.</Text>
                  </TouchableOpacity>
                );
              }

              const statusStyle = getStatusStyle(item.status);
              
              return (
                <TouchableOpacity 
                  style={styles.modernReportCard}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('Detail', { id: item.id })}
                >
                  <View style={styles.reportCardTop}>
                    <View style={[styles.modernStatusBadge, { backgroundColor: statusStyle.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
                      <Text style={[styles.modernStatusText, { color: statusStyle.text }]}>
                        {item.status === 'process' ? 'In Progress' : item.status === 'done' || item.status === 'approved' ? 'Resolved' : 'Pending'}
                      </Text>
                    </View>
                    <Text style={styles.timeAgoText}>
                      {Math.floor((new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 3600 * 24))}d ago
                    </Text>
                  </View>

                  <View style={styles.reportImagePlaceholder}>
                    {item.image ? (
                      (() => {
                        const firstImg = item.image.split(',')[0];
                        return (
                          <Image 
                            source={{ uri: `${IMG_URL}${firstImg}` }} 
                            style={styles.reportPreviewImage}
                            resizeMode="cover"
                          />
                        );
                      })()
                    ) : (
                      <Feather name="image" size={28} color="#E0E0E0" />
                    )}
                  </View>

                  <Text style={styles.reportCardTitle} numberOfLines={2}>{item.title}</Text>
                  
                  <View style={styles.reportFooter}>
                    <Feather name="map-pin" size={11} color="#A0A0A0" />
                    <Text style={styles.reportFooterText}>{item.latitude ? 'Lokasi Tersemat' : 'Taman Kota'}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
      {activeTab === 'chat' && (
        <KeyboardAvoidingView 
          style={{ flex: 1, backgroundColor: '#F5F3EF' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
        

          {/* ── Chat Top Header ── */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: '#FFF',
            borderBottomWidth: 1,
            borderBottomColor: '#EBECE6',
          }}>
            <TouchableOpacity onPress={() => setActiveTab('home')} style={{ padding: 4, marginRight: 12 }}>
              <Feather name="arrow-left" size={22} color="#355872" />
            </TouchableOpacity>
            <Text style={{ flex: 1, fontSize: 18, fontWeight: '800', color: '#355872' }}>Messages</Text>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#9CD5FF', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="user" size={18} color="#355872" />
            </View>
          </View>

          {/* ── Operator Contact Bar ── */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: '#FFF',
            borderBottomWidth: 1,
            borderBottomColor: '#F0F0EC',
          }}>
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#9CD5FF', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 2, borderColor: '#9CD5FF' }}>
              <Feather name="shield" size={22} color="#355872" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#355872' }}>Operator Desa</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80', marginRight: 5 }} />
                <Text style={{ fontSize: 11, color: '#7AAACE', fontWeight: '600' }}>Online</Text>
              </View>
            </View>
            <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F3EF', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="info" size={16} color="#7AAACE" />
            </TouchableOpacity>
          </View>

          {/* ── Chat Messages Area ── */}
          <FlatList keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
            style={{ flex: 1 }}
            data={chatMessages}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              chatMessages.length > 0 ? (
                <View style={{ alignItems: 'center', marginVertical: 16 }}>
                  <View style={{ backgroundColor: '#EAEAE5', paddingHorizontal: 16, paddingVertical: 5, borderRadius: 12 }}>
                    <Text style={{ fontSize: 11, color: '#6B6B65', fontWeight: '600' }}>Hari Ini</Text>
                  </View>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center', marginTop: 50 }}>
                <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#9CD5FF', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <Feather name="message-circle" size={44} color="#355872" />
                </View>
                <Text style={{ fontWeight: '800', color: '#355872', fontSize: 17, marginBottom: 8 }}>Mulai Obrolan Baru</Text>
                <Text style={{ fontSize: 13, color: '#7AAACE', textAlign: 'center', lineHeight: 20 }}>
                  Tanyakan kendala atau butuh informasi langsung dari operator LaporPak desa kami.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isMe = item.is_admin_reply === 0;
              return (
                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <View style={{
                      maxWidth: '78%',
                      backgroundColor: isMe ? '#355872' : '#FFFFFF',
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 20,
                      borderTopRightRadius: isMe ? 4 : 20,
                      borderTopLeftRadius: isMe ? 20 : 4,
                      ...(isMe ? {} : { borderWidth: 1, borderColor: '#E8E8E3' }),
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 3,
                      elevation: 1,
                    }}>
                      <Text style={{ fontSize: 14, color: isMe ? '#FFF' : '#2D2D2A', lineHeight: 21 }}>
                        {item.message}
                      </Text>
                    </View>
                  </View>
                  {/* Timestamp outside the bubble */}
                  <View style={{ flexDirection: 'row', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'center', marginTop: 5, paddingHorizontal: 4 }}>
                    <Text style={{ fontSize: 10, color: '#7AAACE', fontWeight: '500' }}>
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {isMe && (
                      <Text style={{ fontSize: 10, color: '#7AAACE', marginLeft: 4, fontWeight: '700' }}>✓✓</Text>
                    )}
                  </View>
                </View>
              );
            }}
          />

          {/* ── Chat Input Bar ── */}
          <View style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: '#FFF',
            borderTopWidth: 1,
            borderTopColor: '#EBECE6',
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <TouchableOpacity style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#F0F0EC',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}>
              <Feather name="plus" size={20} color="#7AAACE" />
            </TouchableOpacity>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: '#F5F3EF',
                borderRadius: 22,
                paddingHorizontal: 18,
                paddingVertical: Platform.OS === 'ios' ? 10 : 8,
                fontSize: 14,
                color: '#333',
                marginRight: 10,
                maxHeight: 80,
              }}
              placeholder="Tulis pesan..."
              placeholderTextColor="#A0A0A0"
              value={chatInput}
              onChangeText={setChatInput}
              multiline
            />
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: chatInput.trim() ? '#355872' : '#D5D9D2',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#355872',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: chatInput.trim() ? 0.25 : 0,
                shadowRadius: 4,
                elevation: chatInput.trim() ? 3 : 0,
              }}
              onPress={handleSendChatMessage}
              disabled={!chatInput.trim()}
            >
              <Feather name="send" size={17} color="#FFF" />
            </TouchableOpacity>
          </View>
        
          
      </KeyboardAvoidingView>
      )}

      {/* Bottom Navigation Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity 
          style={styles.tabBtn} 
          onPress={() => {
            setActiveTab('home');
            fetchComplaints();
          }}
        >
          <Feather name="home" size={22} color={activeTab === 'home' ? '#355872' : '#7AAACE'} />
          <Text style={[styles.tabBtnText, { color: activeTab === 'home' ? '#355872' : '#7AAACE', fontWeight: activeTab === 'home' ? 'bold' : '500' }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabBtn} 
          onPress={() => {
            setActiveTab('notifications');
            fetchNotifications();
          }}
        >
          <View>
            <Feather name="bell" size={22} color={activeTab === 'notifications' ? '#355872' : '#7AAACE'} />
            {notifications.filter(n => !readResponseIds.includes(n.id)).length > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                  {notifications.filter(n => !readResponseIds.includes(n.id)).length}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabBtnText, { color: activeTab === 'notifications' ? '#355872' : '#7AAACE', fontWeight: activeTab === 'notifications' ? 'bold' : '500' }]}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabBtn} 
          onPress={() => {
            setActiveTab('chat');
          }}
        >
          <View style={activeTab === 'chat' ? {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#355872',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: -22,
            shadowColor: '#355872',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 6,
          } : {}}>
            <Feather name="message-square" size={activeTab === 'chat' ? 20 : 22} color={activeTab === 'chat' ? '#FFF' : '#7AAACE'} />
          </View>
          <Text style={[styles.tabBtnText, { color: activeTab === 'chat' ? '#355872' : '#7AAACE', fontWeight: activeTab === 'chat' ? 'bold' : '500' }]}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabBtn} 
          onPress={() => {
            setActiveTab('profile');
            fetchComplaints();
            getUserData();
          }}
        >
          <Feather name="user" size={22} color={activeTab === 'profile' ? '#355872' : '#7AAACE'} />
          <Text style={[styles.tabBtnText, { color: activeTab === 'profile' ? '#355872' : '#7AAACE', fontWeight: activeTab === 'profile' ? 'bold' : '500' }]}>Profile</Text>
        </TouchableOpacity>
      </View>
      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditProfileModalOpen}
        onRequestClose={() => setIsEditProfileModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Profil</Text>
                <Text style={styles.modalSubTitle}>Perbarui email atau kata sandi Anda.</Text>
              </View>
              <TouchableOpacity onPress={() => setIsEditProfileModalOpen(false)}>
                <Feather name="x" size={20} color="#7AAACE" />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              {user?.role === 'super_admin' ? (
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
                      {user?.name?.[0]?.toUpperCase() || 'U'}
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
                    ) : user?.profile_image ? (
                      <Image source={{ uri: `${IMG_URL}${user.profile_image}` }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#355872' }}>
                        {user?.name?.[0]?.toUpperCase() || 'U'}
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

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>EMAIL BARU</Text>
              <TextInput
                style={styles.textInput}
                placeholder="email.baru@laporpak.com"
                placeholderTextColor="#A0A0A0"
                value={editProfileData.email}
                onChangeText={(text) => setEditProfileData({ ...editProfileData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>PASSWORD BARU</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Kosongkan jika tidak ingin diubah"
                placeholderTextColor="#A0A0A0"
                value={editProfileData.password}
                onChangeText={(text) => setEditProfileData({ ...editProfileData, password: text })}
                secureTextEntry={true}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => setIsEditProfileModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.saveBtn]} 
                onPress={handleEditProfile}
                disabled={isSubmittingProfile}
              >
                <Text style={styles.saveBtnText}>
                  {isSubmittingProfile ? 'Menyimpan...' : 'Simpan'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Guide Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isGuideModalOpen}
        onRequestClose={() => setIsGuideModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: '90%', maxHorizontalWidth: 350 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Panduan Melapor</Text>
                <Text style={styles.modalSubTitle}>LaporPak Mobile App Guide</Text>
              </View>
              <TouchableOpacity onPress={() => setIsGuideModalOpen(false)}>
                <Feather name="x" size={20} color="#7AAACE" />
              </TouchableOpacity>
            </View>

            <View style={styles.guideStepContainer}>
              <View style={styles.guideStepRow}>
                <View style={styles.guideStepNumContainer}>
                  <Text style={styles.guideStepNum}>1</Text>
                </View>
                <Text style={styles.guideStepText}>Isi judul keluhan dan jabarkan deskripsi secara lengkap.</Text>
              </View>

              <View style={styles.guideStepRow}>
                <View style={styles.guideStepNumContainer}>
                  <Text style={styles.guideStepNum}>2</Text>
                </View>
                <Text style={styles.guideStepText}>Pilih kategori keluhan yang relevan agar dinas terkait dapat merespon cepat.</Text>
              </View>

              <View style={styles.guideStepRow}>
                <View style={styles.guideStepNumContainer}>
                  <Text style={styles.guideStepNum}>3</Text>
                </View>
                <Text style={styles.guideStepText}>Sematkan koordinat peta GPS lokasi keluhan Anda agar presisi.</Text>
              </View>

              <View style={styles.guideStepRow}>
                <View style={styles.guideStepNumContainer}>
                  <Text style={styles.guideStepNum}>4</Text>
                </View>
                <Text style={styles.guideStepText}>Unggah foto bukti fisik agar laporan memiliki kekuatan pendukung.</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, { width: '100%', marginTop: 20, paddingVertical: 12, borderRadius: 10, alignItems: 'center' }]} 
              onPress={() => setIsGuideModalOpen(false)}
            >
              <Text style={styles.saveBtnText}>Saya Mengerti</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notification Dropdown Overlay (Placed at bottom for absolute zIndex rendering overlay) */}
      {showNotifDropdown && (
        <View style={styles.notifDropdown}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Notifikasi Baru</Text>
            <TouchableOpacity onPress={() => setShowNotifDropdown(false)}>
              <Feather name="x" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={styles.dropdownEmpty}>
                <Text style={styles.dropdownEmptyText}>Belum ada tanggapan baru.</Text>
              </View>
            ) : (
              notifications.slice(0, 4).map((item) => {
                const isUnread = !readResponseIds.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.dropdownItem,
                      isUnread && { backgroundColor: '#F9FBF9', borderLeftWidth: 3, borderLeftColor: '#D9534F' }
                    ]}
                    onPress={async () => {
                      setShowNotifDropdown(false);
                      await handleNotificationPress(item);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <Text style={styles.dropdownItemAdmin} numberOfLines={1}>{item.admin_name}</Text>
                      {isUnread && (
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#D9534F' }} />
                      )}
                    </View>
                    <Text style={styles.dropdownItemMsg} numberOfLines={1}>"{item.message}"</Text>
                    <Text style={styles.dropdownItemTitle} numberOfLines={1}>Laporan: {item.complaint_title}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
          
          <TouchableOpacity
            style={styles.dropdownFooter}
            onPress={() => {
              setShowNotifDropdown(false);
              setActiveTab('notifications');
              fetchNotifications();
            }}
          >
            <Text style={styles.dropdownFooterText}>Lihat Semua Notifikasi ({notifications.length})</Text>
          </TouchableOpacity>
        </View>
      )}

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
                    await executeDeleteNotificationResponse(deleteResponseConfirmId);
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
  container: {
    flex: 1,
    backgroundColor: '#F7F8F0',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F7F8F0',
    ...Platform.select({
      ios: { paddingTop: 40 },
    }),
  },
  logo: {
    fontSize: 24,
    fontWeight: '900',
    color: '#355872',
    letterSpacing: -0.5,
  },
  navActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navIconBtn: {
    padding: 8,
    marginRight: 8,
    position: 'relative',
  },
  navBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  navBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  navAvatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#7AAACE',
  },
  feedContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F7F8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#355872',
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111',
  },
  timestamp: {
    fontSize: 12,
    color: '#7AAACE',
    marginTop: 2,
  },
  tagContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F7F8F0',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7AAACE',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 6,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F7F8F0',
    paddingTop: 12,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#355872',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#355872',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#7AAACE',
    fontSize: 15,
  },
  bottomTabBar: {
    height: 65,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F7F8F0',
    paddingBottom: Platform.OS === 'ios' ? 15 : 0,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabBtnText: {
    fontSize: 10,
    marginTop: 4,
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#D9534F',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  tabContentContainer: {
    flex: 1,
    paddingTop: 16,
  },
  tabTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  notificationCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F7F8F0',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9CD5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  responseBubble: {
    backgroundColor: '#F7F8F0',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F7F8F0',
  },
  responseText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#555',
  },
  notificationTime: {
    fontSize: 10,
    color: '#7AAACE',
    marginTop: 6,
  },
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F7F8F0',
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#9CD5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  largeAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#355872',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
  },
  profileEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#9CD5FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  roleText: {
    fontSize: 10,
    color: '#355872',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F7F8F0',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  statLabel: {
    fontSize: 10,
    color: '#7AAACE',
    marginTop: 4,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 12,
  },
  modernProfileCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  modernProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modernAvatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#355872',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modernProfileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  modernProfileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#777',
    marginLeft: 4,
    fontWeight: '500',
  },
  editProfileBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#355872',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#D9534F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  newStatBox: {
    flex: 1,
    height: 70,
    borderRadius: 16,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  newStatNum: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  newStatLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: '#777',
  },
  subTabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  activeSubTab: {
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#355872',
    marginRight: 24,
  },
  activeSubTabText: {
    color: '#355872',
    fontWeight: 'bold',
    fontSize: 14,
  },
  inactiveSubTab: {
    paddingBottom: 12,
    marginRight: 24,
  },
  inactiveSubTabText: {
    color: '#A0A0A0',
    fontWeight: '600',
    fontSize: 14,
  },
  mobileAddReportCard: {
    backgroundColor: 'rgba(235, 240, 231, 0.6)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#9CD5FF',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  addCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F7F8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  addCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#355872',
    marginBottom: 4,
  },
  addCardSub: {
    fontSize: 11,
    color: '#7AAACE',
  },
  modernReportCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  reportCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  modernStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeAgoText: {
    fontSize: 10,
    color: '#A0A0A0',
    fontWeight: '600',
  },
  reportImagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  reportPreviewImage: {
    width: '100%',
    height: '100%',
  },
  reportCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#222',
    lineHeight: 20,
    marginBottom: 12,
  },
  reportFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 10,
  },
  reportFooterText: {
    fontSize: 11,
    color: '#A0A0A0',
    marginLeft: 4,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  modalSubTitle: {
    fontSize: 12,
    color: '#666',
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4B5563',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F9FBF9',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F3F4EE',
  },
  cancelBtnText: {
    color: '#555',
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: '#355872',
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  homeHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  guideBanner: {
    backgroundColor: '#355872',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  guideBannerContent: {
    zIndex: 2,
  },
  guideBannerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  guideBannerSub: {
    color: '#F7F8F0',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  guideBannerBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  guideBannerBtnText: {
    color: '#355872',
    fontSize: 11,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7AAACE',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoriesScrollView: {
    marginBottom: 16,
  },
  categoriesScrollContainer: {
    paddingRight: 16,
  },
  categoryChip: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F7F8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeCategoryChip: {
    backgroundColor: '#355872',
    borderColor: '#355872',
  },
  categoryChipText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeCategoryChipText: {
    color: '#FFF',
  },
  filterAlertBar: {
    backgroundColor: '#9CD5FF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  filterAlertText: {
    color: '#355872',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resetBtnContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  filterAlertReset: {
    color: '#355872',
    fontSize: 12,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  guideStepContainer: {
    marginTop: 10,
  },
  guideStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  guideStepNumContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#9CD5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  guideStepNum: {
    color: '#355872',
    fontSize: 12,
    fontWeight: 'bold',
  },
  guideStepText: {
    flex: 1,
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    lineHeight: 16,
  },
  createComplaintCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ECECEC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  createCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  createAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9CD5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  createAvatarText: {
    color: '#355872',
    fontWeight: 'bold',
    fontSize: 14,
  },
  createCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#355872',
  },
  createFormContent: {
    width: '100%',
  },
  createInput: {
    backgroundColor: '#F9FBF9',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#333',
    marginBottom: 12,
  },
  formSectionLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  formCategoryContainer: {
    paddingRight: 10,
  },
  formCategoryChip: {
    backgroundColor: '#F3F4EE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
  },
  formCategoryChipActive: {
    backgroundColor: '#355872',
  },
  formCategoryChipText: {
    color: '#555',
    fontSize: 11,
    fontWeight: 'bold',
  },
  formCategoryChipTextActive: {
    color: '#FFF',
  },
  createTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  attachmentInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  attachmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9CD5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  attachmentPillText: {
    fontSize: 10,
    color: '#355872',
    fontWeight: 'bold',
    maxWidth: 100,
  },
  createCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  attachmentButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachBtnActive: {
    backgroundColor: '#355872',
  },
  submitComplaintBtn: {
    backgroundColor: '#355872',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  inlineCommentsContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
    paddingTop: 12,
  },
  commentsList: {
    maxHeight: 180,
    marginBottom: 12,
  },
  inlineCommentBubble: {
    backgroundColor: '#F7F8F0',
    padding: 10,
    borderRadius: 14,
    marginBottom: 8,
  },
  inlineCommentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  inlineCommentUser: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#111',
  },
  inlineCommentTime: {
    fontSize: 9,
    color: '#7AAACE',
  },
  inlineCommentText: {
    fontSize: 12,
    color: '#444',
  },
  noCommentsText: {
    textAlign: 'center',
    color: '#7AAACE',
    fontSize: 11,
    marginVertical: 10,
  },
  inlineCommentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#9CD5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineAvatarText: {
    color: '#355872',
    fontWeight: 'bold',
    fontSize: 11,
  },
  inlineCommentInput: {
    flex: 1,
    backgroundColor: '#F9FBF9',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    color: '#333',
  },
  inlineSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#355872',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineSendBtnDisabled: {
    opacity: 0.5,
  },
  notifDropdown: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 280,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F2EE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 9999,
    padding: 14,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingBottom: 6,
  },
  dropdownTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#355872',
  },
  dropdownEmpty: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: 11,
    color: '#7AAACE',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FDFDFD',
    borderRadius: 10,
    marginBottom: 4,
  },
  dropdownItemAdmin: {
    fontWeight: 'bold',
    fontSize: 11,
    color: '#111',
  },
  dropdownItemMsg: {
    fontSize: 11,
    color: '#444',
    fontStyle: 'italic',
    marginTop: 1,
  },
  dropdownItemTitle: {
    fontSize: 9,
    color: '#7AAACE',
    marginTop: 2,
  },
  dropdownFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 10,
    marginTop: 6,
    alignItems: 'center',
  },
  dropdownFooterText: {
    fontWeight: 'bold',
    fontSize: 11,
    color: '#355872',
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
