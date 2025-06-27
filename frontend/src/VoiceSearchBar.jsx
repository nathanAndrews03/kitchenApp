import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, MicOff } from 'lucide-react';

const VoiceSearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize SpeechRecognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      setQuery(spokenText);
      onSearch(spokenText);
    };
    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, [onSearch]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (!listening) {
      recognitionRef.current.start();
      setListening(true);
    } else {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  return (
    <div className="relative max-w-2xl mx-auto mb-8">
      <input
        type="text"
        placeholder="What's cooking?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-gray-800 text-white px-6 py-4 rounded-lg text-lg pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={() => onSearch(query)}
        className="absolute right-12 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-500"
      >
        <Search className="w-6 h-6" />
      </button>
      <button
        onClick={toggleListening}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-500"
      >
        {listening ? (
          <MicOff className="w-6 h-6 animate-pulse" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};

export default VoiceSearchBar;
