import { useEffect, useState } from "react";
import quantumLogo from "@assets/Quantum POS Logo _1754045289852.png";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Clock, Shield } from "lucide-react";

interface InactiveScreenProps {
  onActivate: () => void;
  lastActivity?: Date;
}

export function InactiveScreen({ onActivate, lastActivity }: InactiveScreenProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  console.log("InactiveScreen component rendered");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let activityTimeout: NodeJS.Timeout;
    let isReady = false;
    
    const handleActivity = (e: Event) => {
      // Only activate after a delay and on significant interactions
      if (isReady && (e.type === 'click' || (e.type === 'keydown' && (e as KeyboardEvent).key === 'Enter'))) {
        console.log("Inactive screen - user interaction detected:", e.type);
        onActivate();
      }
    };

    // Wait longer before adding listeners to avoid immediate activation
    activityTimeout = setTimeout(() => {
      isReady = true;
      document.addEventListener('click', handleActivity);
      document.addEventListener('keydown', handleActivity);
    }, 2000);

    return () => {
      clearTimeout(activityTimeout);
      isReady = false;
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('keydown', handleActivity);
    };
  }, [onActivate]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Main content */}
      <div className="text-center z-10 max-w-2xl mx-auto px-8">
        {/* Logo and branding */}
        <div className="mb-12">
          <div className="relative mb-8">
            <img 
              src={quantumLogo} 
              alt="Quantum POS Logo"
              className="h-32 w-auto mx-auto drop-shadow-2xl animate-pulse"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-xl opacity-20 animate-ping"></div>
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-4 tracking-wider">
            QUANTUM POS
          </h1>
          
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent flex-1"></div>
            <span className="text-cyan-300 text-lg font-medium px-4">ADVANCED RETAIL SYSTEM</span>
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent flex-1"></div>
          </div>
        </div>

        {/* Time and date display */}
        <Card className="bg-black/30 backdrop-blur-sm border-cyan-500/30 p-8 mb-8">
          <div className="text-center">
            <div className="text-7xl font-mono font-bold text-cyan-300 mb-2 tracking-wider">
              {formatTime(currentTime)}
            </div>
            <div className="text-xl text-cyan-100 font-medium">
              {formatDate(currentTime)}
            </div>
          </div>
        </Card>

        {/* System status */}
        <div className="flex justify-center space-x-6 mb-12">
          <Badge className="bg-green-500/20 text-green-300 border-green-500/50 px-4 py-2">
            <Shield className="w-4 h-4 mr-2" />
            System Secure
          </Badge>
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50 px-4 py-2">
            <Monitor className="w-4 h-4 mr-2" />
            POS Ready
          </Badge>
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/50 px-4 py-2">
            <Clock className="w-4 h-4 mr-2" />
            Standby Mode
          </Badge>
        </div>

        {/* Activation instruction */}
        <div className="text-cyan-200 text-lg mb-8 animate-pulse">
          Touch screen or press any key to activate
        </div>

        {/* Licensing information */}
        <div className="border-t border-cyan-500/30 pt-8">
          <div className="text-cyan-100 text-sm mb-2">
            Licensed Point of Sale System
          </div>
          <div className="text-white font-semibold text-lg mb-2">
            © The Feehily Boyle Group
          </div>
          <div className="text-cyan-300 text-sm">
            Professional Retail Solutions & Technology Licensing
          </div>
          {lastActivity && (
            <div className="text-cyan-400 text-xs mt-4">
              Last activity: {lastActivity.toLocaleTimeString('en-IE')}
            </div>
          )}
        </div>
      </div>

      {/* Floating particles animation */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400 rounded-full opacity-20 animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}