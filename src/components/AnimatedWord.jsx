import React from 'react';
import { motion } from 'framer-motion';

const AnimatedWord = ({ word, input }) => (
  <h1 className="text-5xl md:text-7xl font-bold tracking-widest flex justify-center gap-1 select-none mb-6">
    {word.split('').map((char, idx) => {
      let color = '';
      if (input[idx]) {
        color = input[idx] === char ? 'text-green-500' : 'text-red-500';
      } else {
        color = 'text-gray-400';
      }
      return (
        <motion.span
          key={idx}
          className={color + ' transition-colors duration-200'}
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

export default AnimatedWord;
