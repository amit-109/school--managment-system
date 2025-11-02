import React, { useState, useEffect } from 'react';

const VideoPromo = () => {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const scenes = [
    {
      title: "Welcome to EduManage Pro",
      subtitle: "Modern School Management System",
      icon: "🎓",
      bg: "from-blue-600 to-purple-600"
    },
    {
      title: "Student Management",
      subtitle: "Complete student profiles & tracking",
      icon: "👨🎓",
      bg: "from-green-500 to-blue-500"
    },
    {
      title: "Fee Management",
      subtitle: "Automated fee collection & reporting",
      icon: "💰",
      bg: "from-yellow-500 to-orange-500"
    },
    {
      title: "Staff & Classes",
      subtitle: "Manage teachers & class schedules",
      icon: "👥",
      bg: "from-purple-500 to-pink-500"
    },
    {
      title: "Reports & Analytics",
      subtitle: "Powerful insights & data visualization",
      icon: "📊",
      bg: "from-indigo-500 to-purple-500"
    },
    {
      title: "Get Started Today!",
      subtitle: "Transform your school management",
      icon: "🚀",
      bg: "from-blue-600 to-purple-600"
    }
  ];

  useEffect(() => {
    if (!isPlaying) return;
    
    const timer = setInterval(() => {
      setCurrentScene((prev) => {
        if (prev === scenes.length - 1) {
          setTimeout(() => setCurrentScene(0), 1000);
          return prev;
        }
        return prev + 1;
      });
    }, 2500);

    return () => clearInterval(timer);
  }, [isPlaying, scenes.length]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl">
      {/* Video Container */}
      <div className="relative aspect-video">
        {/* Scene Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${scenes[currentScene].bg} transition-all duration-1000`}>
          {/* Animated Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              ></div>
            ))}
          </div>

          {/* Scene Content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-white p-8 text-center">
            <div className="text-6xl mb-4 animate-bounce">
              {scenes[currentScene].icon}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 animate-fade-in-up">
              {scenes[currentScene].title}
            </h2>
            <p className="text-lg md:text-xl opacity-90 animate-fade-in-up delay-200">
              {scenes[currentScene].subtitle}
            </p>

            {/* Feature Demo Elements */}
            {currentScene > 0 && currentScene < scenes.length - 1 && (
              <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-md animate-fade-in-up delay-400">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div className="w-8 h-8 bg-white/30 rounded-full mx-auto mb-2 animate-pulse"></div>
                    <div className="h-2 bg-white/30 rounded w-full animate-pulse delay-100"></div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA on last scene */}
            {currentScene === scenes.length - 1 && (
              <div className="mt-8 animate-fade-in-up delay-400">
                <button className="bg-white text-gray-900 px-8 py-3 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors transform hover:scale-105">
                  Start Free Trial
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Video Controls */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={togglePlay}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* Progress Bar */}
          <div className="flex-1 mx-4 bg-black/30 rounded-full h-1 overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-300 ease-linear"
              style={{ width: `${((currentScene + 1) / scenes.length) * 100}%` }}
            ></div>
          </div>

          {/* Scene Counter */}
          <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentScene + 1} / {scenes.length}
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="bg-gray-900 text-white p-4">
        <h3 className="font-semibold">EduManage Pro - Demo Video</h3>
        <p className="text-sm text-gray-400 mt-1">
          See how our school management system can transform your institution
        </p>
      </div>
    </div>
  );
};

export default VideoPromo;