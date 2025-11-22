import React from 'react';
import { SUPPORTED_LANGUAGES } from '../constants';
import { Language } from '../types';

interface LanguageSelectorProps {
  selected: Language;
  onChange: (lang: Language) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selected, onChange, disabled }) => {
  return (
    <div className="relative w-full">
      <label className="block text-sm font-medium text-gray-400 mb-1">Select Language to Practice</label>
      <div className="relative">
        <select
          disabled={disabled}
          value={selected.code}
          onChange={(e) => {
            const lang = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
            if (lang) onChange(lang);
          }}
          className="block w-full pl-4 pr-10 py-3 text-base border-gray-700 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-xl appearance-none cursor-pointer disabled:opacity-50 shadow-lg transition-all hover:bg-gray-750"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        {SUPPORTED_LANGUAGES.length} languages available
      </p>
    </div>
  );
};