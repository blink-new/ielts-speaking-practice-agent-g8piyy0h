import { Audio } from 'expo-av';

export interface ConversationSession {
  conversationId: string;
  status: 'active' | 'ended';
  startTime: number;
  agentId: string;
}

export interface ConversationMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: number;
  audioUrl?: string;
}

class ElevenLabsConversationService {
  private baseUrl = 'https://g8piyy0h--elevenlabs-conversation.functions.blink.new';
  private currentSession: ConversationSession | null = null;
  private messages: ConversationMessage[] = [];
  private audioRecording: Audio.Recording | null = null;
  private audioSound: Audio.Sound | null = null;

  /**
   * Start a new conversation session with the ElevenLabs agent
   */
  async startConversation(userProfile: {
    name: string;
    targetBandScore: number;
    testMode: 'examiner' | 'coach';
  }): Promise<ConversationSession> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start_conversation',
          // Customize the agent behavior based on user profile
          system_prompt: this.generateSystemPrompt(userProfile),
          user_context: {
            name: userProfile.name,
            target_band_score: userProfile.targetBandScore,
            test_mode: userProfile.testMode,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start conversation: ${response.statusText}`);
      }

      const data = await response.json();
      
      this.currentSession = {
        conversationId: data.conversation_id,
        status: 'active',
        startTime: Date.now(),
        agentId: data.agent_id,
      };

      this.messages = [];
      
      return this.currentSession;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  }

  /**
   * Send audio recording to the conversational agent
   */
  async sendAudioMessage(audioUri: string): Promise<ConversationMessage> {
    if (!this.currentSession) {
      throw new Error('No active conversation session');
    }

    try {
      // Convert audio URI to blob
      const response = await fetch(audioUri);
      const audioBlob = await response.blob();

      // Send audio to ElevenLabs conversation API
      const conversationResponse = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_audio',
          conversationId: this.currentSession.conversationId,
          audioData: await this.blobToBase64(audioBlob),
        }),
      });

      if (!conversationResponse.ok) {
        throw new Error(`Failed to send audio: ${conversationResponse.statusText}`);
      }

      const data = await conversationResponse.json();

      // Add user message to history
      const userMessage: ConversationMessage = {
        id: `user_${Date.now()}`,
        type: 'user',
        content: data.user_transcript || '[Audio message]',
        timestamp: Date.now(),
        audioUrl: audioUri,
      };
      this.messages.push(userMessage);

      // Add agent response to history
      const agentMessage: ConversationMessage = {
        id: `agent_${Date.now()}`,
        type: 'agent',
        content: data.agent_response || '',
        timestamp: Date.now(),
        audioUrl: data.agent_audio_url,
      };
      this.messages.push(agentMessage);

      // Play agent response audio
      if (data.agent_audio_url) {
        await this.playAgentResponse(data.agent_audio_url);
      }

      return agentMessage;
    } catch (error) {
      console.error('Error sending audio message:', error);
      throw error;
    }
  }

  /**
   * Start recording user audio
   */
  async startRecording(): Promise<void> {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio recording permission not granted');
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();
      
      this.audioRecording = recording;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and return audio URI
   */
  async stopRecording(): Promise<string> {
    if (!this.audioRecording) {
      throw new Error('No active recording');
    }

    try {
      await this.audioRecording.stopAndUnloadAsync();
      const uri = this.audioRecording.getURI();
      this.audioRecording = null;
      
      if (!uri) {
        throw new Error('Failed to get recording URI');
      }

      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }

  /**
   * Play agent response audio
   */
  private async playAgentResponse(audioUrl: string): Promise<void> {
    try {
      // Unload previous sound
      if (this.audioSound) {
        await this.audioSound.unloadAsync();
      }

      // Load and play new sound
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      this.audioSound = sound;
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing agent response:', error);
    }
  }

  /**
   * End the current conversation session
   */
  async endConversation(): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    try {
      await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'end_conversation',
          conversationId: this.currentSession.conversationId,
        }),
      });

      this.currentSession = null;
      
      // Clean up audio resources
      if (this.audioRecording) {
        await this.audioRecording.stopAndUnloadAsync();
        this.audioRecording = null;
      }
      
      if (this.audioSound) {
        await this.audioSound.unloadAsync();
        this.audioSound = null;
      }
    } catch (error) {
      console.error('Error ending conversation:', error);
    }
  }

  /**
   * Get conversation messages
   */
  getMessages(): ConversationMessage[] {
    return [...this.messages];
  }

  /**
   * Get current session info
   */
  getCurrentSession(): ConversationSession | null {
    return this.currentSession;
  }

  /**
   * Generate system prompt based on user profile
   */
  private generateSystemPrompt(userProfile: {
    name: string;
    targetBandScore: number;
    testMode: 'examiner' | 'coach';
  }): string {
    const basePrompt = `You are an IELTS Speaking ${userProfile.testMode === 'examiner' ? 'Examiner' : 'Coach'} helping ${userProfile.name} prepare for the IELTS Speaking test. Their target band score is ${userProfile.targetBandScore}.`;

    if (userProfile.testMode === 'examiner') {
      return `${basePrompt}

As an IELTS Examiner, you should:
- Follow the official IELTS Speaking test format (Part 1: Introduction, Part 2: Long turn, Part 3: Discussion)
- Ask questions appropriate for band score ${userProfile.targetBandScore}
- Maintain a professional, neutral tone
- Keep responses concise and clear
- Provide minimal feedback during the test
- Time each part appropriately (Part 1: 4-5 mins, Part 2: 3-4 mins, Part 3: 4-5 mins)

Start with: "Good morning/afternoon, ${userProfile.name}. My name is [examiner name]. Can you tell me your full name, please?"`;
    } else {
      return `${basePrompt}

As an IELTS Speaking Coach, you should:
- Provide encouraging, supportive feedback
- Help improve pronunciation, fluency, and vocabulary
- Offer tips and strategies for better performance
- Ask follow-up questions to help practice
- Be more conversational and helpful than a formal examiner
- Focus on areas that need improvement for reaching band ${userProfile.targetBandScore}

Start with: "Hello ${userProfile.name}! I'm your IELTS Speaking Coach. I'm here to help you practice and improve your speaking skills. Let's start with some warm-up questions. How are you feeling about your IELTS preparation today?"`;
    }
  }

  /**
   * Convert blob to base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:audio/... prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export default new ElevenLabsConversationService();