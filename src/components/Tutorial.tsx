import React from 'react';

const Tutorial: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
        <h2 className="text-xl font-bold mb-4">Welcome to Settings</h2>
        <p className="text-gray-700 mb-4">Here you can customize your preferences, upload an avatar, and explore achievements.</p>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-md" onClick={() => alert('Tutorial dismissed!')}>
          Got it!
        </button>
      </div>
    </div>
  );
};

export default Tutorial;
