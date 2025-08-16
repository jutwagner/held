import React from 'react';

const playSound = (url: string) => {
  const audio = new Audio(url);
  audio.play();
};

export default playSound;
