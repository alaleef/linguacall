import React, { useState } from 'react';
import { LanguageSelector } from './components/LanguageSelector';
import { VoiceSelector } from './components/VoiceSelector';
import { Visualizer } from './components/Visualizer';
import { CallTimer } from './components/CallTimer';
import { useGeminiLive } from './services/geminiService';
import { SUPPORTED_LANGUAGES, AVAILABLE_VOICES } from './constants';
import { ConnectionState } from './types';

const App: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState(SUPPORTED_LANGUAGES[0]);
  const [selectedVoice, setSelectedVoice] = useState(AVAILABLE_VOICES[0]);
  
  const { 
    connectionState, 
    error, 
    connect, 
    disconnect, 
    volumeLevel,
    recordedUrl
  } = useGeminiLive({ selectedLanguage, selectedVoice });

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;
  const isActive = isConnected || isConnecting;

  const handleToggleCall = () => {
    if (isActive) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      {/* Dynamic Background */}
      <div className={`absolute inset-0 transition-all duration-1000 ${isActive ? 'bg-slate-900' : 'bg-slate-950'}`}>
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-900/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-900/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse delay-1000"></div>
      </div>

      {/* --- IN-CALL UI (Full Screen Overlay) --- */}
      {isActive ? (
        <div className="z-20 flex flex-col items-center justify-between w-full h-full max-w-md p-8 animate-fade-in absolute inset-0 md:relative md:h-[800px] md:rounded-[3rem] md:border-8 md:border-slate-800 md:shadow-2xl bg-gradient-to-b from-slate-800/50 to-black/80 backdrop-blur-xl">
          
          {/* Top Info */}
          <div className="flex flex-col items-center mt-12 space-y-2">
            <div className="text-slate-400 text-sm tracking-wider uppercase font-medium">
              {isConnecting ? 'Calling...' : 'In Call'}
            </div>
            <h2 className="text-3xl font-semibold text-white tracking-tight">{selectedVoice.name}</h2>
            <p className="text-slate-400 text-sm">{selectedLanguage.name} Tutor</p>
          </div>

          {/* Center Avatar & Visualizer */}
          <div className="relative flex items-center justify-center w-full py-10">
            {/* Visualizer acts as the glowing aura */}
            <div className="absolute inset-0 flex items-center justify-center opacity-60 scale-150">
              <Visualizer isActive={isConnected} volume={volumeLevel} />
            </div>
            
            {/* Static Avatar Circle */}
            <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 shadow-2xl flex items-center justify-center z-10 text-white font-bold text-6xl">
               {selectedVoice.name[0]}
            </div>
          </div>

          {/* Timer & Controls */}
          <div className="flex flex-col items-center w-full mb-12 space-y-10">
             {/* Timer */}
             <div className="flex items-center space-x-2 text-slate-200">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                <CallTimer isActive={isConnected} />
             </div>

             {/* Action Buttons */}
             <div className="flex items-center justify-center w-full space-x-8">
                {/* Dummy Mute Button for UI realism */}
                <button className="p-4 rounded-full bg-slate-800/50 text-slate-400 hover:bg-slate-700 transition backdrop-blur-md">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                </button>

                {/* End Call Button */}
                <button 
                  onClick={handleToggleCall}
                  className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/40 hover:bg-red-600 transform hover:scale-105 transition-all duration-200"
                >
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Dummy Speaker Button for UI realism */}
                <button className="p-4 rounded-full bg-white text-slate-900 hover:bg-gray-200 transition shadow-lg">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                </button>
             </div>
          </div>

          {/* Connection Error Toast */}
          {error && (
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-red-500/90 text-white text-sm rounded-full shadow-lg backdrop-blur-sm">
              {error}
            </div>
          )}
        </div>
      ) : (
        /* --- SETUP / DIALER UI --- */
        <div className="z-10 w-full max-w-md bg-slate-900 md:rounded-3xl border border-slate-800 md:shadow-2xl flex flex-col overflow-hidden h-screen md:h-auto md:min-h-[700px]">
          
          {/* Header */}
          <div className="pt-10 pb-6 px-8 bg-gradient-to-b from-slate-800 to-slate-900">
            <h1 className="text-3xl font-bold text-white">LinguaCall</h1>
            <p className="text-slate-400 mt-2 text-sm">Practice speaking with an AI native speaker.</p>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto scrollbar-hide">
            
            {/* Language Section */}
            <div className="space-y-4">
               <div className="bg-slate-800/50 rounded-2xl p-1 border border-slate-700">
                <LanguageSelector 
                  selected={selectedLanguage} 
                  onChange={setSelectedLanguage}
                  disabled={isActive}
                />
              </div>

              {/* Voice Section */}
              <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                 <VoiceSelector 
                   selectedVoice={selectedVoice}
                   onVoiceSelect={setSelectedVoice}
                   disabled={isActive}
                 />
              </div>
            </div>

            {recordedUrl && (
              <div className="animate-slide-up bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white">Last Call Recording</h3>
                    <p className="text-xs text-slate-400">{new Date().toLocaleTimeString()} • {selectedLanguage.name}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                </div>
                
                <audio controls src={recordedUrl} className="w-full h-10 mb-4 rounded opacity-80" />
                
                <a 
                  href={recordedUrl} 
                  download={`Call-Recording-${selectedLanguage.name}-${selectedVoice.name}-${Date.now()}.webm`}
                  className="flex items-center justify-center w-full gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all font-medium text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Save Audio File
                </a>
              </div>
            )}
          </div>

          {/* Call Button Bar */}
          <div className="p-6 pb-10 bg-slate-900 border-t border-slate-800">
            <button
              onClick={handleToggleCall}
              className="w-full py-4 bg-green-500 hover:bg-green-400 text-white rounded-full font-bold text-lg shadow-lg shadow-green-500/20 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6 text-white" fill="white" viewBox="0 0 24 24">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.44-5.15-3.75-6.59-6.59l1.97-1.57c.26-.26.35-.65.24-1.01A11.65 11.65 0 019.17 4.32c0-.55-.45-1-1-1H4.53c-.55 0-1 .45-1 1 16.67 16.67 0 0016.67 16.67c.55 0 1-.45 1-1v-3.61c0-.55-.45-1-1-1z"/>
              </svg>
              Start Voice Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;