import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedWord from './AnimatedWord';

const WordGrid = ({ words, input }) => (
  <div className="w-full h-32 overflow-y-auto bg-gray-50 border border-gray-200 rounded-lg shadow-inner p-4 mb-4 flex flex-wrap gap-3 justify-center items-start transition-all duration-300">
    <AnimatePresence>
      {words.map((w, idx) => (
        <motion.div
          key={w + idx}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <AnimatedWord word={w} input={idx === 0 ? input : ''} />
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

export default WordGrid;
