import React, { useEffect, useState } from 'react';

type ToastProps = {
  message: string;
  onClose: () => void;
};

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-md shadow-lg">
      {message}
    </div>
  );
};

export default Toast;
