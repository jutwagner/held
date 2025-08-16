"use client";

import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase'; // Import auth from your firebase configuration
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const EditObjectPage: React.FC = () => {
  const pathname = usePathname();
  const segments = pathname.split('/');
  const id = segments[segments.length - 2]; // Extract the second-to-last segment as the ID
  const [objectData, setObjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // Track the current step in the form

  const totalSteps = 4; // Update the total steps to include the image step

  const { user, loading: authLoading } = useAuth(); // Get user and loading state from AuthContext

  useEffect(() => {
    if (id) {
      const fetchObject = async () => {
        try {
          console.log('Authenticated user:', auth.currentUser);
          console.log('Authenticated user UID:', auth.currentUser?.uid);
          console.log('Fetching object with ID:', id);
          console.log('Extracted ID from URL:', id);
          console.log('Fetching document for edit page...');

          const docRef = doc(db, 'objects', id as string);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            console.log('Document ID being fetched:', id);
            console.log('Firestore document data:', docSnap.data());
            setObjectData(docSnap.data());
          } else {
            setError('Object not found.');
          }
        } catch (err) {
          console.error('Error fetching object:', err);
          setError('Failed to fetch object.');
        } finally {
          setLoading(false);
        }
      };

      fetchObject();
    }
  }, [id]);

  const handleUpdate = async () => {
    try {
      console.log('Updating document with ID:', id);
      console.log('Data being updated:', objectData);

      const docRef = doc(db, 'objects', id as string);
      await updateDoc(docRef, objectData);
      alert('Object updated successfully!');
      window.location.href = `/registry/${id}`;
    } catch (err) {
      console.error('Error updating object:', err);
      alert('Failed to update object.');
    }
  };

  const handleNextStep = () => {
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  useEffect(() => {
    if (!auth.currentUser) {
      console.error('User not authenticated. Redirecting to login page.');
      window.location.href = '/login';
    }
  }, []);

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    window.location.href = '/login';
    return null;
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <AnimatePresence>
        {step === 1 && (
          <motion.div
            initial={{ y: '100vh', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100vh', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center"
          >
            <h1 className="text-2xl font-bold mb-4">Edit Object - Picture</h1>
            {objectData.picture ? (
              <div className="flex flex-col items-center">
                <img
                  src={objectData.picture}
                  alt="Current Object"
                  className="w-32 h-32 object-cover rounded mb-4"
                />
                <button
                  onClick={() => setObjectData({ ...objectData, picture: null })}
                  className="px-4 py-2 bg-red-600 text-white rounded mb-4"
                >
                  Remove Picture
                </button>
              </div>
            ) : (
              <p className="text-gray-500 mb-4">No picture uploaded yet.</p>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setObjectData({ ...objectData, picture: event.target?.result });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="mb-4"
            />
            <button
              onClick={handleNextStep}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Next
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ y: '100vh', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100vh', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center"
          >
            <h1 className="text-2xl font-bold mb-4">Edit Object - Step 2</h1>
            <input
              type="text"
              value={objectData.maker || ''}
              onChange={(e) => setObjectData({ ...objectData, maker: e.target.value })}
              placeholder="Maker"
              className="w-full p-2 border rounded mb-4"
            />
            <input
              type="number"
              value={objectData.year || ''}
              onChange={(e) => setObjectData({ ...objectData, year: e.target.value })}
              placeholder="Year"
              className="w-full p-2 border rounded mb-4"
            />
            <button
              onClick={handlePreviousStep}
              className="px-4 py-2 bg-gray-400 text-white rounded mr-2"
            >
              Back
            </button>
            <button
              onClick={handleNextStep}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Next
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ y: '100vh', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100vh', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center"
          >
            <h1 className="text-2xl font-bold mb-4">Edit Object - Step 3</h1>
            <textarea
              value={objectData.notes || ''}
              onChange={(e) => setObjectData({ ...objectData, notes: e.target.value })}
              placeholder="Notes"
              className="w-full p-2 border rounded mb-4"
            />
            <button
              onClick={handlePreviousStep}
              className="px-4 py-2 bg-gray-400 text-white rounded mr-2"
            >
              Back
            </button>
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Save Changes
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditObjectPage;
