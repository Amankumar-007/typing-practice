import React, { useState, useEffect, useRef } from 'react';
import AnimatedWord from './components/AnimatedWord';
import Timer from './components/Timer';
import TypingInput from './components/TypingInput';
import ResetButton from './components/ResetButton';

const WORDS = [
  'innovation', 'keyboard', 'velocity', 'minimal', 'practice', 'animation', 'reactive', 'framer', 'motion', 'modern', 'awesome', 'challenge', 'performance', 'design', 'interface', 'component', 'dynamic', 'random', 'reset', 'timer',
];
const NUMBERS = Array.from({ length: 100 }, (_, i) => (i + 1).toString());

const getRandomWord = () => WORDS[Math.floor(Math.random() * WORDS.length)];
const getRandomNumber = () => NUMBERS[Math.floor(Math.random() * NUMBERS.length)];

const INITIAL_WORDS_COUNT = 5;
const TIME_OPTIONS = [15, 30, 60, 120];
const MODE_OPTIONS = [
  { label: 'Words', value: 'words' },
  { label: 'Numbers', value: 'numbers' },
];

const App = () => {
  const [mode, setMode] = useState('words');
  const [words, setWords] = useState(Array.from({ length: INITIAL_WORDS_COUNT }, getRandomWord));
  const [input, setInput] = useState('');
  const [timer, setTimer] = useState(30);
  const [selectedTime, setSelectedTime] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState([]);
  const [typedWords, setTypedWords] = useState([]); // For WPM
  const inputRef = useRef(null);

  useEffect(() => {
    if (isActive && timer > 0 && !isFinished) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setIsFinished(true);
      setIsActive(false);
    }
  }, [isActive, timer, isFinished]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [words]);

  const handleInput = (e) => {
    if (!isActive && !isFinished) setIsActive(true);
    setInput(e.target.value);
    // Check if the first word/number is completed
    if (e.target.value.trim() === words[0]) {
      setTimeout(() => {
        setHistory((h) => [{ word: words[0], correct: true }, ...h]);
        setScore((s) => s + 1);
        setTypedWords((tw) => [...tw, words[0]]);
        setWords((w) => [...w.slice(1), mode === 'words' ? getRandomWord() : getRandomNumber()]);
        setInput('');
      }, 200);
    }
  };

  const handleReset = () => {
    setWords(Array.from({ length: INITIAL_WORDS_COUNT }, mode === 'words' ? getRandomWord : getRandomNumber));
    setInput('');
    setTimer(selectedTime);
    setIsActive(false);
    setIsFinished(false);
    setScore(0);
    setHistory([]);
    setTypedWords([]);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleTimeChange = (e) => {
    const t = Number(e.target.value);
    setSelectedTime(t);
    setTimer(t);
    handleReset();
  };

  const handleModeChange = (e) => {
    const m = e.target.value;
    setMode(m);
    setWords(Array.from({ length: INITIAL_WORDS_COUNT }, m === 'words' ? getRandomWord : getRandomNumber));
    setInput('');
    setTimer(selectedTime);
    setIsActive(false);
    setIsFinished(false);
    setScore(0);
    setHistory([]);
    setTypedWords([]);
    if (inputRef.current) inputRef.current.focus();
  };

  // Calculate WPM (words per minute)
  const wpm = Math.round((typedWords.length / (selectedTime - timer || 1)) * 60);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-100 px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
        <div className="flex flex-col md:flex-row gap-4 w-full mb-4 justify-between">
          <div>
            <label className="font-semibold text-gray-600 mr-2">Time:</label>
            <select value={selectedTime} onChange={handleTimeChange} className="rounded px-2 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300">
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}s</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-semibold text-gray-600 mr-2">Mode:</label>
            <select value={mode} onChange={handleModeChange} className="rounded px-2 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300">
              {MODE_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
        <Timer timer={timer} isFinished={isFinished} />
        <div className="flex flex-col items-center w-full mb-4">
          <div className="flex flex-row gap-4 w-full justify-center">
            {words.map((w, idx) => (
              <AnimatedWord key={idx} word={w} input={idx === 0 ? input : ''} />
            ))}
          </div>
        </div>
        <TypingInput
          ref={inputRef}
          value={input}
          onChange={handleInput}
          disabled={isFinished}
          isFinished={isFinished}
        />
        <ResetButton onClick={handleReset} isFinished={isFinished} />
        <div className="mt-6 w-full flex flex-col items-center">
          <div className="text-lg font-semibold text-gray-700 mb-2">Score: <span className="text-blue-500">{score}</span></div>
          {isFinished && (
            <div className="text-xl font-bold text-green-600 mb-2">WPM: {wpm}</div>
          )}
          {history.length > 0 && (
            <div className="w-full max-h-32 overflow-y-auto mt-2">
              <ul className="text-sm text-gray-500 space-y-1">
                {history.slice(0, 5).map((h, i) => (
                  <li key={i} className={h.correct ? 'text-green-500' : 'text-red-500'}>
                    {h.word}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="mt-8 text-center text-gray-400 text-xs">
        Typing Practice App &copy; {new Date().getFullYear()} | Powered by React, Vite, Tailwind CSS, Framer Motion
      </div>
    </div>
  );
};

export default App;