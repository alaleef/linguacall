export interface Language {
  code: string;
  name: string;
  flag: string;
  voiceName: string; // Default mapping (fallback)
}

export interface Voice {
  id: string;     // Gemini API voice name (e.g., 'Puck')
  name: string;   // Display name (e.g., 'Sarah')
  gender: 'Male' | 'Female' | 'Neutral';
  description: string;
}

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

export interface AudioVisualizerData {
  volume: number;
}