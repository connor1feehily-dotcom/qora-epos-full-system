import { useState, useEffect } from "react";
import kerrigansLogo from "@assets/NEW_1749822871411.png";

export function KerrigansLoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("Initializing system...");

  const loadingSteps = [
    { text: "Initializing Kerrigan's XL POS System...", duration: 3000 },
    { text: "Connecting to database...", duration: 3000 },
    { text: "Loading product catalog...", duration: 3000 },
    { text: "Setting up payment systems...", duration: 3000 },
    { text: "Configuring staff authentication...", duration: 3000 },
    { text: "Preparing till stations...", duration: 3000 },
    { text: "Loading inventory data...", duration: 3000 },
    { text: "Finalizing setup...", duration: 4000 }
  ];

  useEffect(() => {
    let stepIndex = 0;
    let startTime = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const totalDuration = 25000; // 25 seconds
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      
      setProgress(newProgress);

      // Update current step based on elapsed time
      let accumulatedTime = 0;
      for (let i = 0; i < loadingSteps.length; i++) {
        accumulatedTime += loadingSteps[i].duration;
        if (elapsed < accumulatedTime) {
          if (stepIndex !== i) {
            stepIndex = i;
            setCurrentStep(loadingSteps[i].text);
          }
          break;
        }
      }

      if (elapsed < totalDuration) {
        requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-green-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto px-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src={kerrigansLogo} 
            alt="Kerrigan's XL Logo"
            className="h-24 w-auto object-contain animate-pulse"
          />
        </div>

        {/* Loading Animation */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto relative">
            {/* Outer Ring */}
            <div className="absolute inset-0 border-4 border-blue-200 dark:border-slate-700 rounded-full"></div>
            
            {/* Progress Ring */}
            <svg className="w-32 h-32 -rotate-90 absolute inset-0" viewBox="0 0 128 128">
              <circle
                cx="64"
                cy="64"
                r="60"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - progress / 100)}`}
                strokeLinecap="round"
                className="text-blue-500 transition-all duration-300 ease-out"
              />
            </svg>
            
            {/* Center Logo/Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center animate-spin">
                <div className="w-8 h-8 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* Progress Percentage */}
          <div className="mt-4">
            <span className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Current Step */}
        <div className="mb-8">
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
            {currentStep}
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Loading Dots */}
        <div className="flex justify-center space-x-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>

        {/* Welcome Message */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            Welcome to Kerrigan's XL
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Manorhamilton's Premier Point of Sale System
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Licensed to Kerrigan's XL from The Feehily Boyle Group
          </p>
        </div>
      </div>
    </div>
  );
}