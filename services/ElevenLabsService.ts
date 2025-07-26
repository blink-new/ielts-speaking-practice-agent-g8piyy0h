import { Audio } from 'expo-av';

export interface ElevenLabsVoice {
  id: string;
  name: string;
  description: string;
  gender: string;
  accent: string;
  category: string;
  previewUrl?: string;
}

export interface TTSResponse {
  success: boolean;
  audioData?: string;
  contentType?: string;
  error?: string;
}

class ElevenLabsService {
  private static instance: ElevenLabsService;
  private baseUrl = 'https://g8piyy0h--elevenlabs-tts.functions.blink.new';
  private voicesUrl = 'https://g8piyy0h--elevenlabs-voices.functions.blink.new';
  private currentSound: Audio.Sound | null = null;

  static getInstance(): ElevenLabsService {
    if (!ElevenLabsService.instance) {
      ElevenLabsService.instance = new ElevenLabsService();
    }
    return ElevenLabsService.instance;
  }

  async getAvailableVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await fetch(this.voicesUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch voices');
      }

      return data.voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      // Return fallback voices if API fails
      return this.getFallbackVoices();
    }
  }

  async generateSpeech(text: string, voiceId: string): Promise<string | null> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceId,
          stability: 0.5,
          similarityBoost: 0.75,
        }),
      });

      const data: TTSResponse = await response.json();
      
      if (!data.success || !data.audioData) {
        throw new Error(data.error || 'Failed to generate speech');
      }

      // Convert base64 to data URI
      const audioUri = `data:${data.contentType};base64,${data.audioData}`;
      return audioUri;
    } catch (error) {
      console.error('Error generating speech:', error);
      return null;
    }
  }

  async playAudio(audioUri: string): Promise<void> {
    try {
      // Stop any currently playing audio
      await this.stopAudio();

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );

      this.currentSound = sound;

      // Set up playback status update
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          this.stopAudio();
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  async stopAudio(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        this.currentSound = null;
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
    }
  }

  async previewVoice(voiceId: string, sampleText: string = "Hello! I'm your IELTS speaking examiner. Let's begin your practice session."): Promise<void> {
    try {
      const audioUri = await this.generateSpeech(sampleText, voiceId);
      if (audioUri) {
        await this.playAudio(audioUri);
      }
    } catch (error) {
      console.error('Error previewing voice:', error);
    }
  }

  private getFallbackVoices(): ElevenLabsVoice[] {
    return [
      {
        id: 'pNInz6obpgDQGcFmaJgB',
        name: 'Adam',
        description: 'Deep, authoritative voice perfect for formal examinations',
        gender: 'male',
        accent: 'american',
        category: 'premade',
      },
      {
        id: 'EXAVITQu4vr4xnSDxMaL',
        name: 'Bella',
        description: 'Clear, professional female voice with neutral accent',
        gender: 'female',
        accent: 'american',
        category: 'premade',
      },
      {
        id: 'VR6AewLTigWG4xSOukaG',
        name: 'Arnold',
        description: 'Confident, experienced examiner voice',
        gender: 'male',
        accent: 'american',
        category: 'premade',
      },
      {
        id: 'MF3mGyEYCl7XYWbV9V6O',
        name: 'Elli',
        description: 'Warm, encouraging coach voice',
        gender: 'female',
        accent: 'american',
        category: 'premade',
      },
      {
        id: 'TxGEqnHWrfWFTfGW9XjX',
        name: 'Josh',
        description: 'Young, energetic speaking coach',
        gender: 'male',
        accent: 'american',
        category: 'premade',
      },
    ];
  }

  // IELTS-specific speech generation
  async generateIELTSIntroduction(userName: string, voiceId: string): Promise<string | null> {
    const introText = `Hello ${userName}! Welcome to your IELTS speaking practice session. I'm your examiner today. We'll go through three parts: introduction and interview, a short speech, and a discussion. Are you ready to begin?`;
    return this.generateSpeech(introText, voiceId);
  }

  async generateIELTSQuestion(question: string, voiceId: string): Promise<string | null> {
    return this.generateSpeech(question, voiceId);
  }

  async generateIELTSFeedback(feedback: string, voiceId: string): Promise<string | null> {
    return this.generateSpeech(feedback, voiceId);
  }
}

export default ElevenLabsService;