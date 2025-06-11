import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const Timer = ({ timer, isFinished }) => {
  // Format time to display minutes:seconds for longer durations
  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <motion.div
      className="text-lg md:text-2xl font-semibold text-blue-500 mb-4"
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {isFinished ? 'Time Up!' : `Time: ${formatTime(timer)}`}
    </motion.div>
  );
};

export default Timer;
