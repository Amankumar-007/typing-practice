import React from 'react';
import { motion } from 'framer-motion';

const TypingInput = React.forwardRef(({ value, onChange, disabled, isFinished }, ref) => (
  <motion.input
    ref={ref}
    className="w-full max-w-md px-6 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-400 outline-none text-2xl md:text-3xl text-center bg-white shadow transition-all duration-200 mb-4"
    type="text"
    value={value}
    onChange={onChange}
    disabled={disabled}
    placeholder="Start typing..."
    autoFocus
    whileFocus={{ scale: 1.03 }}
    animate={{ opacity: isFinished ? 0.5 : 1 }}
  />
));

export default TypingInput;
