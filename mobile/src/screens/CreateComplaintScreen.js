import React, { useState, useLayoutEffect } from 'react';
import { View, TextInput, StyleSheet, Image, Alert, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, FlatList, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons, Feather } from '@expo/vector-icons';
import api from '../api';

export default function CreateComplaintScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [category, setCategory] = useState('Infrastruktur');

  const categories = ['Infrastruktur', 'Kebersihan', 'Fasilitas', 'Keamanan', 'Lampu Jalan', 'Lainnya'];

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const getLocation = async () => {
    setIsGettingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Aplikasi butuh izin lokasi untuk fitur ini.');
        setIsGettingLocation(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      // Alert.alert('Sukses', 'Lokasi berhasil didapatkan!'); // Removed alert to match a smoother UX, we'll just show it in the UI
    } catch (error) {
      Alert.alert('Error', 'Gagal mendapatkan lokasi. Pastikan GPS nyala.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const submitComplaint = async () => {
    if (!title || !description) return Alert.alert('Error', 'Judul dan deskripsi wajib diisi');

    try {
      if (image) {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        
        const localUri = image.uri;
        const filename = localUri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const fileType = match ? `image/${match[1]}` : `image/jpeg`;
        
        formData.append('image', {
          uri: localUri,
          name: filename,
          type: fileType,
        });

        if (location) {
          formData.append('latitude', location.latitude.toString());
          formData.append('longitude', location.longitude.toString());
        }
        formData.append('category', category);

        await api.post('/complaints', formData, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        const payload = {
          title,
          description,
          category,
          latitude: location ? location.latitude.toString() : null,
          longitude: location ? location.longitude.toString() : null,
        };

        await api.post('/complaints', payload);
      }

      Alert.alert('Sukses', 'Pengaduan dikirim!');
      navigation.goBack();
    } catch (error) {
      console.log('Error submitting:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Gagal mengirim pengaduan. Silakan coba kembali.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
            <Feather name="x" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Buat Laporan</Text>
          <View style={styles.headerIcon} />
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          
          {/* Image Upload Area */}
          <TouchableOpacity style={styles.imageUploadContainer} onPress={pickImage} activeOpacity={0.7}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.iconCircle}>
                  <Feather name="camera" size={24} color="#355872" />
                  <View style={styles.plusBadge}>
                    <Feather name="plus" size={10} color="#FFF" />
                  </View>
                </View>
                <Text style={styles.imagePlaceholderTitle}>Ambil Foto</Text>
                <Text style={styles.imagePlaceholderSub}>atau unggah dari galeri</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Judul Singkat */}
          <Text style={styles.label}>Judul Singkat</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Cth: Pohon tumbang menutupi jalan" 
            placeholderTextColor="#999"
            value={title} 
            onChangeText={setTitle} 
          />
          
          {/* Kategori Masalah */}
          <Text style={styles.label}>Kategori Masalah</Text>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContainer}
            renderItem={({ item: cat }) => (
              <TouchableOpacity 
                style={[styles.categoryItem, category === cat && styles.categoryItemActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryItemText, category === cat && styles.categoryItemTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            )}
          />

          {/* Detail Informasi */}
          <Text style={styles.label}>Detail Informasi</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Jelaskan secara rinci mengenai kondisi, waktu kejadian, dan dampak yang ditimbulkan..." 
            placeholderTextColor="#999"
            value={description} 
            onChangeText={setDescription} 
            multiline 
            textAlignVertical="top"
          />
          
          {/* Lokasi Terkini */}
          <Text style={styles.label}>Lokasi Terkini</Text>
          <View style={styles.locationBox}>
            <View style={styles.mapPlaceholder}>
              {/* Dummy map background using a solid color to simulate a map area */}
              <View style={styles.mapBackground}>
                <Ionicons name="location-sharp" size={40} color="#355872" style={styles.mapPinIcon} />
              </View>
              
              <View style={styles.addressPill}>
                <Feather name="map" size={14} color="#666" />
                <Text style={styles.addressText} numberOfLines={1}>
                  {location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'Jl. Jend. Sudirman No. Kav 21'}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.detectLocationBtn} 
              onPress={getLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <Text style={styles.detectLocationText}>Mencari...</Text>
              ) : (
                <>
                  <Feather name="crosshair" size={16} color="#355872" />
                  <Text style={styles.detectLocationText}>Deteksi Lokasi Saya</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.submitButton} onPress={submitComplaint}>
            <Text style={styles.submitButtonText}>Kirim Laporan</Text>
          </TouchableOpacity>
        </View>

      
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FAFAF8',
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  imageUploadContainer: {
    width: '100%',
    height: 180,
    borderWidth: 1.5,
    borderColor: '#D4D4D4',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#FAFAF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EBECE6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#7AAACE',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EBECE6',
  },
  imagePlaceholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#355872',
    marginBottom: 4,
  },
  imagePlaceholderSub: {
    fontSize: 12,
    color: '#888',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F3F4F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#333',
    marginBottom: 24,
  },
  textArea: {
    height: 120,
  },
  categoryScroll: {
    marginBottom: 24,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 20,
  },
  categoryItem: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F0',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  categoryItemActive: {
    backgroundColor: '#355872',
    borderColor: '#355872',
  },
  categoryItemText: {
    fontSize: 13,
    color: '#555',
  },
  categoryItemTextActive: {
    color: '#FFF',
    fontWeight: '500',
  },
  locationBox: {
    marginBottom: 20,
  },
  mapPlaceholder: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#EAEAEA',
    position: 'relative',
    marginBottom: 12,
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#E0E4E8', // Slightly different color to simulate map area
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPinIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  addressPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  detectLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F0',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  detectLocationText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#355872',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FAFAF8',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  submitButton: {
    backgroundColor: '#355872',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
