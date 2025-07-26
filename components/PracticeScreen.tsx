import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Dimensions,
  ScrollView 
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
import { UserProfile } from '@/app/(tabs)/index';
import { APP_CONFIG, ConversationState } from '@/constants/AppConfig';
import ElevenLabsConversationService, { ConversationSession, ConversationMessage } from '@/services/ElevenLabsConversationService';

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
  const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

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

    // Initialize conversation session
    initializeConversation();

    return () => {
      // Cleanup on unmount
      ElevenLabsConversationService.endConversation();
    };
  }, []);

  const initializeConversation = async () => {
    try {
      setConnectionStatus('connecting');
      setConversationState('processing');

      // Start conversation with ElevenLabs agent
      const session = await ElevenLabsConversationService.startConversation({
        name: userProfile.name,
        targetBandScore: userProfile.targetBandScore,
        testMode: userProfile.testMode,
      });

      setCurrentSession(session);
      setConnectionStatus('connected');
      setConversationState('idle');

      // Show welcome message
      Alert.alert(
        'Session Started',
        `Your IELTS ${userProfile.testMode === 'examiner' ? 'Speaking Test' : 'Practice Session'} has begun. The examiner will speak first.`,
        [{ text: 'Ready', onPress: () => setConversationState('listening') }]
      );

    } catch (error) {
      console.error('Failed to initialize conversation:', error);
      setConnectionStatus('disconnected');
      setConversationState('idle');
      Alert.alert(
        'Connection Error',
        'Failed to connect to the IELTS examiner. Please check your internet connection and try again.',
        [{ text: 'Retry', onPress: initializeConversation }]
      );
    }
  };

  const startRecording = async () => {
    if (!currentSession || conversationState !== 'idle') {
      return;
    }

    try {
      await ElevenLabsConversationService.startRecording();
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
      Alert.alert('Recording Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    if (!isRecording || !currentSession) {
      return;
    }

    try {
      setIsRecording(false);
      setConversationState('processing');
      
      // Stop animations
      pulseAnimation.value = 0;
      microphoneScale.value = withTiming(1, { duration: 200 });

      // Get recorded audio and send to agent
      const audioUri = await ElevenLabsConversationService.stopRecording();
      const agentMessage = await ElevenLabsConversationService.sendAudioMessage(audioUri);

      // Update messages
      const updatedMessages = ElevenLabsConversationService.getMessages();
      setMessages(updatedMessages);

      // Set state to speaking while agent responds
      setConversationState('speaking');

      // After agent finishes speaking, return to idle
      setTimeout(() => {
        setConversationState('idle');
      }, 3000); // Adjust based on typical response length

    } catch (error) {
      console.error('Failed to process recording:', error);
      setConversationState('idle');
      Alert.alert('Processing Error', 'Failed to process your response. Please try again.');
    }
  };

  const endSession = async () => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end this practice session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Session', 
          style: 'destructive',
          onPress: async () => {
            await ElevenLabsConversationService.endConversation();
            setCurrentSession(null);
            setMessages([]);
            setConnectionStatus('disconnected');
            setConversationState('idle');
            onResetProfile();
          }
        }
      ]
    );
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
        return 'Listening to your response...';
      case 'processing':
        return 'Processing your answer...';
      case 'speaking':
        return 'Examiner is speaking...';
      default:
        return currentSession ? 'Ready for your response' : 'Connecting...';
    }
  };

  const getAvatarIcon = () => {
    switch (conversationState) {
      case 'listening':
        return 'mic';
      case 'processing':
        return 'hourglass';
      case 'speaking':
        return 'volume-high';
      default:
        return 'person';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={styles.header}
        entering={FadeInDown.duration(400)}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.menuButton} onPress={endSession}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          
          <View style={[
            styles.connectionStatus,
            { backgroundColor: connectionStatus === 'connected' ? APP_CONFIG.COLORS.SUCCESS : APP_CONFIG.COLORS.ERROR }
          ]}>
            <View style={styles.connectionDot} />
            <Text style={styles.connectionText}>
              {connectionStatus === 'connected' ? 'Live Session' : 'Connecting...'}
            </Text>
          </View>

          <TouchableOpacity style={styles.voiceButton} onPress={onChangeVoice}>
            <Ionicons name="settings" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <Text style={styles.greeting}>
          {userProfile.testMode === 'examiner' ? 'IELTS Speaking Test' : 'Practice Session'}
        </Text>
        <Text style={styles.modeText}>
          {userProfile.name} • Target Band: {userProfile.targetBandScore} • 
          Voice: {userProfile.selectedVoice || 'Default'}
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
              name={getAvatarIcon()} 
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
          {currentSession && (
            <Text style={styles.sessionInfo}>
              Session ID: {currentSession.conversationId.slice(-8)}
            </Text>
          )}
        </Animated.View>

        <Animated.View 
          style={styles.controlsContainer}
          entering={FadeInDown.duration(600).delay(600)}
        >
          <Animated.View style={microphoneAnimatedStyle}>
            <TouchableOpacity
              style={[
                styles.microphoneButton,
                isRecording && styles.microphoneButtonActive,
                (conversationState === 'processing' || conversationState === 'speaking') && styles.microphoneButtonDisabled
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={!currentSession || conversationState === 'processing' || conversationState === 'speaking'}
            >
              <Ionicons 
                name={isRecording ? "stop" : "mic"} 
                size={32} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.microphoneHint}>
            {!currentSession 
              ? 'Connecting to examiner...'
              : isRecording 
                ? 'Tap to stop recording' 
                : conversationState === 'speaking'
                  ? 'Listen to the examiner'
                  : conversationState === 'processing'
                    ? 'Processing your response...'
                    : 'Tap to start speaking'
            }
          </Text>
        </Animated.View>

        {/* Conversation History */}
        {messages.length > 0 && (
          <Animated.View 
            style={styles.conversationHistory}
            entering={FadeInDown.duration(600).delay(800)}
          >
            <Text style={styles.historyTitle}>Conversation</Text>
            <ScrollView style={styles.messagesList} showsVerticalScrollIndicator={false}>
              {messages.slice(-3).map((message) => (
                <View 
                  key={message.id} 
                  style={[
                    styles.messageItem,
                    message.type === 'user' ? styles.userMessage : styles.agentMessage
                  ]}
                >
                  <Text style={styles.messageType}>
                    {message.type === 'user' ? 'You' : 'Examiner'}
                  </Text>
                  <Text style={styles.messageContent}>{message.content}</Text>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        )}
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
    fontSize: 14,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  sessionInfo: {
    fontSize: 12,
    color: '#6B7280',
  },
  controlsContainer: {
    alignItems: 'center',
    marginBottom: 32,
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
  microphoneButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowColor: '#9CA3AF',
  },
  microphoneHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  conversationHistory: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  messagesList: {
    maxHeight: 120,
  },
  messageItem: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
  },
  userMessage: {
    backgroundColor: '#EBF4FF',
    alignSelf: 'flex-end',
  },
  agentMessage: {
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
  },
  messageType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
});