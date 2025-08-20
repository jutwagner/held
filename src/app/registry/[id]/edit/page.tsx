"use client";

import React, { useState } from 'react';

type UpdateObjectData = {
  // ...existing fields...
  isPublic: boolean;
  shareInCollaborative: boolean; // New field
};

const MyComponent: React.FC = () => {
  const [formData, setFormData] = useState<UpdateObjectData>({
    // ...existing state...
    isPublic: false,
    shareInCollaborative: false, // New field
  });

  return (
    <form>
      {/* Minimal edit form, no header/title at the top */}
      {/* Make Public */}
      <div className="flex items-center space-x-2 mb-4">
        <input
          type="checkbox"
          id="isPublic"
          checked={formData.isPublic}
          onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
          className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
        />
        <label htmlFor="isPublic" className="text-sm text-gray-700">
          Make this object public
        </label>
      </div>

      {/* Share in theCollaborative */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="shareInCollaborative"
          checked={formData.shareInCollaborative}
          onChange={(e) => setFormData(prev => ({ ...prev, shareInCollaborative: e.target.checked }))}
          className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
        />
        <label htmlFor="shareInCollaborative" className="text-sm text-gray-700">
          Share this object in theCollaborative
        </label>
      </div>

      {/* ...existing form fields... */}

      <DisplayObjectDetails objectData={formData} />
    </form>
  );
};

const DisplayObjectDetails = ({ objectData }: { objectData: UpdateObjectData }) => {
  return (
    <div>
      {/* Display other object details here if needed */}
      <div>
        <strong>Share in theCollaborative:</strong>{' '}
        {objectData.shareInCollaborative !== undefined ? (
          objectData.shareInCollaborative ? (
            <span className="text-green-600 flex items-center">
              <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 6.293a1 1 0 00-1.414 0L9 11.586 7.707 10.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 000-1.414z" />
              </svg>
              Shared in theCollaborative
            </span>
          ) : (
            <span className="text-red-600 flex items-center">
              <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 6.293a1 1 0 00-1.414 0L9 11.586 7.707 10.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 000-1.414z" />
              </svg>
              Not shared in theCollaborative
            </span>
          )
        ) : (
          <span>Not Set</span>
        )}
      </div>
    </div>
  );
};

export default MyComponent;