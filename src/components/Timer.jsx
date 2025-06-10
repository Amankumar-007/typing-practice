import React from 'react';
import { motion } from 'framer-motion';

const Timer = ({ timer, isFinished }) => (
  <motion.div
    className="text-lg md:text-2xl font-semibold text-blue-500 mb-4"
    initial={{ y: -30, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    {isFinished ? 'Time Up!' : `Time: ${timer}s`}
  </motion.div>
);

export default Timer;
