import React from 'react';
import { motion } from 'framer-motion';

const ResetButton = ({ onClick, isFinished }) => (
  <motion.button
    className="mt-2 px-6 py-2 rounded-lg bg-blue-500 text-white font-semibold shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all text-lg"
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
  >
    {isFinished ? 'Restart' : 'Reset'}
  </motion.button>
);

export default ResetButton;
