import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity, Alert, Platform, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import api, { API_URL } from '../api';

const IMG_URL = API_URL;

export default function DetailScreen({ route }) {
  const { id } = route.params;
  const [complaint, setComplaint] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [deleteResponseConfirmId, setDeleteResponseConfirmId] = useState(null);

  useEffect(() => {
    fetchDetail();
    fetchComments();
    getUser();
  }, []);

  const getUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (e) {
      console.log(e);
    }
  };

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/complaints/${id}`);
      setComplaint(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await api.get(`/complaints/${id}/comments`);
      setComments(res.data);
    } catch (error) {
      console.log('Error fetching comments', error);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    try {
      await api.post(`/complaints/${id}/comments`, { comment: commentText });
      setCommentText('');
      fetchComments(); // Reload comments
    } catch (error) {
      Alert.alert('Error', 'Gagal mengirim komentar');
    }
  };

  const deleteResponse = (responseId) => {
    setDeleteResponseConfirmId(responseId);
  };

  const executeDeleteResponse = async (responseId) => {
    try {
      await api.delete(`/responses/${responseId}`);
      Alert.alert('Sukses', 'Tanggapan berhasil dihapus');
      fetchDetail();
    } catch (error) {
      Alert.alert('Error', 'Gagal menghapus tanggapan');
    }
  };

  if (!complaint) return <View style={styles.center}><Text>Loading...</Text></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F8F0' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.card}>
          {/* Premium Reporter Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0EE', paddingBottom: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#9CD5FF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginRight: 12 }}>
              {complaint.user_profile_image ? (
                <Image source={{ uri: `${IMG_URL}${complaint.user_profile_image}` }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={{ color: '#355872', fontWeight: 'bold', fontSize: 16 }}>{complaint.user_name?.[0]?.toUpperCase() || 'U'}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#355872' }}>{complaint.user_name}</Text>
              <Text style={{ fontSize: 11, color: '#7AAACE', marginTop: 2 }}>{new Date(complaint.created_at).toLocaleString()}</Text>
            </View>
          </View>

          <Text style={styles.title}>{complaint.title}</Text>
          <Text style={styles.status}>Status: {complaint.status.toUpperCase()}</Text>
          <Text style={{ marginTop: 10, color: '#333', lineHeight: 20 }}>{complaint.description}</Text>
          
          {complaint.latitude && complaint.longitude && (
            <Text style={styles.locationText}>
              📍 Lokasi: {parseFloat(complaint.latitude).toFixed(5)}, {parseFloat(complaint.longitude).toFixed(5)}
            </Text>
          )}

          {complaint.image && (
            (() => {
              const images = complaint.image.split(',');
              if (images.length === 1) {
                return <Image source={{ uri: `${IMG_URL}${images[0]}` }} style={styles.image} />;
              }
              return (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 15 }}>
                  {images.map((imgUrl, index) => (
                    <Image 
                      key={index}
                      source={{ uri: `${IMG_URL}${imgUrl}` }} 
                      style={[styles.image, { width: 300, marginRight: 10, marginTop: 0 }]} 
                    />
                  ))}
                </ScrollView>
              );
            })()
          )}
        </View>

        <Text style={styles.subtitle}>Tanggapan Admin:</Text>
        {complaint.responses && complaint.responses.length > 0 ? (
          complaint.responses.map((resp, idx) => (
            <View key={idx} style={[styles.responseCard, { flexDirection: 'row', gap: 10, alignItems: 'flex-start' }]}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginTop: 2, borderWidth: 1, borderColor: '#9CD5FF' }}>
                {resp.admin_profile_image ? (
                  <Image source={{ uri: `${IMG_URL}${resp.admin_profile_image}` }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text style={{ color: '#355872', fontWeight: 'bold', fontSize: 14 }}>{resp.admin_name?.[0]?.toUpperCase() || 'A'}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontWeight: 'bold', color: '#355872', fontSize: 13 }}>{resp.admin_name} (Admin)</Text>
                  {currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
                    <TouchableOpacity onPress={() => deleteResponse(resp.id)}>
                      <Text style={{ color: '#D9534F', fontWeight: 'bold', fontSize: 12 }}>Hapus</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={{ marginTop: 4, color: '#2D3748', fontSize: 14 }}>{resp.message}</Text>
                <Text style={{ fontSize: 10, color: '#718096', marginTop: 6 }}>{new Date(resp.created_at).toLocaleString()}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={{ color: 'gray', marginBottom: 15 }}>Belum ada tanggapan resmi.</Text>
        )}

        <Text style={[styles.subtitle, { marginTop: 20 }]}>Komentar Warga:</Text>
        {comments.length > 0 ? (
          comments.map((c) => (
            <View key={c.id} style={[styles.commentCard, { flexDirection: 'row', gap: 10, alignItems: 'flex-start' }]}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#9CD5FF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginTop: 2 }}>
                {c.user_profile_image ? (
                  <Image source={{ uri: `${IMG_URL}${c.user_profile_image}` }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text style={{ color: '#355872', fontWeight: 'bold', fontSize: 12 }}>{c.user_name?.[0]?.toUpperCase() || 'U'}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.commentHeader}>
                  <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#355872' }}>{c.user_name}</Text>
                  <Text style={{ fontSize: 10, color: 'gray' }}>{new Date(c.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={{ marginTop: 4, color: '#333', fontSize: 13 }}>{c.comment}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={{ color: 'gray', marginBottom: 15 }}>Belum ada komentar.</Text>
        )}
      </ScrollView>

      {/* Floating Comment Input */}
      <View style={styles.commentInputContainer}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#9CD5FF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginRight: 8 }}>
          {currentUser?.profile_image ? (
            <Image source={{ uri: `${IMG_URL}${currentUser.profile_image}` }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Text style={{ color: '#355872', fontWeight: 'bold', fontSize: 11 }}>{currentUser?.name?.[0]?.toUpperCase() || 'U'}</Text>
          )}
        </View>
        <TextInput 
          style={styles.commentInput} 
          placeholder="Tulis komentar..." 
          value={commentText}
          onChangeText={setCommentText}
        />
        <TouchableOpacity style={styles.commentBtn} onPress={submitComment}>
          <Text style={styles.commentBtnText}>Kirim</Text>
        </TouchableOpacity>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { padding: 15, backgroundColor: 'white', borderRadius: 8, elevation: 2, marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  status: { color: '#355872', fontWeight: 'bold', marginTop: 5 },
  locationText: { color: '#355872', fontWeight: 'bold', marginTop: 10, fontSize: 13, backgroundColor: '#9CD5FF', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  image: { width: '100%', height: 200, marginTop: 15, resizeMode: 'cover', borderRadius: 8 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  responseCard: { padding: 12, backgroundColor: '#9CD5FF', borderRadius: 8, marginBottom: 10 },
  commentCard: { padding: 12, backgroundColor: 'white', borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commentInputContainer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    flexDirection: 'row', padding: 10, backgroundColor: 'white', 
    borderTopWidth: 1, borderColor: '#ddd', alignItems: 'center' 
  },
  commentInput: { flex: 1, backgroundColor: '#F7F8F0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10 },
  commentBtn: { backgroundColor: '#355872', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20 },
  commentBtnText: { color: 'white', fontWeight: 'bold' },
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
