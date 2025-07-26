import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { VoiceSelectionScreen } from '@/components/VoiceSelectionScreen';
import { PracticeScreen } from '@/components/PracticeScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AppState = 'onboarding' | 'voice-selection' | 'practice';

export interface UserProfile {
  name: string;
  targetBandScore: number;
  testMode: 'examiner' | 'coach';
  selectedVoice?: string;
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>('onboarding');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    targetBandScore: 7.0,
    testMode: 'examiner',
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setUserProfile(profile);
        if (profile.selectedVoice) {
          setAppState('practice');
        } else {
          setAppState('voice-selection');
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const saveUserProfile = async (profile: UserProfile) => {
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
      setUserProfile(profile);
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  };

  const handleOnboardingComplete = (profile: Omit<UserProfile, 'selectedVoice'>) => {
    const updatedProfile = { ...profile };
    saveUserProfile(updatedProfile);
    setAppState('voice-selection');
  };

  const handleVoiceSelected = (voiceId: string) => {
    const updatedProfile = { ...userProfile, selectedVoice: voiceId };
    saveUserProfile(updatedProfile);
    setAppState('practice');
  };

  const handleResetProfile = () => {
    AsyncStorage.removeItem('userProfile');
    setUserProfile({
      name: '',
      targetBandScore: 7.0,
      testMode: 'examiner',
    });
    setAppState('onboarding');
  };

  return (
    <View style={styles.container}>
      {appState === 'onboarding' && (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      )}
      {appState === 'voice-selection' && (
        <VoiceSelectionScreen 
          onVoiceSelected={handleVoiceSelected}
          onBack={() => setAppState('onboarding')}
        />
      )}
      {appState === 'practice' && (
        <PracticeScreen 
          userProfile={userProfile}
          onChangeVoice={() => setAppState('voice-selection')}
          onResetProfile={handleResetProfile}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});