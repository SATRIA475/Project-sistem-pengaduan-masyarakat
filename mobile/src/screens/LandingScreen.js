import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import api, { baseURL } from '../api'; // assuming baseURL is exported or we just use full URLs if needed

const { width } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
  const [stats, setStats] = useState({ total: 0, resolved: 0, users: 0, locations: 0 });
  const [publicComplaints, setPublicComplaints] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchPublicComplaints();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/complaints/public/stats');
      const { totalUsers, totalCount, resolvedCount, locationsCount } = res.data;
      setStats({
        total: totalCount,
        resolved: resolvedCount,
        users: totalUsers,
        locations: locationsCount
      });
    } catch (error) {
      console.warn('Could not retrieve stats:', error);
    }
  };

  const fetchPublicComplaints = async () => {
    try {
      const res = await api.get('/complaints/public/list');
      setPublicComplaints(res.data);
    } catch (error) {
      console.warn('Could not retrieve public complaints:', error);
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
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <Text style={styles.logo}>LaporPak</Text>
        <TouchableOpacity style={styles.navLoginBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.navLoginText}>Masuk</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HERO SECTION */}
        <View style={styles.heroSection}>
          <View style={styles.badge}>
            <Feather name="star" size={12} color="#7AAACE" style={{marginRight: 4}} />
            <Text style={styles.badgeText}>SUPPORTING COMMUNITIES</Text>
          </View>
          
          <Text style={styles.headline}>
            Transformasi Desa Melalui{'\n'}
            <Text style={styles.highlight}>Partisipasi Digital.</Text>
          </Text>
          
          <Text style={styles.subheadline}>
            Menghubungkan aspirasi warga dengan aksi nyata pemerintah desa. Cepat, transparan, dan berdampak langsung bagi kemajuan infrastruktur serta kerukunan sosial.
          </Text>

          <View style={styles.heroButtons}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Buat Laporan</Text>
              <Feather name="arrow-up-right" size={20} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => setIsPopupOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Eksplorasi Dampak</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar Participants */}
          <View style={styles.participantsContainer}>
            <View style={styles.avatarRow}>
              <View style={[styles.avatarCircle, { backgroundColor: '#7AAACE', zIndex: 4 }]}><Text style={styles.avatarTextWhite}>A</Text></View>
              <View style={[styles.avatarCircle, { backgroundColor: '#EAECE4', zIndex: 3, marginLeft: -12 }]}><Text style={styles.avatarTextDark}>B</Text></View>
              <View style={[styles.avatarCircle, { backgroundColor: '#355872', zIndex: 2, marginLeft: -12 }]}><Text style={styles.avatarTextWhite}>W</Text></View>
              <View style={[styles.avatarCircle, { backgroundColor: '#1A2B38', zIndex: 1, marginLeft: -12 }]}><Text style={styles.avatarTextHighlight}>+{stats.users}</Text></View>
            </View>
            <Text style={styles.participantsText}>WARGA TELAH{'\n'}BERPARTISIPASI</Text>
          </View>
        </View>

        {/* STATS SECTION */}
        <View style={styles.statsSection}>
          <View style={styles.statGrid}>
            <View style={styles.statCardGrid}>
              <Text style={styles.statNumber}>{stats.resolved.toLocaleString()}+</Text>
              <Text style={styles.statLabel}>LAPORAN SELESAI</Text>
            </View>
            <View style={styles.statCardGrid}>
              <Text style={styles.statNumber}>1</Text>
              <Text style={styles.statLabel}>DESA AKTIF</Text>
            </View>
            <View style={styles.statCardGrid}>
              <Text style={styles.statNumber}>24h</Text>
              <Text style={styles.statLabel}>RESPON RATA-RATA</Text>
            </View>
            <View style={styles.statCardGrid}>
              <Text style={styles.statNumber}>98%</Text>
              <Text style={styles.statLabel}>KEPUASAN WARGA</Text>
            </View>
          </View>
        </View>

        {/* ALUR KERJA SECTION */}
        <View style={styles.workflowSection}>
          <Text style={styles.sectionSubtitleSmall}>PROSES PLATFORM</Text>
          <Text style={styles.sectionTitle}>Alur Kerja yang Transparan & Terpercaya</Text>
          <Text style={styles.sectionSubtitle}>Dirancang untuk memastikan setiap suara didengar dan setiap masalah diselesaikan dengan akuntabilitas tinggi.</Text>

          <View style={styles.workflowGrid}>
            {[
              { id: '01. PENGIRIMAN', title: 'Ambil & Kirim', desc: 'Laporkan masalah di lapangan dengan foto dan lokasi otomatis. Cepat dan mudah dari hp atau website.', icon: 'camera' },
              { id: '02. VERIFIKASI', title: 'Proses Cepat', desc: 'Admin desa memverifikasi laporan dalam hitungan jam. Anda akan menerima notifikasi setiap ada progres.', icon: 'clock' },
              { id: '03. PENYELESAIAN', title: 'Hasil Nyata', desc: 'Pekerjaan diselesaikan dan dipublikasikan di dashboard warga sebagai bentuk transparansi publik.', icon: 'check-circle' },
            ].map((step, idx) => (
              <View key={idx} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepIconBox}>
                    <Feather name={step.icon} size={24} color="#355872" />
                  </View>
                  <Text style={styles.stepIdText}>{step.id}</Text>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* GEO-MONITORING SECTION */}
        <View style={styles.featureSection}>
          <View style={styles.featureCard}>
            <View style={styles.featureIconBox}>
              <Feather name="map" size={24} color="#EAECE4" />
            </View>
            <Text style={styles.featureTitle}>Geo-Monitoring{'\n'}Interaktif</Text>
            <Text style={styles.featureDesc}>Pantau sebaran pembangunan dan perbaikan desa secara real-time melalui peta digital yang presisi dan mudah diakses.</Text>
            
            <TouchableOpacity 
              style={styles.mapButtonDisabled}
              onPress={() => navigation.navigate('Map')}
              activeOpacity={0.8}
            >
              <Text style={styles.mapButtonText}>Buka Peta Live ({stats.locations} Lokasi)</Text>
              <Feather name="chevron-right" size={16} color="#355872" />
            </TouchableOpacity>
          </View>
        </View>

        {/* CTA BOTTOM SECTION */}
        <View style={styles.ctaSection}>
          <View style={styles.ctaCard}>
            <Text style={styles.ctaHeadline}>Mulai Perubahan Besar Hari Ini.</Text>
            <Text style={styles.ctaSubheadline}>Jadilah bagian dari revolusi digital desa untuk masa depan yang lebih transparan.</Text>
            
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: '#FFF', marginBottom: 12 }]}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={[styles.primaryButtonText, { color: '#355872' }]}>Daftar sebagai Warga</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.secondaryButton, { borderColor: 'rgba(255,255,255,0.4)', borderWidth: 1 }]}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={[styles.secondaryButtonText, { color: '#FFF' }]}>Pelajari Lebih Lanjut</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* POPUP MODAL EKSPLORASI DAMPAK */}
      <Modal
        visible={isPopupOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsPopupOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Eksplorasi Dampak</Text>
                <Text style={styles.modalSubtitle}>Laporan nyata dari warga yang telah direspon.</Text>
              </View>
              <TouchableOpacity onPress={() => setIsPopupOpen(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#355872" />
              </TouchableOpacity>
            </View>

            {/* Modal Body / List */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {publicComplaints.length > 0 ? (
                publicComplaints.map((c) => (
                  <View key={c.id} style={styles.complaintCard}>
                    <View style={styles.complaintHeader}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(c.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(c.status) }]}>{getStatusLabel(c.status)}</Text>
                      </View>
                      <Text style={styles.dateText}>{new Date(c.created_at).toLocaleDateString('id-ID')}</Text>
                    </View>
                    
                    <Text style={styles.complaintTitle} numberOfLines={2}>{c.title}</Text>
                    <Text style={styles.complaintDesc} numberOfLines={3}>{c.description}</Text>
                    
                    <View style={styles.complaintFooter}>
                      <View style={styles.userAvatarSmall}>
                        <Text style={styles.userAvatarText}>{c.user_name ? c.user_name[0].toUpperCase() : 'W'}</Text>
                      </View>
                      <Text style={styles.userName}>{c.user_name}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Feather name="check-circle" size={48} color="#7AAACE" />
                  <Text style={styles.emptyText}>Belum ada laporan publik yang dapat ditampilkan.</Text>
                </View>
              )}
              {/* Extra space at bottom */}
              <View style={{height: 30}}/>
            </ScrollView>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8F0', // Match web background
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#F7F8F0',
  },
  logo: {
    fontSize: 24,
    fontWeight: '900',
    color: '#355872',
    letterSpacing: -0.5,
  },
  navLoginBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EAECE4',
  },
  navLoginText: {
    fontWeight: 'bold',
    color: '#355872',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  /* Hero Section */
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(234, 236, 228, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    color: '#355872',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headline: {
    fontSize: 40,
    fontWeight: '900',
    color: '#355872',
    lineHeight: 48,
    marginBottom: 16,
  },
  highlight: {
    color: '#355872',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  subheadline: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: 32,
  },
  heroButtons: {
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#355872',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#EAECE4',
    backgroundColor: '#FFF',
  },
  secondaryButtonText: {
    color: '#355872',
    fontWeight: 'bold',
    fontSize: 16,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    marginRight: 12,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#F7F8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextWhite: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  avatarTextDark: { color: '#355872', fontSize: 12, fontWeight: 'bold' },
  avatarTextHighlight: { color: '#7AAACE', fontSize: 10, fontWeight: 'bold' },
  participantsText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#888',
    letterSpacing: 0.5,
  },

  /* Stats Section */
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  statGrid: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(234, 236, 228, 0.3)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    shadowColor: '#355872',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    paddingVertical: 16,
  },
  statCardGrid: {
    width: '50%',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#355872',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#7AAACE',
    letterSpacing: 1,
    textAlign: 'center',
  },

  /* Workflow Section */
  workflowSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  sectionSubtitleSmall: {
    fontSize: 10,
    fontWeight: '900',
    color: '#7AAACE',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#355872',
    marginBottom: 8,
    lineHeight: 34,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  workflowGrid: {
    gap: 16,
  },
  stepCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(234, 236, 228, 0.3)',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FAFBF7',
    borderWidth: 1,
    borderColor: 'rgba(234, 236, 228, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIdText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#7AAACE',
    letterSpacing: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#355872',
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },

  /* Feature Section */
  featureSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  featureCard: {
    backgroundColor: '#355872',
    borderRadius: 24,
    padding: 32,
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  featureTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 12,
  },
  featureDesc: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
    marginBottom: 24,
  },
  mapButtonDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  mapButtonText: {
    color: '#355872',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },

  /* CTA Section */
  ctaSection: {
    paddingHorizontal: 24,
  },
  ctaCard: {
    backgroundColor: '#1A2B38',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    textAlign: 'center',
  },
  ctaHeadline: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaSubheadline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F7F8F0',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECE4',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#355872',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    flex: 1,
    padding: 24,
  },
  complaintCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EAECE4',
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  complaintTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A2B38',
    marginBottom: 6,
  },
  complaintDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  complaintFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EAECE4',
    paddingTop: 12,
  },
  userAvatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EAECE4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatarText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#355872',
  },
  userName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#355872',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
    textAlign: 'center',
    fontSize: 14,
  }
});
