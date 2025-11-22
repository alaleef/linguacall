import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { MODEL_NAME } from '../constants';
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';
import { ConnectionState, Language, Voice } from '../types';

interface UseGeminiLiveProps {
  selectedLanguage: Language;
  selectedVoice: Voice;
}

export const useGeminiLive = ({ selectedLanguage, selectedVoice }: UseGeminiLiveProps) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  // Audio Contexts
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  
  // Playback State
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Recording State
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  const cleanup = useCallback(() => {
    // Stop recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop all audio sources
    if (sourcesRef.current) {
      for (const source of sourcesRef.current) {
        try { source.stop(); } catch (e) {}
      }
      sourcesRef.current.clear();
    }

    // Close contexts
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    setConnectionState(ConnectionState.DISCONNECTED);
    setIsRecording(false);
    setVolumeLevel(0);
    nextStartTimeRef.current = 0;
  }, []);

  const connect = useCallback(async () => {
    try {
      setConnectionState(ConnectionState.CONNECTING);
      setError(null);
      setRecordedUrl(null);
      recordedChunksRef.current = [];

      // 1. Initialize Audio Contexts
      // Input Context (16kHz) for streaming to Gemini
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      // Output Context (24kHz) for playback and recording mixing
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // 2. Setup Recording Mixer (Destination) on Output Context
      // We will use the output context to mix both Mic (converted) and AI Audio.
      const recDest = outputAudioContextRef.current.createMediaStreamDestination();
      recordingDestinationRef.current = recDest;

      // 3. Setup Microphone Input
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // A. Mic for Gemini (Input Context) - Processed for 16kHz PCM
      const micSourceForAI = inputAudioContextRef.current.createMediaStreamSource(stream);
      const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      micSourceForAI.connect(scriptProcessor);
      scriptProcessor.connect(inputAudioContextRef.current.destination);

      // B. Mic for Recording (Output Context) - Mixed into the recording stream
      const micSourceForRecord = outputAudioContextRef.current.createMediaStreamSource(stream);
      micSourceForRecord.connect(recDest);

      // 4. Setup MediaRecorder (Records the mixed stream)
      mediaRecorderRef.current = new MediaRecorder(recDest.stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);

      // 5. Initialize Gemini Client
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const config = {
        model: MODEL_NAME,
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice.id } },
        },
        systemInstruction: `You are ${selectedVoice.name}, a friendly and patient language tutor.
        
        CURRENT LANGUAGE: ${selectedLanguage.name}
        
        YOUR INSTRUCTIONS:
        1. Speak ONLY in ${selectedLanguage.name}. Do not switch to English unless explicitly asked for a definition.
        2. Engage the user in a natural, spoken conversation (roleplay, daily life, getting to know you).
        3. If the user makes a mistake, gently repeat the correct phrase in your response, but keep the conversation flowing.
        4. Keep your responses concise, like a real phone call.
        5. If the user speaks a different language, kindly remind them (in ${selectedLanguage.name}) to practice ${selectedLanguage.name}.`,
      };

      // 6. Connect Session
      const sessionPromise = ai.live.connect({
        model: config.model,
        config,
        callbacks: {
          onopen: () => {
            setConnectionState(ConnectionState.CONNECTED);
            
            // Start sending audio to Gemini
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              
              // Calculate volume for visualizer
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              setVolumeLevel(Math.min(rms * 5, 1)); 

              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                ctx,
                24000,
                1
              );

              const sourceNode = ctx.createBufferSource();
              sourceNode.buffer = audioBuffer;
              
              // Connect AI Audio to Speaker (so user hears it)
              sourceNode.connect(ctx.destination);
              
              // Connect AI Audio to Recorder (so it's saved in the file)
              if (recordingDestinationRef.current) {
                sourceNode.connect(recordingDestinationRef.current);
              }

              sourceNode.addEventListener('ended', () => {
                sourcesRef.current.delete(sourceNode);
              });

              sourceNode.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(sourceNode);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch (e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = outputAudioContextRef.current?.currentTime || 0;
            }
          },
          onclose: () => {
            setConnectionState(ConnectionState.DISCONNECTED);
          },
          onerror: (err) => {
            console.error(err);
            setError("Connection error. Please try again.");
            setConnectionState(ConnectionState.ERROR);
          }
        }
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to initialize audio.");
      setConnectionState(ConnectionState.ERROR);
      cleanup();
    }
  }, [selectedLanguage, selectedVoice, cleanup]);

  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return {
    connectionState,
    error,
    connect,
    disconnect,
    isRecording,
    volumeLevel,
    recordedUrl
  };
};