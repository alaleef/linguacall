import React from 'react';
import { AVAILABLE_VOICES } from '../constants';
import { Voice } from '../types';

interface VoiceSelectorProps {
  selectedVoice: Voice;
  onVoiceSelect: (voice: Voice) => void;
  disabled?: boolean;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoice, onVoiceSelect, disabled }) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-400 mb-3">Select AI Persona</label>
      <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
        {AVAILABLE_VOICES.map((voice) => {
          const isSelected = selectedVoice.id === voice.id;
          const isMale = voice.gender === 'Male';
          
          return (
            <button
              key={voice.id}
              disabled={disabled}
              onClick={() => onVoiceSelect(voice)}
              className={`
                relative flex items-center p-3 rounded-xl border transition-all duration-200 text-left
                ${isSelected 
                  ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20' 
                  : 'bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Avatar Placeholder */}
              <div className={`
                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg mr-3 font-bold
                ${isMale ? 'bg-indigo-900/50 text-indigo-300' : 'bg-rose-900/50 text-rose-300'}
              `}>
                {voice.name[0]}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                    {voice.name}
                  </h3>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse ml-2"></div>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{voice.gender} • {voice.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};