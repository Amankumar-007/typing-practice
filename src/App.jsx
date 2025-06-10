import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
        setWord(getRandomWord());
        setInput('');
      }, 400);
    }
  };

  const handleReset = () => {
    setWord(getRandomWord());
    setInput('');
    setTimer(30);
    setIsActive(false);
    setIsFinished(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const renderWord = () => {
    return (
      <h1 className="word-box">
        {word.split('').map((char, idx) => {
          let color = '';
          if (input[idx]) {
            color = input[idx] === char ? 'correct' : 'wrong';
          }
          return (
            <motion.span
              key={idx}
              className={color}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {char}
            </motion.span>
          );
        })}
      </h1>
    );
  };

  return (
    <div className="container">
      <motion.div
        className="timer"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {isFinished ? 'Time Up!' : `Time: ${timer}s`}
      </motion.div>
      <motion.div
        className="word-container"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {renderWord()}
      </motion.div>
      <input
        ref={inputRef}
        className="input-box"
        type="text"
        value={input}
        onChange={handleInput}
        disabled={isFinished}
        placeholder="Start typing..."
        autoFocus
      />
      <motion.button
        className="reset-btn"
        whileTap={{ scale: 0.95 }}
        onClick={handleReset}
      >
        {isFinished ? 'Restart' : 'Reset'}
      </motion.button>
    </div>
  );
};

export default App;