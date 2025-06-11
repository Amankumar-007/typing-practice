import React from 'react';
import { motion } from 'framer-motion';

const TypingInput = React.forwardRef(({ value, onChange, disabled, isFinished }, ref) => (
  <motion.input
    ref={ref}
    className="w-full max-w-lg px-6 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 outline-none text-2xl md:text-3xl font-medium text-center bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-lg transition-all duration-300 mb-6 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-600"
    type="text"
    value={value}
    onChange={onChange}
    disabled={disabled}
    placeholder="Type here..."
    autoFocus
    aria-label="Typing input field"
    whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)' }}
    animate={{
      opacity: isFinished ? 0.7 : 1,
      borderColor: isFinished ? '#9CA3AF' : '#E5E7EB',
    }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
  />
));

export default TypingInput;