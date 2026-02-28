export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];  // base64-encoded image strings for vision
  audio?: { url: string; duration: number }; // base64-encoded audio
  video?: { url: string; name: string }; // blob/base64 URL for playback
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}