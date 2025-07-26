import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  interpolate,
  Easing
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { UserProfile } from '@/app/(tabs)/index';
import { APP_CONFIG, ConversationState } from '@/constants/AppConfig';
import ElevenLabsService from '@/services/ElevenLabsService';

interface PracticeScreenProps {
  userProfile: UserProfile;
  onChangeVoice: () => void;
  onResetProfile: () => void;
}

const { width } = Dimensions.get('window');
const AVATAR_SIZE = width * APP_CONFIG.AVATAR_SIZE_RATIO;

export function PracticeScreen({ userProfile, onChangeVoice, onResetProfile }: PracticeScreenProps) {
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const elevenLabsService = ElevenLabsService.getInstance();

  // Animation values
  const pulseAnimation = useSharedValue(0);
  const breathingAnimation = useSharedValue(0);
  const microphoneScale = useSharedValue(1);

  useEffect(() => {
    // Start breathing animation
    breathingAnimation.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Initialize WebSocket connection
    initializeWebSocket();

    // Demo: Play welcome message after 2 seconds
    setTimeout(() => {
      if (userProfile.selectedVoice) {
        playWelcomeMessage();
      }
    }, 2000);

    return () => {
      if (websocket) {
        websocket.close();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const initializeWebSocket = () => {
    try {
      setConnectionStatus('connecting');
      const ws = new WebSocket(APP_CONFIG.WEBSOCKET_URL);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        setWebsocket(ws);
        
        // Send initial user profile
        ws.send(JSON.stringify({
          type: 'user_profile',
          data: userProfile
        }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        setWebsocket(null);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'agent_response':
        setConversationState('speaking');
        playAgentResponse(message.data.text);
        break;
      case 'listening':
        setConversationState('listening');
        break;
      case 'processing':
        setConversationState('processing');
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const playWelcomeMessage = async () => {
    try {
      if (!userProfile.selectedVoice) return;
      
      const welcomeText = await elevenLabsService.generateIELTSIntroduction(
        userProfile.name, 
        userProfile.selectedVoice
      );
      
      if (welcomeText) {
        setConversationState('speaking');
        await elevenLabsService.playAudio(welcomeText);
        setConversationState('idle');
      }
    } catch (error) {
      console.error('Error playing welcome message:', error);
    }
  };

  const playAgentResponse = async (text: string) => {
    try {
      if (!userProfile.selectedVoice) {
        console.warn('No voice selected, using default');
        return;
      }

      // Generate speech using ElevenLabs
      const audioUri = await elevenLabsService.generateSpeech(text, userProfile.selectedVoice);
      
      if (audioUri) {
        // Play the generated audio
        await elevenLabsService.playAudio(audioUri);
      }
      
      // Set state back to idle after playback
      setConversationState('idle');
    } catch (error) {
      console.error('Error playing agent response:', error);
      setConversationState('idle');
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to use this feature.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setConversationState('listening');

      // Start pulse animation
      pulseAnimation.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );

      // Scale microphone
      microphoneScale.value = withTiming(1.2, { duration: 200 });

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      setConversationState('processing');
      
      // Stop animations
      pulseAnimation.value = 0;
      microphoneScale.value = withTiming(1, { duration: 200 });

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri && websocket && connectionStatus === 'connected') {
        // In a real implementation, you would send the audio data to your server
        websocket.send(JSON.stringify({
          type: 'audio_data',
          data: { uri, timestamp: Date.now() }
        }));
      }

    } catch (error) {
      console.error('Failed to stop recording:', error);
      setConversationState('idle');
    }
  };

  // Animated styles
  const avatarAnimatedStyle = useAnimatedStyle(() => {
    const breathingScale = interpolate(breathingAnimation.value, [0, 1], [1, 1.05]);
    const pulseScale = interpolate(pulseAnimation.value, [0, 1], [1, 1.1]);
    
    return {
      transform: [{ scale: breathingScale * pulseScale }],
    };
  });

  const microphoneAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: microphoneScale.value }],
    };
  });

  const getAvatarColor = () => {
    switch (conversationState) {
      case 'listening':
        return APP_CONFIG.COLORS.LISTENING;
      case 'processing':
        return APP_CONFIG.COLORS.PROCESSING;
      case 'speaking':
        return APP_CONFIG.COLORS.SPEAKING;
      default:
        return APP_CONFIG.COLORS.PRIMARY;
    }
  };

  const getStatusText = () => {
    switch (conversationState) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'speaking':
        return 'Speaking...';
      default:
        return 'Ready to practice';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={styles.header}
        entering={FadeInDown.duration(400)}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.menuButton} onPress={onResetProfile}>
            <Ionicons name="menu" size={24} color="#6B7280" />
          </TouchableOpacity>
          
          <View style={[
            styles.connectionStatus,
            { backgroundColor: connectionStatus === 'connected' ? APP_CONFIG.COLORS.SUCCESS : APP_CONFIG.COLORS.ERROR }
          ]}>
            <View style={styles.connectionDot} />
            <Text style={styles.connectionText}>
              {connectionStatus === 'connected' ? 'Connected' : 'Offline'}
            </Text>
          </View>

          <TouchableOpacity style={styles.voiceButton} onPress={onChangeVoice}>
            <Ionicons name="person" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <Text style={styles.greeting}>Hello, {userProfile.name}!</Text>
        <Text style={styles.modeText}>
          {userProfile.testMode === 'examiner' ? 'IELTS Speaking Test' : 'Practice Session'} • 
          Target: {userProfile.targetBandScore}
        </Text>
      </Animated.View>

      <View style={styles.mainContent}>
        <Animated.View 
          style={[styles.avatarContainer, avatarAnimatedStyle]}
          entering={FadeInDown.duration(600).delay(200)}
        >
          <View style={[
            styles.avatar,
            { backgroundColor: getAvatarColor() }
          ]}>
            <Ionicons 
              name={conversationState === 'speaking' ? 'volume-high' : 'person'} 
              size={AVATAR_SIZE * 0.3} 
              color="#FFFFFF" 
            />
          </View>
          
          {conversationState === 'listening' && (
            <View style={styles.pulseRing}>
              <Animated.View style={[styles.pulseCircle, avatarAnimatedStyle]} />
            </View>
          )}
        </Animated.View>

        <Animated.View 
          style={styles.statusContainer}
          entering={FadeInDown.duration(600).delay(400)}
        >
          <Text style={styles.statusText}>{getStatusText()}</Text>
          <Text style={styles.voiceText}>Voice: {userProfile.selectedVoice || 'Default'}</Text>
        </Animated.View>

        <Animated.View 
          style={styles.controlsContainer}
          entering={FadeInDown.duration(600).delay(600)}
        >
          <Animated.View style={microphoneAnimatedStyle}>
            <TouchableOpacity
              style={[
                styles.microphoneButton,
                isRecording && styles.microphoneButtonActive
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={conversationState === 'processing' || conversationState === 'speaking'}
            >
              <Ionicons 
                name={isRecording ? "stop" : "mic"} 
                size={32} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.microphoneHint}>
            {isRecording ? 'Tap to stop recording' : 'Tap to start speaking'}
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_CONFIG.COLORS.BACKGROUND,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  modeText: {
    fontSize: 16,
    color: '#6B7280',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 48,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  pulseRing: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
  },
  pulseCircle: {
    flex: 1,
    borderRadius: (AVATAR_SIZE + 40) / 2,
    borderWidth: 2,
    borderColor: APP_CONFIG.COLORS.LISTENING,
    opacity: 0.3,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  voiceText: {
    fontSize: 14,
    color: '#6B7280',
  },
  controlsContainer: {
    alignItems: 'center',
  },
  microphoneButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: APP_CONFIG.COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: APP_CONFIG.COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  microphoneButtonActive: {
    backgroundColor: APP_CONFIG.COLORS.ERROR,
    shadowColor: APP_CONFIG.COLORS.ERROR,
  },
  microphoneHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});