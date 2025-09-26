import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { UserDoc } from '@/types';
import { deleteUserAccount } from '@/lib/firebase-services';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

export default function DangerZoneSection({ user }: { user?: UserDoc }) {
  const [confirmDelete, setConfirmDelete] = useState('');
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  React.useEffect(() => {
    setHydrated(true);
  }, []);
  
  const isLoading = !user || !hydrated;

  const handleDeleteAccount = async () => {
    if (!auth.currentUser || !user) return;
    
    setDeleting(true);
    setError('');
    
    try {
      // First delete all user data from Firestore
      await deleteUserAccount(user.uid);
      
      // Try to delete the Firebase Auth user
      try {
        await deleteUser(auth.currentUser);
        // Redirect to homepage if successful
        router.push('/?message=Account deleted successfully');
      } catch (authError: any) {
        console.error('Auth deletion failed:', authError);
        if (authError.code === 'auth/requires-recent-login') {
          // Need password to re-authenticate
          setNeedsPassword(true);
          setDeleting(false);
          setError('To complete account deletion, please enter your password below.');
          return;
        } else {
          // Other error, just sign out
          console.warn('Auth user deletion failed, signing out instead:', authError);
          await auth.signOut();
          router.push('/?message=Account data deleted successfully');
        }
      }
      
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setError('Failed to delete account. Please try again or contact support.');
      setDeleting(false);
    }
  };

  const handlePasswordReauth = async () => {
    if (!auth.currentUser || !user || !password) return;
    
    setDeleting(true);
    setError('');
    
    try {
      // Re-authenticate with password
      const credential = EmailAuthProvider.credential(user.email || '', password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Now delete the Firebase Auth user
      await deleteUser(auth.currentUser);
      
      // Redirect to homepage
      router.push('/?message=Account completely deleted');
      
    } catch (error: any) {
      console.error('Error with re-authentication or deletion:', error);
      if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else {
        setError('Failed to complete deletion. Please contact support.');
      }
    } finally {
      setDeleting(false);
    }
  };

  const isConfirmationValid = confirmDelete === 'delete';

  return (
    <section aria-labelledby="danger-header" className="mb-8">
      <h2 id="danger-header" className="font-serif text-xl mb-4 text-black">Delete Account</h2>
      {isLoading ? (
        <div className="text-gray-400 text-sm">Loading danger zone…</div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {!showConfirmation ? (
            <div>
              <div className="mb-4">
                <p className="text-sm text-red-600 mb-4">
                  This action cannot be undone. This will permanently delete your account and remove all your data including:
                </p>
                <ul className="text-sm text-red-600 list-disc list-inside mb-4 space-y-1">
                  <li>Your profile and all personal information</li>
                  <li>All objects in your registry</li>
                  <li>All rotations you've created</li>
                  <li>All conversations and messages</li>
                  <li>All images and files you've uploaded</li>
                </ul>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(true)}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                I understand, delete my account
              </Button>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h3 className="font-semibold text-red-700 mb-2">Confirm Account Deletion</h3>
                <p className="text-sm text-red-600 mb-4">
                  To confirm permanent deletion of your account, type "delete" below.
                </p>
              </div>
              
              {!needsPassword ? (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-red-700 mb-2">
                    Type "delete" to confirm
                  </label>
                  <input
                    type="text"
                    placeholder="Type delete to confirm"
                    value={confirmDelete}
                    onChange={(e) => setConfirmDelete(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center font-mono text-lg"
                    autoFocus
                  />
                  {confirmDelete && confirmDelete !== 'delete' && (
                    <p className="mt-2 text-sm text-red-500">Please type exactly "delete"</p>
                  )}
                  {confirmDelete === 'delete' && (
                    <p className="mt-2 text-sm text-green-600">✓ Confirmation word entered correctly</p>
                  )}
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-red-700 mb-2">
                    Enter your password to complete deletion
                  </label>
                  <input
                    type="password"
                    placeholder="Your account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    autoFocus
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    This ensures your Firebase Auth account is completely removed.
                  </p>
                </div>
              )}
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConfirmation(false);
                    setNeedsPassword(false);
                    setConfirmDelete('');
                    setPassword('');
                    setError('');
                  }}
                  disabled={deleting}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={needsPassword ? handlePasswordReauth : handleDeleteAccount}
                  disabled={needsPassword ? (!password || deleting) : (!isConfirmationValid || deleting)}
                  className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                >
                  {deleting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {needsPassword ? 'Completing Deletion...' : 'Deleting Account...'}
                    </div>
                  ) : (
                    needsPassword ? 'Complete Account Deletion' : 'Delete My Account Forever'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
