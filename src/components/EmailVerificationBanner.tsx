import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isWelcome, setIsWelcome] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Check if this is a welcome visit
    if (searchParams.get('welcome') === 'true') {
      setIsWelcome(true);
      // Clean up URL
      router.replace('/registry', { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissedKey = `email-banner-dismissed-${user?.uid}`;
    if (localStorage.getItem(dismissedKey)) {
      setDismissed(true);
    }
  }, [user?.uid]);

  // Function to check verification status
  const checkVerificationStatus = async (manual = false) => {
    if (auth.currentUser) {
      if (manual) setChecking(true);
      
      try {
        await auth.currentUser.reload();
        setIsVerified(auth.currentUser.emailVerified);
        if (auth.currentUser.emailVerified) {
          setDismissed(true);
          // Clear the dismissed flag so banner can show verification success
          if (manual && user?.uid) {
            localStorage.removeItem(`email-banner-dismissed-${user.uid}`);
          }
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      } finally {
        if (manual) setChecking(false);
      }
    }
  };

  // Check verification status on mount and periodically
  useEffect(() => {
    if (auth.currentUser) {
      checkVerificationStatus();
      
      // Check every 30 seconds if user is on the page
      const interval = setInterval(checkVerificationStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [auth.currentUser]);

  // Also check when page becomes visible (user returns from email)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkVerificationStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (user?.uid) {
      localStorage.setItem(`email-banner-dismissed-${user.uid}`, 'true');
    }
  };

  const handleResendEmail = async () => {
    if (!auth.currentUser) return;
    
    setResending(true);
    try {
      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/auth/signin?verified=true`,
        handleCodeInApp: true,
      });
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (error) {
      console.error('Failed to resend verification email:', error);
    } finally {
      setResending(false);
    }
  };

  // Don't show if user is verified, dismissed, or not logged in
  if (!user || isVerified || user.emailVerified || dismissed) return null;

  return (
    <div className={`border-b ${isWelcome ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${isWelcome ? 'text-green-500' : 'text-blue-500'}`}>
              {isWelcome ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            
            <div className="ml-3 flex-1">
              <p className={`text-sm font-medium ${isWelcome ? 'text-green-800' : 'text-blue-800'}`}>
                {isWelcome ? 
                  `🎉 Welcome to Held! Your account is ready to use.` :
                  'Please verify your email address'
                }
              </p>
              <p className={`text-xs ${isWelcome ? 'text-green-600' : 'text-blue-600'}`}>
                {isWelcome ? 
                  `Check your email (${user.email}) and click the verification link when convenient.` :
                  `We sent a verification link to ${user.email}. Some features may be limited until verified.`
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {resent ? (
              <span className={`text-xs font-medium ${isWelcome ? 'text-green-600' : 'text-blue-600'}`}>
                ✓ Email sent!
              </span>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => checkVerificationStatus(true)}
                  disabled={checking}
                  className={`text-xs ${
                    isWelcome 
                      ? 'border-green-300 text-green-700 hover:bg-green-100' 
                      : 'border-blue-300 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {checking ? 'Checking...' : 'I Verified'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendEmail}
                  disabled={resending}
                  className={`text-xs ${
                    isWelcome 
                      ? 'border-green-300 text-green-700 hover:bg-green-100' 
                      : 'border-blue-300 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {resending ? 'Sending...' : 'Resend Email'}
                </Button>
              </>
            )}
            
            <button
              onClick={handleDismiss}
              className={`${isWelcome ? 'text-green-400 hover:text-green-500' : 'text-blue-400 hover:text-blue-500'} transition-colors`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
