import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createObject } from '@/lib/firebase-services';
import { getAuth } from 'firebase/auth';
import Tooltip from '@/components/Tooltip';

// Placeholder for photo input
const PhotoInput = ({ onPhotoSelected }: { onPhotoSelected: (photo: string) => void }) => {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        onPhotoSelected(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="rounded-xl overflow-hidden border-2 border-dashed border-gray-300 w-64 h-40 flex items-center justify-center bg-gray-50">
        <span className="text-gray-400">Photo Preview</span>
      </div>
      <label className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-full shadow cursor-pointer">
        Snap or Choose Photo
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>
      {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
    </div>
  );
};

const AddObjectFlow: React.FC = () => {
  const [showCard, setShowCard] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [step, setStep] = useState(1); // Track the current step in the flow
  const [name, setName] = useState('');
  const [maker, setMaker] = useState('');
  const [year, setYear] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [passportVisible, setPassportVisible] = useState(false);
  const [condition, setCondition] = useState(''); // Add condition state

  const handleNextStep = () => {
    setStep((prev) => prev + 1);
  };

  const handleSave = async () => {
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      if (!userId) {
        alert('User not authenticated. Please log in.');
        return;
      }

      const validConditions: ('excellent' | 'good' | 'fair' | 'poor')[] = ['excellent', 'good', 'fair', 'poor'];
      const normalizedCondition: 'excellent' | 'good' | 'fair' | 'poor' = validConditions.includes(condition.toLowerCase() as any)
        ? (condition.toLowerCase() as 'excellent' | 'good' | 'fair' | 'poor')
        : 'fair'; // Default to 'fair' if invalid

      const newObject = {
        title: name,
        maker,
        year: year ? parseInt(year, 10) : undefined, // Convert year to a number if provided
        value: value ? parseFloat(value) : undefined, // Convert value to a number if provided
        notes,
        tags: tags.split(','),
        isPublic: passportVisible,
        images: photo ? [new File([photo], 'photo.jpg', { type: 'image/jpeg' })] : [], // Include photo if provided
        condition: normalizedCondition, // Ensure valid condition
        userId, // Add userId to match Firestore rules
      };
      console.log('Saving object:', newObject);
      await createObject(userId, newObject);
      alert('Added to your Held Registry!');
      setShowCard(false);
    } catch (error) {
      console.error('Error saving object:', error);
      alert('Failed to save the object. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <button
        className="px-6 py-3 bg-purple-700 text-white rounded-full text-lg font-bold shadow-lg"
        onClick={() => setShowCard(true)}
      >
        Hold Something New
      </button>

      <AnimatePresence>
        {showCard && (
          <motion.div
            initial={{ y: '100vh', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100vh', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40"
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {step === 1 && (
                <>
                  <div className="mb-4 text-lg font-semibold text-purple-700">Let’s welcome it in.</div>
                  <PhotoInput onPhotoSelected={setPhoto} />
                  <input
                    type="text"
                    placeholder="What’s it called?"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-4 px-4 py-2 border rounded w-full"
                  />
                  <button
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-full"
                    onClick={handleNextStep}
                  >
                    Next
                  </button>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="mb-4 text-lg font-semibold text-purple-700">Who brought it into the world?</div>
                  <input
                    type="text"
                    placeholder="Maker"
                    value={maker}
                    onChange={(e) => setMaker(e.target.value)}
                    className="mt-2 px-4 py-2 border rounded w-full"
                  />
                  <input
                    type="text"
                    placeholder="Year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="mt-2 px-4 py-2 border rounded w-full"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="mt-2 px-4 py-2 border rounded w-full"
                  />
                  <textarea
                    placeholder="Any notes you want to remember?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-2 px-4 py-2 border rounded w-full"
                  />
                  <input
                    type="text"
                    placeholder="Condition"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="mt-2 px-4 py-2 border rounded w-full"
                  />
                  <button
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-full"
                    onClick={handleNextStep}
                  >
                    Next
                  </button>
                </>
              )}
              {step === 3 && (
                <>
                  <div className="mb-4 text-lg font-semibold text-purple-700">Add tags and toggle visibility.</div>
                  <input
                    type="text"
                    placeholder="Tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="mt-2 px-4 py-2 border rounded w-full"
                  />
                  <div className="mt-4 flex items-center">
                    <input
                      type="checkbox"
                      checked={passportVisible}
                      onChange={(e) => setPassportVisible(e.target.checked)}
                      className="mr-2"
                    />
                    <label>Make Passport visible</label>
                  </div>
                  <button
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-full"
                    onClick={handleSave}
                  >
                    Save
                  </button>
                </>
              )}
              <button
                className="mt-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-full"
                onClick={() => setShowCard(false)}
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddObjectFlow;
