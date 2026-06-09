import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function OnboardingScreen({ route, navigation }) {
  const { role } = route.params || { role: 'user' };
  const [isSplashActive, setIsSplashActive] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    // Splash timeout of 2.5 seconds, then transition to onboarding slides
    const timer = setTimeout(() => {
      setIsSplashActive(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleNextSlide = () => {
    if (slideIndex < 2) {
      setSlideIndex(prev => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleSkipOnboarding = () => {
    finishOnboarding();
  };

  const finishOnboarding = () => {
    // Navigate directly to the final dashboard depending on the user's role
    if (role === 'admin' || role === 'super_admin') {
      navigation.replace('AdminHome');
    } else {
      navigation.replace('Home');
    }
  };

  // 1. SPLASH SCREEN STATE (Exact Sage Gradient Match)
  if (isSplashActive) {
    return (
      <View style={styles.splashContainer}>
        {/* Subtle Background Radial Pattern Effect */}
        <View style={styles.splashBackgroundCircle1} />
        <View style={styles.splashBackgroundCircle2} />

        <View style={styles.splashContent}>
          {/* Circular Icon Holder */}
          <View style={styles.splashIconCircle}>
            <View style={styles.splashIconInner}>
              <FontAwesome5 name="users" size={32} color="#355872" />
            </View>
          </View>

          {/* Brand Name */}
          <Text style={styles.splashLogoText}>LaporPak</Text>
        </View>

        {/* Footer */}
        <Text style={styles.splashFooterText}>Dari Desa untuk Desa</Text>
      </View>
    );
  }

  // 2. ONBOARDING SCREEN STATE (Interactive 3-Slide Flow with Vector Illustrations)
  const onboardingSlides = [
    {
      title: "Laporkan Masalah",
      description: "Foto dan laporkan fasilitas publik yang rusak dengan mudah. Bantu kami membangun lingkungan yang lebih baik.",
      illustration: (
        <View style={styles.mockupIllustrationScreen}>
          {/* Minimalist Town Illustration */}
          <View style={styles.townSun} />
          <View style={styles.townHill} />
          <View style={styles.townBuildingRow}>
            <View style={[styles.townBuilding, { height: 60, width: 28, left: 20 }]} />
            <View style={[styles.townBuilding, { height: 80, width: 34, left: 54 }]} />
            <View style={[styles.townBuilding, { height: 50, width: 30, left: 94 }]} />
          </View>
          <View style={styles.townRoad}>
            {/* Damaged Pothole representation */}
            <View style={styles.townPothole} />
            {/* Standing people avatar representation */}
            <View style={[styles.illustrationAvatar, { left: 40, bottom: 20 }]}>
              <View style={styles.avatarHead} />
              <View style={styles.avatarBody} />
            </View>
            <View style={[styles.illustrationAvatar, { left: 75, bottom: 22 }]}>
              <View style={styles.avatarHead} />
              <View style={styles.avatarBody} />
            </View>
          </View>
        </View>
      )
    },
    {
      title: "Pantau Real-Time",
      description: "Dapatkan tanggapan langsung dari pemerintah desa setempat secara transparan dan tuntas tanpa kendala.",
      illustration: (
        <View style={[styles.mockupIllustrationScreen, { backgroundColor: '#F7F8F0' }]}>
          {/* Discussion Thread representation */}
          <View style={styles.mockNotificationBubble}>
            <View style={styles.mockNotifDot} />
            <View style={styles.mockNotifLineLong} />
          </View>
          <View style={styles.mockMessageBubbleLeft}>
            <View style={styles.mockMsgLineLong} />
            <View style={styles.mockMsgLineShort} />
          </View>
          <View style={styles.mockMessageBubbleRight}>
            <View style={styles.mockMsgLineLongRight} />
            <View style={styles.mockMsgLineShortRight} />
          </View>
          <View style={styles.verifiedCheckCircle}>
            <Feather name="check" size={24} color="#FFF" />
          </View>
        </View>
      )
    },
    {
      title: "Bersama Membangun",
      description: "Berikan dukungan pada laporan warga lain dan berkontribusi langsung untuk kemajuan desa tercinta.",
      illustration: (
        <View style={[styles.mockupIllustrationScreen, { backgroundColor: '#9CD5FF' }]}>
          {/* Social support & leaderboard representation */}
          <View style={styles.leaderboardCard}>
            <View style={styles.leaderboardRow}>
              <View style={[styles.avatarCircleSmall, { backgroundColor: '#FFD700' }]} />
              <View style={styles.leaderboardTextLine} />
            </View>
            <View style={styles.leaderboardRow}>
              <View style={[styles.avatarCircleSmall, { backgroundColor: '#C0C0C0' }]} />
              <View style={styles.leaderboardTextLine} />
            </View>
          </View>
          <View style={styles.heartFloat}>
            <Feather name="thumbs-up" size={22} color="#FFF" />
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>Active Citizen</Text>
          </View>
        </View>
      )
    }
  ];

  const currentSlide = onboardingSlides[slideIndex];

  return (
    <SafeAreaView style={styles.onboardContainer}>
      {/* Top Navbar */}
      <View style={styles.onboardHeader}>
        <TouchableOpacity onPress={handleSkipOnboarding}>
          <Text style={styles.skipBtnText}>Lewati</Text>
        </TouchableOpacity>
      </View>

      {/* Main Mockup Illustration Card */}
      <View style={styles.onboardCardWrapper}>
        <View style={styles.illustrationCardOuter}>
          {/* Embedded Phone Mockup */}
          <View style={styles.phoneMockupFrame}>
            {/* Notch */}
            <View style={styles.phoneNotch} />
            {/* Screen Content */}
            {currentSlide.illustration}
          </View>
        </View>
      </View>

      {/* Bottom Panel */}
      <View style={styles.onboardBottomPanel}>
        {/* Pagination Indicators */}
        <View style={styles.paginationRow}>
          <View style={[styles.paginationDot, slideIndex === 0 ? styles.paginationDotActive : styles.paginationDotInactive]} />
          <View style={[styles.paginationDot, slideIndex === 1 ? styles.paginationDotActive : styles.paginationDotInactive]} />
          <View style={[styles.paginationDot, slideIndex === 2 ? styles.paginationDotActive : styles.paginationDotInactive]} />
        </View>

        {/* Typography Text */}
        <Text style={styles.onboardTitle}>{currentSlide.title}</Text>
        <Text style={styles.onboardDesc}>{currentSlide.description}</Text>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.onboardPrimaryBtn}
          onPress={handleNextSlide}
          activeOpacity={0.9}
        >
          <Text style={styles.onboardBtnText}>
            {slideIndex === 2 ? "Mulai Sekarang" : "Lanjutkan"}
          </Text>
          <Feather name="arrow-right" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // SPLASH STYLE RULES (Matches Image 1 exactly)
  splashContainer: {
    flex: 1,
    backgroundColor: '#F7F8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  splashBackgroundCircle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#F7F8F0',
    opacity: 0.5,
    top: -100,
    left: -100,
  },
  splashBackgroundCircle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#F7F8F0',
    opacity: 0.4,
    bottom: -50,
    right: -50,
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashIconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(235, 239, 232, 0.8)',
    borderWidth: 1,
    borderColor: '#F7F8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#355872',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 28,
  },
  splashIconInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F7F8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogoText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#355872',
    letterSpacing: -1,
  },
  splashFooterText: {
    position: 'absolute',
    bottom: 50,
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ONBOARDING STYLE RULES (Matches Image 2 exactly)
  onboardContainer: {
    flex: 1,
    backgroundColor: '#F7F8F0',
    justifyContent: 'space-between',
  },
  onboardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 24 : 12,
  },
  skipBtnText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#F3F4EE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  onboardCardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  illustrationCardOuter: {
    width: width * 0.82,
    height: width * 0.85,
    backgroundColor: '#F7F8F0',
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: '#F7F8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  phoneMockupFrame: {
    width: width * 0.54,
    height: width * 0.72,
    backgroundColor: '#355872',
    borderRadius: 24,
    borderWidth: 5,
    borderColor: '#355872',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  phoneNotch: {
    position: 'absolute',
    top: 0,
    left: '25%',
    width: '50%',
    height: 15,
    backgroundColor: '#355872',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 10,
  },
  mockupIllustrationScreen: {
    flex: 1,
    backgroundColor: '#7AAACE',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  townSun: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E9EAD8',
    opacity: 0.8,
  },
  townHill: {
    position: 'absolute',
    bottom: 25,
    width: '120%',
    height: 60,
    backgroundColor: '#355872',
    borderRadius: 100,
  },
  townBuildingRow: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    height: 80,
  },
  townBuilding: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#7AAACE',
    borderRadius: 4,
    opacity: 0.9,
  },
  townRoad: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 32,
    backgroundColor: '#354338',
  },
  townPothole: {
    position: 'absolute',
    left: '42%',
    top: '30%',
    width: 24,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#355872',
  },
  illustrationAvatar: {
    position: 'absolute',
    width: 14,
    height: 24,
  },
  avatarHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F7F8F0',
    alignSelf: 'center',
  },
  avatarBody: {
    width: 12,
    height: 14,
    backgroundColor: '#9CD5FF',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginTop: 2,
  },

  // Slide 2 Illustration
  mockNotificationBubble: {
    position: 'absolute',
    top: 25,
    width: '80%',
    height: 26,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mockNotifDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D97706' },
  mockNotifLineLong: { width: '70%', height: 6, borderRadius: 3, backgroundColor: '#E5E7EB' },
  mockMessageBubbleLeft: {
    position: 'absolute',
    left: 10,
    top: 65,
    width: '70%',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 8,
    gap: 4,
  },
  mockMsgLineLong: { width: '90%', height: 5, borderRadius: 2, backgroundColor: '#E5E7EB' },
  mockMsgLineShort: { width: '50%', height: 5, borderRadius: 2, backgroundColor: '#E5E7EB' },
  mockMessageBubbleRight: {
    position: 'absolute',
    right: 10,
    top: 110,
    width: '70%',
    backgroundColor: '#355872',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 8,
    gap: 4,
  },
  mockMsgLineLongRight: { width: '90%', height: 5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  mockMsgLineShortRight: { width: '50%', height: 5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  verifiedCheckCircle: {
    position: 'absolute',
    bottom: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Slide 3 Illustration
  leaderboardCard: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginTop: -30,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircleSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  leaderboardTextLine: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  heartFloat: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#355872',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#355872',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  scoreBadge: {
    position: 'absolute',
    bottom: 20,
    right: 15,
    backgroundColor: '#F7F8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scoreText: {
    color: '#355872',
    fontWeight: 'bold',
    fontSize: 10,
  },

  // Onboarding text details
  onboardBottomPanel: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    alignItems: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 24,
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: '#355872',
  },
  paginationDotInactive: {
    width: 6,
    backgroundColor: '#D1D5DB',
  },
  onboardTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#355872',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  onboardDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  onboardPrimaryBtn: {
    width: '100%',
    backgroundColor: '#355872',
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#355872',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  onboardBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
