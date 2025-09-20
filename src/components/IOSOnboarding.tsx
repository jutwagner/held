"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface OnboardingScreen {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  gradient: string;
  isLastScreen?: boolean;
}

const onboardingScreens: OnboardingScreen[] = [
  {
    id: 1,
    title: "Quiet home for the things you hold.",
    subtitle: "",
    description: "A way to catalog the things that matter to you, with no social pressure and no algorithms. Just your collection, your way.",
    image: "/held-logo.svg",
    gradient: "from-white via-white via-blue-100 to-indigo-200"
  },
  {
    id: 2,
    title: "Registry",
    subtitle: "Catalog your meaningful possessions",
    description: "Your private, structured database for physical objects. Track makers, years, values, and conditions with beautiful organization.",
    image: "/img/registry.svg",
    gradient: "from-white via-white via-green-100 to-emerald-200"
  },
  {
    id: 3,
    title: "Rotations",
    subtitle: "Share your style and discoveries",
    description: "Time-specific snapshots of your collection. Grouped, seasonal setups, themed collections, or current favorites.",
    image: "/img/rotations.svg",
    gradient: "from-white via-white via-purple-100 to-violet-200"
  },
  {
    id: 4,
    title: "Held+",
    subtitle: "Unlock premium features",
    description: "Get unlimited storage, advanced organization tools, priority support, and exclusive features to enhance your Held experience.",
    image: "/held-seal-plus.svg",
    gradient: "from-white via-white via-amber-100 to-yellow-200"
  },
  {
    id: 5,
    title: "Ready to start?",
    subtitle: "Let's add your first item",
    description: "Begin building your personal registry by adding something meaningful to you. It could be anything - a watch, book, piece of art, or treasured memory.",
    image: "/img/add-photo.svg",
    gradient: "from-white via-white via-rose-100 to-pink-200",
    isLastScreen: true
  }
];

interface IOSOnboardingProps {
  onComplete?: () => void;
}

export default function IOSOnboarding({ onComplete }: IOSOnboardingProps = {}) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  const router = useRouter();

  // Prevent body scrolling during onboarding
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleNext = () => {
    if (isAnimating) return;
    
    if (currentScreen === onboardingScreens.length - 1) {
      // Last screen - go to add registry item
      completeOnboarding();
      return;
    }

    setIsAnimating(true);
    setSlideDirection('next');
    
    setTimeout(() => {
      setCurrentScreen(prev => prev + 1);
      setTimeout(() => {
        setIsAnimating(false);
      }, 50);
    }, 150);
  };

  const handlePrev = () => {
    if (isAnimating || currentScreen === 0) return;
    
    setIsAnimating(true);
    setSlideDirection('prev');
    
    setTimeout(() => {
      setCurrentScreen(prev => prev - 1);
      setTimeout(() => {
        setIsAnimating(false);
      }, 50);
    }, 150);
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = () => {
    // Mark onboarding as completed in localStorage
    localStorage.setItem('held-ios-onboarding-completed', 'true');
    
    // Call completion callback if provided
    onComplete?.();
    
    // Navigate to login/signup for new users
    router.push('/auth/signin');
  };

  const currentScreenData = onboardingScreens[currentScreen];

  return (
    <div 
      className={`fixed inset-0 z-[100] overflow-hidden transition-all duration-700 ease-out`}
      style={{ 
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: `linear-gradient(135deg, white 0%, white 40%, var(--gradient-via) 70%, var(--gradient-to) 100%)`,
        backgroundSize: '300% 300%',
        animation: 'gradientShift 8s ease-in-out infinite'
      }}
    >
      <style jsx>{`
        @keyframes gradientShift {
          0%, 100% {
            background-position: 20% 20%;
          }
          50% {
            background-position: 80% 80%;
          }
        }
        :global(:root) {
          --gradient-via: ${currentScreenData.gradient.includes('blue') ? '#dbeafe' : 
                          currentScreenData.gradient.includes('green') ? '#dcfce7' :
                          currentScreenData.gradient.includes('purple') ? '#e7e5ff' :
                          currentScreenData.gradient.includes('amber') ? '#fef3c7' : '#fce7f3'};
          --gradient-to: ${currentScreenData.gradient.includes('blue') ? '#c7d2fe' : 
                         currentScreenData.gradient.includes('green') ? '#bbf7d0' :
                         currentScreenData.gradient.includes('purple') ? '#d8b4fe' :
                         currentScreenData.gradient.includes('amber') ? '#fde68a' : '#fbcfe8'};
        }
      `}</style>
      
      {/* Top Button Row */}
      <div 
        className="absolute left-0 right-0 z-20 flex justify-between items-center px-6 pt-4"
        style={{ 
          top: 'env(safe-area-inset-top, 44px)'
        }}
      >
        {/* Back Button */}
        <button
          onClick={handlePrev}
          className={`text-gray-600 text-sm font-medium hover:text-gray-800 transition-all duration-200 flex items-center gap-1 ${
            currentScreen === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-gray-500">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 18l-6-6 6-6"/>
          </svg>
          Back
        </button>

        {/* Skip Button */}
        {!currentScreenData.isLastScreen && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="text-gray-500 text-xs font-medium hover:text-gray-700 transition-colors"
            >
              🔄
            </button>
            <button
              onClick={handleSkip}
              className="text-gray-600 text-sm font-medium hover:text-gray-800 transition-colors"
            >
              Skip
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-col h-full">
        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8">
          {/* Image Container */}
          <div className={`mb-2 transition-all duration-500 ease-out ${
            isAnimating 
              ? slideDirection === 'next' 
                ? 'transform translate-x-8 opacity-0' 
                : 'transform -translate-x-8 opacity-0'
              : 'transform translate-x-0 opacity-100'
          }`}>
            <div className={`mx-auto relative ${
              currentScreen === 0 ? 'w-24 h-24' : 'w-16 h-16'
            }`}>
              <div className="absolute" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src={currentScreenData.image}
                  alt={currentScreenData.title}
                  width={currentScreen === 0 ? 100 : 64}
                  height={currentScreen === 0 ? 100 : 64}
                  className={currentScreen === 0 ? "w-24 h-24" : "w-16 h-16"}
                />
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className={`text-center max-w-sm transition-all duration-500 ease-out ${
            isAnimating 
              ? slideDirection === 'next' 
                ? 'transform translate-x-8 opacity-0' 
                : 'transform -translate-x-8 opacity-0'
              : 'transform translate-x-0 opacity-100'
          }`}>
            <h1 className="text-3xl font-bold text-gray-900 mb-3 line-height-lrg">
              {currentScreenData.title}
            </h1>
            <h2 className="text-lg font-medium text-gray-700 mb-6">
              {currentScreenData.subtitle}
            </h2>
            <p className="text-gray-600 leading-relaxed text-base">
              {currentScreenData.description}
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="px-8 pb-8">
          {/* Progress Indicators */}
          <div className="flex justify-center space-x-2 mb-8">
            {onboardingScreens.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentScreen 
                    ? 'w-8 bg-gray-800' 
                    : index < currentScreen
                      ? 'w-2 bg-gray-400'
                      : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Navigation Button - Centered */}
          <div className="flex justify-center">
            <Button
              onClick={handleNext}
              className={`px-12 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                currentScreenData.isLastScreen
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl'
              }`}
              disabled={isAnimating}
            >
              {currentScreenData.isLastScreen ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Elements for Visual Interest */}
      <div className="absolute top-1/4 left-8 w-2 h-2 bg-white/30 rounded-full animate-pulse" />
      <div className="absolute top-1/3 right-12 w-1 h-1 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/3 left-16 w-3 h-3 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-1/4 right-8 w-1.5 h-1.5 bg-white/35 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
    </div>
  );
}
