import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker, Callout } from '../components/MapView';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api';

export default function MapScreen({ navigation }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default coordinate (Jakarta/Center of Indonesia)
  const initialRegion = {
    latitude: -6.2088,
    longitude: 106.8456,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints/public/list');
      // Filter out those without valid coordinates
      const withLocation = res.data.filter(c => c.latitude && c.longitude);
      setComplaints(withLocation);
    } catch (error) {
      console.warn('Could not retrieve public map locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'done' || status === 'approved') return '#10B981'; // emerald
    if (status === 'process') return '#3B82F6'; // blue
    return '#F59E0B'; // amber/pending
  };

  const getStatusLabel = (status) => {
    if (status === 'done' || status === 'approved') return 'Selesai';
    if (status === 'process') return 'Diproses';
    return 'Menunggu';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#355872" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Geo-Monitoring Live</Text>
          <Text style={styles.headerSubtitle}>{complaints.length} Laporan Ditemukan</Text>
        </View>
      </View>

      {/* Map Content */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <View style={styles.loadingContainer}>
            <Feather name="map" size={48} color="#355872" />
            <Text style={[styles.loadingText, { marginTop: 16 }]}>Peta interaktif hanya didukung di perangkat Mobile (Android/iOS).</Text>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#355872" />
            <Text style={styles.loadingText}>Memuat peta...</Text>
          </View>
        ) : (
          <MapView 
            style={styles.map}
            initialRegion={complaints.length > 0 ? {
              latitude: parseFloat(complaints[0].latitude),
              longitude: parseFloat(complaints[0].longitude),
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            } : initialRegion}
          >
            {complaints.map((c) => (
              <Marker
                key={c.id}
                coordinate={{
                  latitude: parseFloat(c.latitude),
                  longitude: parseFloat(c.longitude)
                }}
                pinColor={getStatusColor(c.status)}
              >
                <Callout tooltip>
                  <View style={styles.calloutContainer}>
                    <View style={styles.calloutBubble}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(c.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(c.status) }]}>
                          {getStatusLabel(c.status)}
                        </Text>
                      </View>
                      <Text style={styles.calloutTitle} numberOfLines={2}>{c.title}</Text>
                      <Text style={styles.calloutReporter}>Oleh {c.user_name}</Text>
                    </View>
                    <View style={styles.calloutArrow} />
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EAECE4',
    backgroundColor: '#FFF',
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    backgroundColor: '#F7F8F0',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#355872',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8F0',
  },
  loadingText: {
    marginTop: 12,
    color: '#355872',
    fontWeight: 'bold',
  },
  calloutContainer: {
    alignItems: 'center',
    width: 200,
  },
  calloutBubble: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAECE4',
    width: '100%',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A2B38',
    marginBottom: 4,
  },
  calloutReporter: {
    fontSize: 11,
    color: '#666',
  },
  calloutArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 0,
    borderLeftWidth: 10,
    borderTopColor: '#EAECE4',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  }
});
