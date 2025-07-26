import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { APP_CONFIG, VoiceGender } from '@/constants/AppConfig';
import ElevenLabsService, { ElevenLabsVoice } from '@/services/ElevenLabsService';

interface VoiceSelectionScreenProps {
  onVoiceSelected: (voiceId: string) => void;
  onBack: () => void;
}

interface Voice extends ElevenLabsVoice {
  gender: VoiceGender;
}

export function VoiceSelectionScreen({ onVoiceSelected, onBack }: VoiceSelectionScreenProps) {
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [playingVoice, setPlayingVoice] = useState<string>('');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const elevenLabsService = ElevenLabsService.getInstance();

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      setLoading(true);
      const elevenLabsVoices = await elevenLabsService.getAvailableVoices();
      
      // Map ElevenLabs voices to our Voice interface
      const mappedVoices: Voice[] = elevenLabsVoices.map(voice => ({
        ...voice,
        gender: voice.gender === 'female' ? 'female' : 'male' as VoiceGender,
      }));
      
      setVoices(mappedVoices);
    } catch (error) {
      console.error('Error loading voices:', error);
      Alert.alert('Error', 'Failed to load voices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoicePreview = async (voiceId: string) => {
    try {
      setPlayingVoice(voiceId);
      await elevenLabsService.previewVoice(voiceId);
    } catch (error) {
      console.error('Error previewing voice:', error);
      Alert.alert('Error', 'Failed to preview voice. Please try again.');
    } finally {
      setPlayingVoice('');
    }
  };

  const handleContinue = () => {
    if (!selectedVoice) {
      Alert.alert('Voice Selection Required', 'Please select a voice to continue.');
      return;
    }
    onVoiceSelected(selectedVoice);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View 
          style={styles.header}
          entering={FadeInUp.duration(600)}
        >
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={APP_CONFIG.COLORS.PRIMARY} />
          </TouchableOpacity>
          
          <Text style={styles.title}>Choose Your Examiner</Text>
          <Text style={styles.subtitle}>
            Select a voice that makes you feel comfortable and confident
          </Text>
        </Animated.View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={APP_CONFIG.COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Loading voices...</Text>
          </View>
        ) : (
          <View style={styles.voicesContainer}>
            {voices.map((voice, index) => (
            <Animated.View
              key={voice.id}
              entering={FadeInDown.duration(400).delay(index * 100)}
            >
              <TouchableOpacity
                style={[
                  styles.voiceCard,
                  selectedVoice === voice.id && styles.voiceCardSelected
                ]}
                onPress={() => setSelectedVoice(voice.id)}
              >
                <View style={styles.voiceHeader}>
                  <View style={[
                    styles.avatar,
                    voice.gender === 'female' ? styles.avatarFemale : styles.avatarMale
                  ]}>
                    <Ionicons 
                      name="person" 
                      size={32} 
                      color="#FFFFFF" 
                    />
                  </View>
                  
                  <View style={styles.voiceInfo}>
                    <Text style={[
                      styles.voiceName,
                      selectedVoice === voice.id && styles.voiceNameSelected
                    ]}>
                      {voice.name}
                    </Text>
                    <Text style={[
                      styles.voiceAccent,
                      selectedVoice === voice.id && styles.voiceAccentSelected
                    ]}>
                      {voice.accent} • {voice.gender === 'male' ? 'Male' : 'Female'}
                    </Text>
                  </View>

                  {selectedVoice === voice.id && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark-circle" size={24} color={APP_CONFIG.COLORS.PRIMARY} />
                    </View>
                  )}
                </View>

                <Text style={[
                  styles.voiceDescription,
                  selectedVoice === voice.id && styles.voiceDescriptionSelected
                ]}>
                  {voice.description}
                </Text>

                <TouchableOpacity
                  style={styles.previewButton}
                  onPress={() => handleVoicePreview(voice.id)}
                  disabled={playingVoice === voice.id}
                >
                  <Ionicons 
                    name={playingVoice === voice.id ? "stop" : "play"} 
                    size={16} 
                    color={APP_CONFIG.COLORS.PRIMARY} 
                  />
                  <Text style={styles.previewButtonText}>
                    {playingVoice === voice.id ? 'Playing...' : 'Preview Voice'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </Animated.View>
            ))}
          </View>
        )}

        <Animated.View 
          style={styles.footer}
          entering={FadeInDown.duration(600).delay(600)}
        >
          <TouchableOpacity 
            style={[
              styles.continueButton,
              !selectedVoice && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!selectedVoice}
          >
            <Text style={[
              styles.continueButtonText,
              !selectedVoice && styles.continueButtonTextDisabled
            ]}>
              Start Practice
            </Text>
            <Ionicons 
              name="arrow-forward" 
              size={20} 
              color={selectedVoice ? "#FFFFFF" : "#9CA3AF"} 
            />
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  voicesContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  voiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  voiceCardSelected: {
    borderColor: APP_CONFIG.COLORS.PRIMARY,
    backgroundColor: '#F8FAFF',
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarFemale: {
    backgroundColor: '#EC4899',
  },
  avatarMale: {
    backgroundColor: '#3B82F6',
  },
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  voiceNameSelected: {
    color: APP_CONFIG.COLORS.PRIMARY,
  },
  voiceAccent: {
    fontSize: 14,
    color: '#6B7280',
  },
  voiceAccentSelected: {
    color: '#4F46E5',
  },
  selectedIndicator: {
    marginLeft: 12,
  },
  voiceDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  voiceDescriptionSelected: {
    color: '#4F46E5',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: APP_CONFIG.COLORS.PRIMARY,
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
  continueButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  continueButtonTextDisabled: {
    color: '#9CA3AF',
  },
});