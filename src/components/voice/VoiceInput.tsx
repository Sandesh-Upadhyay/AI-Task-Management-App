import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

// Mock implementation since we can't use the actual browser API in this environment
const VoiceInput: React.FC<{ onResult: (text: string) => void }> = ({ onResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // In a real implementation, we would use the Web Speech API
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  const startListening = () => {
    setIsListening(true);
    setTranscript('');
    
    // Simulate speech recognition
    setTimeout(() => {
      const mockTranscripts = [
        "Add a task to prepare presentation for tomorrow's meeting",
        "Create a new high priority task to review the quarterly report",
        "Remind me to call John about the project at 3pm",
        "Add a task to send the invoice to the client by Friday"
      ];
      
      const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      setTranscript(randomTranscript);
      setIsProcessing(true);
      
      // Simulate processing
      setTimeout(() => {
        onResult(randomTranscript);
        setIsProcessing(false);
        setIsListening(false);
      }, 1000);
    }, 2000);
  };
  
  const stopListening = () => {
    setIsListening(false);
  };
  
  return (
    <div className="relative">
      <button
        onClick={toggleListening}
        disabled={isProcessing}
        className={`p-3 rounded-full ${
          isListening 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isProcessing ? (
          <Loader2 size={24} className="animate-spin" />
        ) : isListening ? (
          <MicOff size={24} />
        ) : (
          <Mic size={24} />
        )}
      </button>
      
      {(isListening || transcript) && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-white p-3 rounded-lg shadow-lg border border-gray-200 min-w-[250px]">
          <p className="text-sm font-medium text-gray-700 mb-1">
            {isListening ? 'Listening...' : 'Processing...'}
          </p>
          {transcript && (
            <p className="text-sm text-gray-600 italic">"{transcript}"</p>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceInput;