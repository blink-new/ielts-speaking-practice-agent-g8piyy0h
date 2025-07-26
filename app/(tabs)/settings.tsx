import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { APP_CONFIG } from '@/constants/AppConfig';

export default function Settings() {
  const settingsOptions = [
    {
      title: 'Audio Settings',
      subtitle: 'Microphone and speaker preferences',
      icon: 'volume-high' as const,
      onPress: () => {},
    },
    {
      title: 'Practice History',
      subtitle: 'View your past sessions',
      icon: 'time' as const,
      onPress: () => {},
    },
    {
      title: 'Feedback Settings',
      subtitle: 'Customize feedback preferences',
      icon: 'chatbubble' as const,
      onPress: () => {},
    },
    {
      title: 'About',
      subtitle: 'App version and information',
      icon: 'information-circle' as const,
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Animated.View 
          style={styles.header}
          entering={FadeInDown.duration(400)}
        >
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your IELTS practice experience</Text>
        </Animated.View>

        <View style={styles.settingsContainer}>
          {settingsOptions.map((option, index) => (
            <Animated.View
              key={option.title}
              entering={FadeInDown.duration(400).delay(index * 100)}
            >
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={option.onPress}
              >
                <View style={styles.settingIcon}>
                  <Ionicons name={option.icon} size={24} color={APP_CONFIG.COLORS.PRIMARY} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{option.title}</Text>
                  <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <Animated.View 
          style={styles.footer}
          entering={FadeInDown.duration(400).delay(500)}
        >
          <Text style={styles.footerText}>IELTS Speaking Practice v1.0</Text>
          <Text style={styles.footerSubtext}>Built with ❤️ for IELTS learners</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_CONFIG.COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  settingsContainer: {
    paddingHorizontal: 16,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});