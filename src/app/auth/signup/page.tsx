'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createUserWithEmailAndPassword, sendEmailVerification, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUser } from '@/lib/firebase-services';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, label: '', color: '' });
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const router = useRouter();

  // Auto-populate display name from email
  useEffect(() => {
    if (email && email.includes('@') && !displayName) {
      const emailPrefix = email.split('@')[0];
      // Clean up email prefix to be more display-friendly
      const cleanPrefix = emailPrefix
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
      setDisplayName(cleanPrefix);
    }
  }, [email, displayName]);

  // Check password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength({ score: 0, label: '', color: '' });
      return;
    }

    let score = 0;
    let label = '';
    let color = '';

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // Determine strength
    if (score <= 2) {
      label = 'Weak';
      color = 'bg-red-500';
    } else if (score <= 4) {
      label = 'Fair';
      color = 'bg-yellow-500';
    } else if (score <= 5) {
      label = 'Good';
      color = 'bg-blue-500';
    } else {
      label = 'Strong';
      color = 'bg-green-500';
    }

    setPasswordStrength({ score, label, color });
  }, [password]);

  // Validation helpers
  const isEmailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 6;
  const doPasswordsMatch = password === confirmPassword;
  const isFormValid = isEmailValid && isPasswordValid && doPasswordsMatch && displayName.trim();

  const handleResendEmail = async () => {
    if (!createdUser) return;
    
    setResendingEmail(true);
    setError('');
    
    try {
      await sendEmailVerification(createdUser, {
        url: `${window.location.origin}/auth/signin?verified=true`,
        handleCodeInApp: true,
      });
      setSuccess(`Verification email resent to ${createdUser.email}! Please check your email (including spam folder).`);
    } catch (error) {
      console.error('Failed to resend email:', error);
      setError('Failed to resend verification email. Please try again or contact support.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!isFormValid) {
        setError('Please fill out all fields correctly');
        return;
      }

      if (!doPasswordsMatch) {
        setError('Passwords do not match');
        return;
      }

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send email verification
      try {
        await sendEmailVerification(user, {
          url: `${window.location.origin}/auth/signin?verified=true`,
          handleCodeInApp: true,
        });
        console.log('✅ Email verification sent to:', user.email);
      } catch (emailError) {
        console.warn('⚠️ Email verification failed:', emailError);
        // Don't throw error - account was still created successfully
      }

      // Create user document in Firestore
      await createUser({
        uid: user.uid,
        email: user.email!,
        displayName: displayName.trim(),
        handle: '', // Will be set later in profile
        description: '',
        avatarUrl: '',
        isPublicProfile: true,
        notifications: {
          monthlyRotation: true,
          quarterlyReview: true,
          email: true,
          push: false,
          dms: true,
        }
      });

      // Store the created user for potential email resend
      setCreatedUser(user);
      
      setSuccess(`Welcome to Held! Your account has been created successfully. We've sent a verification email to ${user.email} - please verify when convenient.`);
      
      // Log them in immediately - redirect to registry after a short delay
      setTimeout(() => {
        router.push('/registry?welcome=true');
      }, 2000);

    } catch (error: unknown) {
      if (error instanceof Error) {
        // Handle specific Firebase errors
        if (error.message.includes('email-already-in-use')) {
          setError('An account with this email already exists. Try signing in instead.');
        } else if (error.message.includes('weak-password')) {
          setError('Password is too weak. Please choose a stronger password.');
        } else if (error.message.includes('invalid-email')) {
          setError('Please enter a valid email address.');
        } else {
          setError(error.message || 'Failed to create account');
        }
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col">
      <div className="held-container py-12 sm:py-24 flex-1">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-medium mb-2">Join Held</h1>
            <p className="text-gray-600">Create your account to get started</p>
          </div>

          <div className="held-card p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Success Message */}
              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-green-600">{success}</p>
                  </div>
                  {createdUser && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-xs text-green-600 mb-2">
                        Didn't receive the email? Check your spam folder or:
                      </p>
                      <Button 
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResendEmail}
                        disabled={resendingEmail}
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        {resendingEmail ? 'Sending...' : 'Resend Verification Email'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailTouched(true);
                  }}
                  onBlur={() => setEmailTouched(true)}
                  required
                  placeholder="you@example.com"
                  className={`transition-colors ${
                    emailTouched && !isEmailValid && email ? 'border-red-300 focus:border-red-500' : 
                    emailTouched && isEmailValid ? 'border-green-300 focus:border-green-500' : ''
                  }`}
                />
                {emailTouched && email && !isEmailValid && (
                  <p className="mt-1 text-sm text-red-600">Please enter a valid email address</p>
                )}
                {emailTouched && isEmailValid && (
                  <p className="mt-1 text-sm text-green-600">✓ Email looks good</p>
                )}
              </div>

              {/* Display Name Field */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="transition-colors"
                />
                <p className="mt-1 text-xs text-gray-500">This will be your public display name. You can change it later.</p>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordTouched(true);
                  }}
                  onBlur={() => setPasswordTouched(true)}
                  required
                  placeholder="Create a strong password"
                  minLength={6}
                  className="transition-colors"
                />
                
                {/* Password Strength Indicator */}
                {passwordTouched && password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Password strength:</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength.score <= 2 ? 'text-red-600' :
                        passwordStrength.score <= 4 ? 'text-yellow-600' :
                        passwordStrength.score <= 5 ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {passwordTouched && password && password.length < 6 && (
                  <p className="mt-1 text-sm text-red-600">Password must be at least 6 characters</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmPasswordTouched(true);
                  }}
                  onBlur={() => setConfirmPasswordTouched(true)}
                  required
                  placeholder="Confirm your password"
                  className={`transition-colors ${
                    confirmPasswordTouched && confirmPassword && !doPasswordsMatch ? 'border-red-300 focus:border-red-500' : 
                    confirmPasswordTouched && doPasswordsMatch && confirmPassword ? 'border-green-300 focus:border-green-500' : ''
                  }`}
                />
                {confirmPasswordTouched && confirmPassword && !doPasswordsMatch && (
                  <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                )}
                {confirmPasswordTouched && doPasswordsMatch && confirmPassword && (
                  <p className="mt-1 text-sm text-green-600">✓ Passwords match</p>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !isFormValid}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>

              {/* Email Verification Notice */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Email verification required</p>
                    <p className="text-xs text-blue-500 mt-1">
                      We'll send a verification link to your email. Please click it to activate your account.
                    </p>
                  </div>
                </div>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/signin" className="text-gray-900 hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Footer is site-wide via layout */}
    </div>
  );
}
