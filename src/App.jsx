import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TypingInput from './components/TypingInput';
import Timer from './components/Timer';
import { FiGithub, FiLinkedin, FiRefreshCw, FiVolume2, FiVolumeX, FiSun, FiMoon, FiAward, FiClock, FiBarChart2, FiAlertTriangle } from 'react-icons/fi';

const App = () => {
  // Core state
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [typed, setTyped] = useState([]);
  const [typedLetters, setTypedLetters] = useState([]);
  
  // Timer state
  const [timerConfig, setTimerConfig] = useState(30);
  const [timer, setTimer] = useState(30);
  const [customTimer, setCustomTimer] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastTypedTime, setLastTypedTime] = useState(null);
  
  // Performance metrics
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [mistakes, setMistakes] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  
  // UI state
  const [enableSound, setEnableSound] = useState(true);
  const [  , setCurrentLetterIndex] = useState(0);
  const [wordCount, setWordCount] = useState(10);
  const [theme, setTheme] = useState('light');
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('typeRiserHighScore')) || 0;
  });
  const [showStreak, setShowStreak] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Refs
  const inputRef = useRef(null);
  const customTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const inactivityTimeoutRef = useRef(null);

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
      clearTimers();
    };
  }, []);

  const clearTimers = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
  };

  // Memoized sound function with more variations
  const playKeySound = useCallback((type = 'normal') => {
    if (!enableSound || !audioContextRef.current) return;
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();
      oscillator.type = ['sine', 'square', 'sawtooth', 'triangle'][Math.floor(Math.random() * 4)];
      gain.gain.value = 0.15;
      
      if (type === 'error') {
        oscillator.frequency.value = 200 + Math.random() * 50;
        gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.08);
      } else if (type === 'correct') {
        oscillator.frequency.value = 800 + Math.random() * 200;
        gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.05);
      } else if (type === 'streak') {
        oscillator.frequency.value = 1000 + Math.random() * 300;
        gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
      } else {
        oscillator.frequency.value = 500 + Math.random() * 100;
        gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.06);
      }
      
      oscillator.connect(gain);
      gain.connect(audioContextRef.current.destination);
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + (type === 'streak' ? 0.2 : 0.1));
    } catch (error) {
      console.error('Sound playback failed:', error);
    }
  }, [enableSound]);

  // Fetch words with fallback
  const fetchWords = useCallback(async (count = wordCount) => {
    setLoading(true);
    try {
      const res = await fetch(`https://random-word-api.vercel.app/api?words=${count}`);
      if (!res.ok) throw new Error('Failed to fetch words');
      const data = await res.json();
      setWords(data);
      setCurrentLetterIndex(0);
      setTypedLetters([]);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 0);
    } catch (error) {
      console.error('Error fetching words:', error);
      // Enhanced fallback words
      const fallbackWords = [
        'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 
        'typing', 'speed', 'test', 'challenge', 'keyboard', 
        'developer', 'react', 'javascript', 'animation', 
        'interface', 'component', 'state', 'effect'
      ].sort(() => 0.5 - Math.random()).slice(0, count);
      setWords(fallbackWords);
    } finally {
      setLoading(false);
    }
  }, [wordCount]);

  // Initial fetch
  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  // Timer logic with inactivity detection
useEffect(() => {
  if (isActive && timer > 0) {
    clearTimers();

    const startTimestamp = Date.now();
    let lastTickTime = startTimestamp;

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastTickTime) / 1000);

      // Check for inactivity (2 seconds without typing)
      if (lastTypedTime && (now - lastTypedTime) > 2000) {
        setIsActive(false);
        clearTimers();
        return;
      }

      if (elapsedSeconds >= 1) {
        lastTickTime = now;
        setTimer(prevTimer => {
          const newTimer = Math.max(0, prevTimer - elapsedSeconds);
          if (newTimer === 0) {
            clearTimers();
            setIsActive(false);
            setShowResult(true);
            setShowConfetti(true);

            // Save high score
            setHighScore(prev => {
              if (wpm > prev) {
                localStorage.setItem('typeRiserHighScore', wpm);
                return wpm;
              }
              return prev;
            });
          }
          return newTimer;
        });
      }
    }, 100);
  }

  return () => {
    clearTimers();
  };
}, [isActive, timer]); // ✅ removed wpm, highScore, lastTypedTime

  // Calculate WPM and accuracy
  useEffect(() => {
    if (!startTime || !isActive) return;
    const elapsedMinutes = (Date.now() - startTime) / 60000;
    if (elapsedMinutes <= 0) return;
    if (totalChars > 0) {
      const calculatedWpm = Math.round((totalChars / 5) / elapsedMinutes);
      setWpm(calculatedWpm);
    }
    if (totalChars > 0) {
      const calculatedAccuracy = Math.round((correctChars / totalChars) * 100);
      setAccuracy(calculatedAccuracy);
    }
  }, [startTime, isActive, totalChars, correctChars]);

  // Input handler with streak tracking
  const handleInput = useCallback((e) => {
    const value = e.target.value;
    const currentWord = words[typed.length];
    
    // Update last typed time for inactivity detection
    const now = Date.now();
    setLastTypedTime(now);
    
    if (!isActive && timer > 0) {
      setIsActive(true);
      if (!startTime) setStartTime(now);
    }
    
    if (value.length > input.length) {
      const newChar = value[value.length - 1];
      const correctChar = currentWord?.[value.length - 1];
      const isCorrect = newChar === correctChar;
      
      playKeySound(isCorrect ? 'correct' : 'error');
      
      setTypedLetters(prev => {
        const newTypedLetters = [...prev];
        if (!newTypedLetters[typed.length]) newTypedLetters[typed.length] = [];
        newTypedLetters[typed.length][value.length - 1] = isCorrect;
        return newTypedLetters;
      });
      
      setTotalChars(prev => prev + 1);
      
      if (isCorrect) {
        setCorrectChars(prev => prev + 1);
        setStreak(prev => {
          const newStreak = prev + 1;
          if (newStreak > maxStreak) {
            setMaxStreak(newStreak);
          }
          if (newStreak > 0 && newStreak % 10 === 0) {
            playKeySound('streak');
            setShowStreak(true);
            setTimeout(() => setShowStreak(false), 1000);
          }
          return newStreak;
        });
      } else {
        setMistakes(prev => prev + 1);
        setStreak(0);
      }
      
      setCurrentLetterIndex(value.length - 1);
    } else if (value.length < input.length) {
      playKeySound();
      setCurrentLetterIndex(Math.max(0, value.length - 1));
    }
    
    setInput(value);
    
    if (value.endsWith(' ')) {
      const typedWord = value.trim();
      setTyped(prev => [...prev, typedWord]);
      setInput('');
      setCurrentLetterIndex(0);
      if (typed.length + 1 >= words.length && timer > 0) {
        fetchWords();
        setTyped([]);
      }
    }
  }, [input, typed, words, timer, isActive, startTime, playKeySound, fetchWords, maxStreak]);

  // Reset function with animation
  const handleReset = useCallback(() => {
    clearTimers();
    setTyped([]);
    setInput('');
    setStartTime(null);
    setWpm(0);
    setTimer(timerConfig);
    setIsActive(false);
    setMistakes(0);
    setAccuracy(100);
    setShowResult(false);
    setCurrentLetterIndex(0);
    setTypedLetters([]);
    setTotalChars(0);
    setCorrectChars(0);
    setStreak(0);
    setShowConfetti(false);
    setLastTypedTime(null);
    fetchWords(wordCount);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 0);
  }, [timerConfig, wordCount, fetchWords]);

  // Toggle sound
  const toggleSound = useCallback(() => {
    setEnableSound(prev => !prev);
    if (!enableSound) {
      playKeySound('correct');
    }
  }, [enableSound, playKeySound]);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // Word count change
  const handleWordCountChange = useCallback((count) => {
    if (isActive) return;
    setWordCount(count);
    setTyped([]);
    fetchWords(count);
  }, [isActive, fetchWords]);

  // Timer change
  const handleTimerChange = useCallback((time) => {
    if (isActive) return;
    setTimerConfig(time);
    setTimer(time);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 0);
  }, [isActive]);

  // Custom timer submission
  const handleCustomTimerSubmit = useCallback((e) => {
    e.preventDefault();
    if (isActive) return;
    const time = parseInt(customTimer);
    if (time > 0) {
      setTimerConfig(time);
      setTimer(time);
      setCustomTimer('');
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

  // Memoized word and letter position
  const { wordIndex, letterIndex } = useMemo(() => {
    if (typed.length >= words.length) return { wordIndex: -1, letterIndex: -1 };
    return {
      wordIndex: typed.length,
      letterIndex: input.length
    };
  }, [typed.length, words.length, input.length]);

  // Progress calculation
  const progress = useMemo(() => {
    return words.length > 0 ? Math.round((typed.length / words.length) * 100) : 0;
  }, [typed.length, words.length]);

  // Confetti effect component
  const Confetti = () => {
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {Array.from({ length: 100 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ y: -100, opacity: 1 }}
            animate={{ y: window.innerHeight, opacity: 0 }}
            transition={{
              duration: 2 + Math.random() * 3,
              delay: Math.random() * 0.5,
              repeat: 0,
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-between p-4 md:p-8 transition-colors duration-500 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-emerald-100'}`}>
      {/* Main Content */}
      <div className="w-full flex-1 flex items-center justify-center">
        <motion.div
          className={`w-[90vw] max-w-4xl min-h-[40vh] rounded-2xl shadow-2xl flex flex-col items-center justify-between p-6 md:p-8 border transition-all duration-300 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-blue-200'}`}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          {/* Logo and Title */}
          <motion.div
            className="flex items-center mb-4"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}>
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" />
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" />
            </svg>
            <h2 className={`text-3xl font-bold ml-2 tracking-wide ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
              TypeRiser
            </h2>
          </motion.div>

          {/* Navbar */}
          <div className="w-full flex flex-col items-center mb-4">
            <div className={`w-full max-w-3xl rounded-xl p-2 mb-4 flex flex-wrap justify-center gap-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex gap-2 items-center">
                <span className={`text-sm font-medium flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FiBarChart2 className="mr-1" /> Words:
                </span>
                {[5, 10, 15, 20, 25].map(count => (
                  <motion.button
                    key={count}
                    onClick={() => handleWordCountChange(count)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all flex items-center ${wordCount === count ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : (theme === 'dark' ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-white text-gray-700 hover:bg-gray-200')}`}
                    disabled={isActive}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {count}
                  </motion.button>
                ))}
              </div>
              <div className="flex gap-2 items-center ml-4">
                <span className={`text-sm font-medium flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FiClock className="mr-1" /> Time:
                </span>
                {[15, 30, 60, 120].map(time => (
                  <motion.button
                    key={time}
                    onClick={() => handleTimerChange(time)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${timerConfig === time ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : (theme === 'dark' ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-white text-gray-700 hover:bg-gray-200')}`}
                    disabled={isActive}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {time}s
                  </motion.button>
                ))}
                <form onSubmit={handleCustomTimerSubmit} className="flex items-center">
                  <input
                    type="number"
                    ref={customTimerRef}
                    value={customTimer}
                    onChange={(e) => setCustomTimer(e.target.value)}
                    placeholder="Custom"
                    className={`w-16 px-2 py-1 text-sm rounded-lg border focus:outline-none focus:ring-1 ${theme === 'dark' ? 'bg-gray-600 text-gray-300 border-gray-500 focus:ring-blue-500' : 'bg-white text-gray-700 border-gray-300 focus:ring-blue-500'}`}
                    min="1"
                    disabled={isActive}
                  />
                  <motion.button
                    type="submit"
                    className={`ml-1 px-2 py-1 text-sm rounded-lg disabled:opacity-50 ${theme === 'dark' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                    disabled={isActive || !customTimer}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Set
                  </motion.button>
                </form>
              </div>
            </div>

            {/* Timer and Theme Toggle */}
            <div className="flex justify-between items-center w-full max-w-3xl mb-2">
              <Timer timer={timer} isFinished={timer === 0} theme={theme} />
              <div className="flex gap-2">
                <motion.button
                  onClick={toggleSound}
                  className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} focus:outline-none`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title={enableSound ? "Mute sounds" : "Unmute sounds"}
                >
                  {enableSound ? <FiVolume2 size={20} /> : <FiVolumeX size={20} />}
                </motion.button>
                <motion.button
                  onClick={toggleTheme}
                  className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} focus:outline-none`}
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
                </motion.button>
              </div>
            </div>

            {/* Progress Bar */}
            <motion.div
              className="w-full max-w-3xl h-2 bg-gray-200 rounded-full overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </div>

          {/* Streak display */}
          <AnimatePresence>
            {showStreak && (
              <motion.div
                className={`absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold ${streak >= 20 ? 'text-yellow-400' : 'text-blue-500'}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {streak} STREAK!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Word display area */}
          <div className="w-full flex flex-col items-center mb-4">
            <div className={`w-full max-w-3xl min-h-[120px] rounded-xl shadow-inner px-6 py-6 overflow-x-auto whitespace-pre-wrap flex flex-wrap gap-x-4 gap-y-2 items-center transition-all duration-300 relative ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-2 border-blue-200'}`}>
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
                      let letterState = '';
                      if (wordIdx < typed.length) {
                        letterState = typed[wordIdx]?.[letterIdx] === letter ? 'correct' : 'incorrect';
                      } else if (wordIdx === wordIndex) {
                        if (letterIdx < input.length) {
                          letterState = typedLetters[wordIdx]?.[letterIdx] === false ? 'error' : 'current-active';
                        } else if (letterIdx === input.length) {
                          letterState = 'current';
                        }
                      }
                      return (
                        <motion.span
                          key={`${wordIdx}-${letterIdx}`}
                          className={`font-mono text-2xl md:text-3xl px-0.5 rounded transition-colors duration-200 relative ${
                            letterState === 'correct'
                              ? (theme === 'dark' ? 'text-emerald-400 bg-emerald-900' : 'text-emerald-600 bg-emerald-100')
                              : letterState === 'incorrect' || letterState === 'error'
                                ? (theme === 'dark' ? 'text-red-400 bg-red-900' : 'text-red-500 bg-red-100')
                                : letterState === 'current-active'
                                  ? (theme === 'dark' ? 'text-blue-400 bg-blue-900' : 'text-blue-600 bg-blue-100')
                                  : wordIdx === wordIndex && letterIdx === letterIndex
                                    ? (theme === 'dark' ? 'text-blue-300 underline underline-offset-4' : 'text-blue-800 underline underline-offset-4')
                                    : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')
                          }`}
                          initial={{ y: 10 }}
                          animate={{ y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {letter}
                          {wordIdx === wordIndex && letterIdx === letterIndex && (
                            <motion.span
                              className="absolute left-0.5 bottom-0 w-[calc(100%-4px)] h-0.5 bg-blue-500"
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                            />
                          )}
                        </motion.span>
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
            className={theme === 'dark' ? 'bg-gray-600 text-gray-300 border-gray-500' : 'bg-white text-gray-700 border-gray-300'}
          />

          {/* Control buttons and Stats */}
          <div className="flex flex-wrap gap-4 mt-4 justify-center items-center">
            <motion.button
              className={`px-4 py-2 rounded-lg font-semibold shadow focus:outline-none focus:ring-2 transition-all flex items-center gap-2 ${theme === 'dark' ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' : 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-300'}`}
              onClick={handleReset}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Reset test"
            >
              <FiRefreshCw /> Reset
            </motion.button>
            <div className={`text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <span>Chars: {correctChars}/{totalChars}</span>
              <span className="hidden sm:inline">|</span>
              <span>Streak: {streak}</span>
            </div>
          </div>

          {/* Results display */}
          {showResult && (
            <motion.div
              className={`mt-6 w-full flex flex-col items-center p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>Time's up!</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-2xl">
                <motion.div 
                  className={`p-4 rounded-lg shadow-md flex flex-col items-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className={`text-sm flex items-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                    <FiBarChart2 className="mr-1" /> Typing Speed
                  </div>
                  <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{wpm}</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>WPM</div>
                </motion.div>
                <motion.div 
                  className={`p-4 rounded-lg shadow-md flex flex-col items-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className={`text-sm flex items-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                    <FiAward className="mr-1" /> Accuracy
                  </div>
                  <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`}>{accuracy}%</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Correct</div>
                </motion.div>
                <motion.div 
                  className={`p-4 rounded-lg shadow-md flex flex-col items-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className={`text-sm flex items-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                    <FiAlertTriangle className="mr-1" /> Mistakes
                  </div>
                  <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{mistakes}</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Errors</div>
                </motion.div>
                <motion.div 
                  className={`p-4 rounded-lg shadow-md flex flex-col items-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className={`text-sm flex items-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                    <FiAward className="mr-1" /> High Score
                  </div>
                  <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'}`}>{highScore}</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>WPM</div>
                </motion.div>
              </div>
              <motion.button
                className={`mt-6 px-6 py-2 rounded-lg font-semibold shadow focus:outline-none focus:ring-2 transition-all flex items-center gap-2 ${theme === 'dark' ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' : 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-300'}`}
                onClick={handleReset}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiRefreshCw /> Try Again
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className={`w-full py-4 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
        <div className="flex justify-center gap-4 mb-2">
          <motion.a 
            href="https://github.com/yourusername" 
            target="_blank" 
            rel="noopener noreferrer"
            whileHover={{ y: -2 }}
            className="hover:text-blue-500"
          >
            <FiGithub size={20} />
          </motion.a>
          <motion.a 
            href="https://linkedin.com/in/yourusername" 
            target="_blank" 
            rel="noopener noreferrer"
            whileHover={{ y: -2 }}
            className="hover:text-blue-500"
          >
            <FiLinkedin size={20} />
          </motion.a>
        </div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Created with ❤️ by Aman Kumar
        </motion.p>
      </footer>

      {/* Confetti effect */}
      {showConfetti && <Confetti />}
    </div>
  );
};

export default React.memo(App);