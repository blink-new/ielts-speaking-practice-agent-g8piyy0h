import { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '@/app/(tabs)/index';
import { APP_CONFIG } from '@/constants/AppConfig';

interface OnboardingScreenProps {
  onComplete: (profile: Omit<UserProfile, 'selectedVoice'>) => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [name, setName] = useState('');
  const [targetBandScore, setTargetBandScore] = useState(7.0);
  const [testMode, setTestMode] = useState<'examiner' | 'coach'>('examiner');

  const handleContinue = () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name to continue.');
      return;
    }

    onComplete({
      name: name.trim(),
      targetBandScore,
      testMode,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View 
          style={styles.header}
          entering={FadeInUp.duration(600)}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="mic" size={48} color={APP_CONFIG.COLORS.PRIMARY} />
          </View>
          <Text style={styles.title}>Welcome to IELTS Speaking Practice</Text>
          <Text style={styles.subtitle}>
            Let's set up your personalized practice experience
          </Text>
        </Animated.View>

        <Animated.View 
          style={styles.form}
          entering={FadeInDown.duration(600).delay(200)}
        >
          {/* Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Target Band Score */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Target Band Score</Text>
            <View style={styles.bandScoreContainer}>
              {APP_CONFIG.BAND_SCORES.map((score) => (
                <TouchableOpacity
                  key={score}
                  style={[
                    styles.bandScoreButton,
                    targetBandScore === score && styles.bandScoreButtonActive
                  ]}
                  onPress={() => setTargetBandScore(score)}
                >
                  <Text style={[
                    styles.bandScoreText,
                    targetBandScore === score && styles.bandScoreTextActive
                  ]}>
                    {score}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Test Mode Selection */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Practice Mode</Text>
            <View style={styles.modeContainer}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  testMode === 'examiner' && styles.modeButtonActive
                ]}
                onPress={() => setTestMode('examiner')}
              >
                <View style={styles.modeIcon}>
                  <Ionicons 
                    name="school" 
                    size={24} 
                    color={testMode === 'examiner' ? '#FFFFFF' : APP_CONFIG.COLORS.PRIMARY} 
                  />
                </View>
                <View style={styles.modeContent}>
                  <Text style={[
                    styles.modeTitle,
                    testMode === 'examiner' && styles.modeTitleActive
                  ]}>
                    Speaking Examiner
                  </Text>
                  <Text style={[
                    styles.modeDescription,
                    testMode === 'examiner' && styles.modeDescriptionActive
                  ]}>
                    Official IELTS test simulation
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  testMode === 'coach' && styles.modeButtonActive
                ]}
                onPress={() => setTestMode('coach')}
              >
                <View style={styles.modeIcon}>
                  <Ionicons 
                    name="chatbubble-ellipses" 
                    size={24} 
                    color={testMode === 'coach' ? '#FFFFFF' : APP_CONFIG.COLORS.PRIMARY} 
                  />
                </View>
                <View style={styles.modeContent}>
                  <Text style={[
                    styles.modeTitle,
                    testMode === 'coach' && styles.modeTitleActive
                  ]}>
                    Speaking Coach
                  </Text>
                  <Text style={[
                    styles.modeDescription,
                    testMode === 'coach' && styles.modeDescriptionActive
                  ]}>
                    Relaxed practice with feedback
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <Animated.View 
          style={styles.footer}
          entering={FadeInDown.duration(600).delay(400)}
        >
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    paddingHorizontal: 24,
  },
  inputSection: {
    marginBottom: 32,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  bandScoreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bandScoreButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: 60,
    alignItems: 'center',
  },
  bandScoreButtonActive: {
    backgroundColor: APP_CONFIG.COLORS.PRIMARY,
    borderColor: APP_CONFIG.COLORS.PRIMARY,
  },
  bandScoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  bandScoreTextActive: {
    color: '#FFFFFF',
  },
  modeContainer: {
    gap: 16,
  },
  modeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  modeButtonActive: {
    backgroundColor: APP_CONFIG.COLORS.PRIMARY,
    borderColor: APP_CONFIG.COLORS.PRIMARY,
  },
  modeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modeContent: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  modeTitleActive: {
    color: '#FFFFFF',
  },
  modeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  modeDescriptionActive: {
    color: '#E5E7EB',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  continueButton: {
    backgroundColor: APP_CONFIG.COLORS.PRIMARY,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});