import React, { useState, useEffect, useRef } from 'react';
import AnimatedWord from './components/AnimatedWord';
import Timer from './components/Timer';
import TypingInput from './components/TypingInput';
import ResetButton from './components/ResetButton';
import './App.css';

const WORDS = [
  'innovation',
  'keyboard',
  'velocity',
  'minimal',
  'practice',
  'animation',
  'reactive',
  'framer',
  'motion',
  'modern',
  'awesome',
  'challenge',
  'performance',
  'design',
  'interface',
  'component',
  'dynamic',
  'random',
  'reset',
  'timer',
];

const getRandomWord = () => WORDS[Math.floor(Math.random() * WORDS.length)];

const App = () => {
  const [word, setWord] = useState(getRandomWord());
  const [input, setInput] = useState('');
  const [timer, setTimer] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState([]);
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
  }, [word]);

  const handleInput = (e) => {
    if (!isActive && !isFinished) setIsActive(true);
    setInput(e.target.value);
    if (e.target.value === word) {
      setTimeout(() => {
        setHistory((h) => [{ word, correct: true }, ...h]);
        setScore((s) => s + 1);
        setWord(getRandomWord());
        setInput('');
      }, 300);
    }
  };

  const handleReset = () => {
    setWord(getRandomWord());
    setInput('');
    setTimer(30);
    setIsActive(false);
    setIsFinished(false);
    setScore(0);
    setHistory([]);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-100 px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
        <Timer timer={timer} isFinished={isFinished} />
        <AnimatedWord word={word} input={input} />
        <TypingInput
          ref={inputRef}
          value={input}
          onChange={handleInput}
          disabled={isFinished}
          isFinished={isFinished}
        />
        <ResetButton onClick={handleReset} isFinished={isFinished} />
        <div className="mt-6 w-full flex flex-col items-center">
          <div className="text-lg font-semibold text-gray-700 mb-2">
            Score:{' '}
            <span className="text-blue-500">
              {score}
            </span>
          </div>
          {history.length > 0 && (
            <div className="w-full max-h-32 overflow-y-auto mt-2">
              <ul className="text-sm text-gray-500 space-y-1">
                {history.slice(0, 5).map((h, i) => (
                  <li
                    key={i}
                    className={
                      h.correct ? 'text-green-500' : 'text-red-500'
                    }
                  >
                    {h.word}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="mt-8 text-center text-gray-400 text-xs">
        Typing Practice App &copy; {new Date().getFullYear()} | Powered by React,
        Vite, Tailwind CSS, Framer Motion
      </div>
    </div>
  );
};

export default App;