import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TypingInput from './components/TypingInput';
import Timer from './components/Timer';

const App = () => {
  // Core state
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [typed, setTyped] = useState([]); // stores completed words
  const [typedLetters, setTypedLetters] = useState([]); // Track each letter's correctness
  
  // Timer state
  const [timerConfig, setTimerConfig] = useState(30); // The configured timer value
  const [timer, setTimer] = useState(30); // The current countdown value
  const [customTimer, setCustomTimer] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [showResult, setShowResult] = useState(false);
  
  // Performance metrics
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [mistakes, setMistakes] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  
  // UI state
  const [enableSound, setEnableSound] = useState(true);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [wordCount, setWordCount] = useState(10);
  
  // Refs
  const inputRef = useRef(null);
  const customTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  
  // Initialize audio context
  useEffect(() => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 0.1;
      gainNodeRef.current.connect(audioContextRef.current.destination);
    } catch (error) {
      console.error('Audio context initialization failed:', error);
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Memoized sound function to prevent recreation on each render
  const playKeySound = useCallback((type = 'normal') => {
    if (!enableSound || !audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();
      
      // Mechanical keyboard sound profiles
      oscillator.type = 'square';
      gain.gain.value = 0.15;
      
      if (type === 'error') {
        oscillator.frequency.value = 200 + Math.random() * 50; // Low click for errors
        gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.08);
      } else if (type === 'correct') {
        oscillator.frequency.value = 800 + Math.random() * 200; // Crisp click for correct
        gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.05);
      } else {
        oscillator.frequency.value = 500 + Math.random() * 100; // Mid-range for normal
        gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.06);
      }
      
      oscillator.connect(gain);
      gain.connect(audioContextRef.current.destination);
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.1);
    } catch (error) {
      console.error('Sound playback failed:', error);
    }
  }, [enableSound]);

  // Fetch words with memoized callback
  const fetchWords = useCallback(async (count = wordCount) => {
    setLoading(true);
    try {
      const res = await fetch(`https://random-word-api.vercel.app/api?words=${count}`);
      if (!res.ok) throw new Error('Failed to fetch words');
      
      const data = await res.json();
      setWords(data);
      setCurrentLetterIndex(0);
      setTypedLetters([]);
      
      // Focus input after words are loaded
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 0);
    } catch (error) {
      console.error('Error fetching words:', error);
      // Fallback words
      setWords(['hello', 'world', 'react', 'typing', 'practice', 'speed', 'test', 'keyboard', 'developer', 'javascript']);
    } finally {
      setLoading(false);
    }
  }, [wordCount]);

  // Initial fetch
  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  // Timer logic - completely rewritten for reliability
  useEffect(() => {
    if (isActive && timer > 0) {
      // Clear any existing interval to prevent multiple timers
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      // Get the current time to calculate elapsed time accurately
      const startTimestamp = Date.now();
      let lastTickTime = startTimestamp;
      
      timerIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - lastTickTime) / 1000);
        
        if (elapsedSeconds >= 1) {
          lastTickTime = now;
          
          setTimer(prevTimer => {
            const newTimer = Math.max(0, prevTimer - elapsedSeconds);
            if (newTimer === 0) {
              // Clear interval when timer reaches zero
              if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
              }
              setIsActive(false);
              setShowResult(true);
            }
            return newTimer;
          });
        }
      }, 100); // Check more frequently for accuracy
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isActive, timer]);

  // Calculate WPM and accuracy
  useEffect(() => {
    if (!startTime || !isActive) return;
    
    const elapsedMinutes = (Date.now() - startTime) / 60000;
    if (elapsedMinutes <= 0) return;
    
    // Calculate WPM (standard: 5 characters = 1 word)
    if (totalChars > 0) {
      const calculatedWpm = Math.round((totalChars / 5) / elapsedMinutes);
      setWpm(calculatedWpm);
    }
    
    // Calculate accuracy
    if (totalChars > 0) {
      const calculatedAccuracy = Math.round((correctChars / totalChars) * 100);
      setAccuracy(calculatedAccuracy);
    }
  }, [startTime, isActive, totalChars, correctChars]);

  // Input handler with optimized performance
  const handleInput = useCallback((e) => {
    const value = e.target.value;
    const currentWord = words[typed.length];
    
    // Start timer on first input if not already active
    if (!isActive && timer > 0) {
      setIsActive(true);
      if (!startTime) {
        setStartTime(Date.now());
      }
    }
    
    // Handle new character typed
    if (value.length > input.length) {
      const newChar = value[value.length - 1];
      const correctChar = currentWord?.[value.length - 1];
      const isCorrect = newChar === correctChar;
      
      // Play appropriate sound
      playKeySound(isCorrect ? 'correct' : 'error');
      
      // Update typed letters tracking
      setTypedLetters(prev => {
        const newTypedLetters = [...prev];
        if (!newTypedLetters[typed.length]) {
          newTypedLetters[typed.length] = [];
        }
        newTypedLetters[typed.length][value.length - 1] = isCorrect;
        return newTypedLetters;
      });
      
      // Update metrics
      setTotalChars(prev => prev + 1);
      if (isCorrect) {
        setCorrectChars(prev => prev + 1);
      } else {
        setMistakes(prev => prev + 1);
      }
      
      setCurrentLetterIndex(value.length - 1);
    } 
    // Handle backspace
    else if (value.length < input.length) {
      playKeySound();
      setCurrentLetterIndex(Math.max(0, value.length - 1));
    }
    
    setInput(value);
    
    // Handle word completion
    if (value.endsWith(' ')) {
      const typedWord = value.trim();
      setTyped(prev => [...prev, typedWord]);
      setInput('');
      setCurrentLetterIndex(0);
      
      // Fetch more words if needed
      if (typed.length + 1 >= words.length && timer > 0) {
        fetchWords();
        setTyped([]);
      }
    }
  }, [input, typed, words, timer, isActive, startTime, playKeySound, fetchWords]);

  // Reset function with proper state cleanup
  const handleReset = useCallback(() => {
    // Clear any existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Reset all state
    setTyped([]);
    setInput('');
    setStartTime(null);
    setWpm(0);
    setTimer(timerConfig); // Use the configured timer value
    setIsActive(false);
    setMistakes(0);
    setAccuracy(100);
    setShowResult(false);
    setCurrentLetterIndex(0);
    setTypedLetters([]);
    setTotalChars(0);
    setCorrectChars(0);
    
    // Fetch new words and focus input
    fetchWords(wordCount);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 0);
  }, [timerConfig, wordCount, fetchWords]);

  // Toggle sound with memoization
  const toggleSound = useCallback(() => {
    setEnableSound(prev => !prev);
  }, []);

  // Word count change handler
  const handleWordCountChange = useCallback((count) => {
    if (isActive) return; // Prevent changing during active session
    setWordCount(count);
    setTyped([]);
    fetchWords(count);
  }, [isActive, fetchWords]);

  // Timer change handler
  const handleTimerChange = useCallback((time) => {
    if (isActive) return; // Prevent changing during active session
    setTimerConfig(time);
    setTimer(time);
    
    // Remove the immediate handleReset call that might be causing the issue
    // Instead, just update the timer values directly
    // This prevents potential state update conflicts
    
    // Focus the input after timer change
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 0);
  }, [isActive]);

  // Custom timer submission handler
  const handleCustomTimerSubmit = useCallback((e) => {
    e.preventDefault();
    if (isActive) return; // Prevent changing during active session
    
    const time = parseInt(customTimer);
    if (time > 0) {
      setTimerConfig(time);
      setTimer(time);
      setCustomTimer('');
      
      // Focus the input after timer change
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 0);
    }
  }, [customTimer, isActive]);

  // Auto-focus effect
  useEffect(() => {
    if (inputRef.current && !loading && timer > 0 && !showResult) {
      inputRef.current.focus();
    }
  }, [words, loading, timer, showResult]);

  // Memoize current word and letter position calculation
  const { wordIndex, letterIndex } = useMemo(() => {
    if (typed.length >= words.length) return { wordIndex: -1, letterIndex: -1 };
    return {
      wordIndex: typed.length,
      letterIndex: input.length
    };
  }, [typed.length, words.length, input.length]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-100 p-8">
      <motion.div
        className="w-[90vw] max-w-4xl min-h-[40vh] bg-white rounded-2xl shadow-2xl flex flex-col items-center justify-between p-8 border border-blue-200 transition-all duration-300"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <div className="w-full flex flex-col items-center mb-4">
          <h2 className="text-3xl font-bold text-blue-700 mb-2 tracking-wide">Typing Practice</h2>
          
          {/* Navbar */}
          <div className="w-full max-w-3xl bg-gray-100 rounded-xl p-2 mb-4 flex flex-wrap justify-center gap-2">
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium text-gray-700">Words:</span>
              {[5, 10, 15, 20, 25].map(count => (
                <button
                  key={count}
                  onClick={() => handleWordCountChange(count)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${wordCount === count ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
                  disabled={isActive}
                >
                  {count}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2 items-center ml-4">
              <span className="text-sm font-medium text-gray-700">Time:</span>
              {[15, 30, 60, 120].map(time => (
                <button
                  key={time}
                  onClick={() => handleTimerChange(time)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${timerConfig === time ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
                  disabled={isActive}
                >
                  {time}s
                </button>
              ))}
              
              <form onSubmit={handleCustomTimerSubmit} className="flex items-center">
                <input
                  type="number"
                  ref={customTimerRef}
                  value={customTimer}
                  onChange={(e) => setCustomTimer(e.target.value)}
                  placeholder="Custom"
                  className="w-16 px-2 py-1 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  min="1"
                  disabled={isActive}
                />
                <button
                  type="submit"
                  className="ml-1 px-2 py-1 bg-blue-500 text-white text-sm rounded-lg disabled:opacity-50"
                  disabled={isActive || !customTimer}
                >
                  Set
                </button>
              </form>
            </div>
          </div>
          
          {/* Timer display */}
          <div className="flex justify-center items-center mb-2">
            <Timer timer={timer} isFinished={timer === 0} />
          </div>
        </div>
        
        {/* Word display area */}
        <div className="w-full flex flex-col items-center mb-4">
          <div className="w-full max-w-3xl min-h-[120px] bg-blue-50 border-2 border-blue-200 rounded-xl shadow-inner px-6 py-6 overflow-x-auto whitespace-pre-wrap flex flex-wrap gap-x-4 gap-y-2 items-center transition-all duration-300 relative">
            <AnimatePresence>
              {words.map((word, wordIdx) => (
                <motion.div 
                  key={wordIdx}
                  className="inline-flex"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {word.split('').map((letter, letterIdx) => {
                    // Determine letter state
                    let letterState = '';
                    if (wordIdx < typed.length) {
                      // Completed words
                      letterState = typed[wordIdx]?.[letterIdx] === letter ? 'correct' : 'incorrect';
                    } else if (wordIdx === wordIndex) {
                      // Current word
                      if (letterIdx < input.length) {
                        letterState = typedLetters[wordIdx]?.[letterIdx] === false ? 'error' : 'current-active';
                      } else if (letterIdx === input.length) {
                        letterState = 'current';
                      }
                    }

                    return (
                      <span
                        key={`${wordIdx}-${letterIdx}`}
                        className={`font-mono text-2xl md:text-3xl px-0.5 rounded transition-colors duration-200 relative ${
                          letterState === 'correct' 
                            ? 'text-emerald-600 bg-emerald-100' 
                            : letterState === 'incorrect' || letterState === 'error'
                              ? 'text-red-500 bg-red-100' 
                              : letterState === 'current-active'
                                ? 'text-blue-600 bg-blue-100'
                                : wordIdx === wordIndex && letterIdx === letterIndex
                                  ? 'text-blue-800 underline underline-offset-4'
                                  : 'text-gray-400'
                        }`}
                      >
                        {letter}
                        {wordIdx === wordIndex && letterIdx === letterIndex && (
                          <motion.span
                            className="absolute left-0.5 bottom-0 w-[calc(100%-4px)] h-0.5 bg-blue-600"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                          />
                        )}
                      </span>
                    );
                  })}
                  {wordIdx < words.length - 1 && <span className="w-2" />}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Input field */}
        <TypingInput
          ref={inputRef}
          value={input}
          onChange={handleInput}
          disabled={loading || timer === 0}
          isFinished={timer === 0}
        />
        
        {/* Control buttons */}
        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          <button
            className="px-6 py-2 rounded-lg bg-blue-500 text-white font-semibold shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all text-lg"
            onClick={handleReset}
          >
            Reset
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold shadow focus:outline-none focus:ring-2 transition-all text-lg ${
              enableSound
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-300'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400 focus:ring-gray-300'
            }`}
            onClick={toggleSound}
            title="Toggle keypress sound"
          >
            Sound: {enableSound ? 'ON' : 'OFF'}
          </button>
        </div>
        
        {/* Results display */}
        {showResult && (
          <motion.div 
            className="mt-6 w-full flex flex-col items-center bg-blue-50 p-6 rounded-xl border border-blue-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-2xl font-bold text-blue-700 mb-4">Time's up!</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl">
              <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
                <div className="text-sm text-gray-500 mb-1">Typing Speed</div>
                <div className="text-3xl font-bold text-emerald-600">{wpm}</div>
                <div className="text-sm text-gray-500">WPM</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
                <div className="text-sm text-gray-500 mb-1">Accuracy</div>
                <div className="text-3xl font-bold text-blue-500">{accuracy}%</div>
                <div className="text-sm text-gray-500">Correct</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
                <div className="text-sm text-gray-500 mb-1">Mistakes</div>
                <div className="text-3xl font-bold text-red-500">{mistakes}</div>
                <div className="text-sm text-gray-500">Errors</div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default React.memo(App);
