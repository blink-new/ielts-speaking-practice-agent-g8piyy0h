export const APP_CONFIG = {
  // WebSocket configuration
  WEBSOCKET_URL: 'wss://echo.websocket.org', // Replace with your actual WebSocket server
  
  // ElevenLabs configuration (these would be stored securely in production)
  ELEVENLABS_API_URL: 'https://api.elevenlabs.io/v1',
  
  // Audio recording settings
  AUDIO_RECORDING_OPTIONS: {
    android: {
      extension: '.m4a',
      outputFormat: 'mpeg4',
      audioEncoder: 'aac',
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
    },
    ios: {
      extension: '.m4a',
      outputFormat: 'mpeg4',
      audioQuality: 'MAX',
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
  },
  
  // UI configuration
  AVATAR_SIZE_RATIO: 0.4, // 40% of screen width
  ANIMATION_DURATION: {
    SHORT: 200,
    MEDIUM: 400,
    LONG: 600,
  },
  
  // IELTS band scores
  BAND_SCORES: [6.5, 7.0, 7.5, 8.0, 8.5, 9.0],
  
  // Test modes
  TEST_MODES: {
    EXAMINER: 'examiner',
    COACH: 'coach',
  } as const,
  
  // Voice options (these would be fetched from ElevenLabs API in production)
  AVAILABLE_VOICES: [
    {
      id: 'juniper',
      name: 'Juniper',
      description: 'Open and upbeat',
      accent: 'British',
      gender: 'female' as const,
    },
    {
      id: 'sarah',
      name: 'Sarah',
      description: 'Professional and clear',
      accent: 'American',
      gender: 'female' as const,
    },
    {
      id: 'james',
      name: 'James',
      description: 'Warm and encouraging',
      accent: 'British',
      gender: 'male' as const,
    },
    {
      id: 'alex',
      name: 'Alex',
      description: 'Confident and supportive',
      accent: 'Australian',
      gender: 'male' as const,
    },
    {
      id: 'emma',
      name: 'Emma',
      description: 'Friendly and patient',
      accent: 'Canadian',
      gender: 'female' as const,
    },
  ],
  
  // Colors
  COLORS: {
    PRIMARY: '#2563EB',
    ACCENT: '#F59E0B',
    BACKGROUND: '#F8FAFC',
    DARK_MODE: '#0F172A',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    LISTENING: '#F59E0B',
    PROCESSING: '#8B5CF6',
    SPEAKING: '#10B981',
  },
} as const;

export type TestMode = typeof APP_CONFIG.TEST_MODES[keyof typeof APP_CONFIG.TEST_MODES];
export type VoiceGender = 'male' | 'female';
export type ConversationState = 'idle' | 'listening' | 'processing' | 'speaking';