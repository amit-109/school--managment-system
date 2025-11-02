import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AnimatedDemo from './shared/AnimatedDemo';

export default function LandingPage({ onSignIn, onRegister }) {
  const carousel = [
    '/src/assets/Capture1.JPG',
    '/src/assets/Capture2.JPG',
    '/src/assets/Capture3.JPG',
    '/src/assets/Capture4.JPG',
    '/src/assets/Capture5.JPG',
    '/src/assets/Capture6.JPG',
  ];

  const [index, setIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  
  useEffect(() => {
    if (!isAutoPlay) return;
    const t = setInterval(() => setIndex(i => (i + 1) % carousel.length), 3000);
    return () => clearInterval(t);
  }, [isAutoPlay]);

  const nextSlide = () => {
    setIndex((index + 1) % carousel.length);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 5000);
  };

  const prevSlide = () => {
    setIndex((index - 1 + carousel.length) % carousel.length);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 5000);
  };

  const [contact, setContact] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState({});

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContact({ ...contact, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!contact.name || contact.name.trim().length < 2) newErrors.name = 'Please enter your name (2+ characters)';
    if (!contact.email || !validateEmail(contact.email)) newErrors.email = 'Please enter a valid email address';
    if (!contact.phone || contact.phone.trim().length < 10) newErrors.phone = 'Please enter a valid phone number';
    if (!contact.message || contact.message.trim().length < 10) newErrors.message = 'Message should be at least 10 characters';

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      toast.error('Please correct the highlighted fields');
      return;
    }

    setSending(true);
    
    // Send email using Web3Forms with clean text format
    const formData = new FormData();
    formData.append('access_key', '7fc0e847-b426-47cf-8ae9-a97570422b6d');
    formData.append('name', contact.name);
    formData.append('email', contact.email);
    formData.append('phone', contact.phone);
    formData.append('subject', `🎓 New EduManage Pro Inquiry from ${contact.name}`);
    
    // Clean text message format
    const textMessage = `🎓 EduManage Pro - New Contact Form Submission\n\n` +
      `👤 Name: ${contact.name}\n` +
      `📧 Email: ${contact.email}\n` +
      `📱 Phone: ${contact.phone}\n\n` +
      `💬 Message:\n${contact.message}\n\n` +
      `⏰ Received: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n` +
      `🌐 Source: EduManage Pro Contact Form`;
    
    formData.append('message', textMessage);

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      setSending(false);
      if (data.success) {
        toast.success('Message sent successfully!');
        setContact({ name: '', email: '', phone: '', message: '' });
        setErrors({});
      } else {
        throw new Error(data.message || 'Failed to send');
      }
    })
    .catch(error => {
      setSending(false);
      toast.error('Failed to send message. Please try again.');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in-left {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        .animate-fade-in-left {
          animation: fade-in-left 1s ease-out forwards;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-1000 { animation-delay: 1s; }
      `}</style>

      {/* Enhanced Hero Section with Animations */}
      <div className="relative overflow-hidden min-h-screen flex items-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-300/10 to-purple-300/10 rounded-full blur-2xl animate-bounce delay-500"></div>
        </div>
        
        {/* Floating Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 animate-float">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div className="absolute top-40 right-20 animate-float delay-1000">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="absolute bottom-32 left-1/4 animate-float delay-500">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:flex lg:items-center lg:px-8">
          <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
              <img src="/src/assets/logo.svg" alt="Logo" className="w-16 h-16 rounded-full shadow-xl animate-pulse" />
              <span className="rounded-full bg-gradient-to-r from-blue-600/10 to-purple-600/10 px-6 py-3 text-sm font-semibold text-blue-600 ring-1 ring-inset ring-blue-600/20 animate-bounce">
                ✨ New — Enhanced UI
              </span>
            </div>
            
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl animate-fade-in-up">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EduManage Pro
              </span>
              <br />
              <span className="text-gray-900 dark:text-slate-100">School Management</span>
            </h1>
            
            <p className="mt-6 text-lg leading-7 text-gray-600 dark:text-slate-400 animate-fade-in-up delay-200">
              Transform your educational institution with our comprehensive, cloud-based management system. 
              <span className="font-semibold text-blue-600">Streamline operations, enhance communication, and boost productivity.</span>
            </p>
            
            {/* Feature Pills */}
            <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-3 animate-fade-in-up delay-300">
              <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                📚 Student Management
              </span>
              <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                💰 Fee Management
              </span>
              <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                👥 Staff Management
              </span>
            </div>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 animate-fade-in-up delay-400">
              <button
                onClick={onRegister}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10">Get Started Free</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              <button
                onClick={onSignIn}
                className="flex items-center gap-2 text-gray-900 dark:text-slate-100 font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
              >
                Sign In 
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Animated Dashboard Preview */}
          <div className="mt-16 lg:mt-0 lg:ml-16 flex-1 animate-fade-in-left">
            <AnimatedDemo />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Everything you need</h2>
            <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100 sm:text-3xl">
              Powerful Features for Modern Schools
            </p>
            <p className="mt-4 text-base leading-7 text-gray-600 dark:text-slate-400">
              Comprehensive school management solution designed to scale with your institution's needs.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl lg:mt-16 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-12 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-slate-100">
                  <svg className="h-5 w-5 flex-none text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.5 17a4.5 4.5 0 01-1.44-8.765 4.5 4.5 0 018.302-3.046 3.5 3.5 0 014.504 4.272A4 4 0 0115 17H5.5zm3.75-2.75a.75.75 0 001.5 0V9.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0l-3.25 3.5a.75.75 0 101.1 1.02l1.95-2.1v4.59z" clipRule="evenodd" />
                  </svg>
                  Student Management
                </dt>
                <dd className="mt-2 text-base leading-6 text-gray-600 dark:text-slate-400">
                  Complete student profiles with enrollment, grades, attendance, and performance tracking.
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-slate-100">
                  <svg className="h-5 w-5 flex-none text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                  </svg>
                  Fee Management
                </dt>
                <dd className="mt-2 text-base leading-6 text-gray-600 dark:text-slate-400">
                  Automated fee collection with flexible structures, payment tracking, and financial reporting.
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-slate-100">
                  <svg className="h-5 w-5 flex-none text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4.632 3.533A2 2 0 016.577 2h6.846a2 2 0 011.945 1.533l1.976 8.234A3.489 3.489 0 0016 11.5H4c-.476 0-.93.095-1.344.267l1.976-8.234z" />
                    <path fillRule="evenodd" d="M4 13a2 2 0 100 4h12a2 2 0 100-4H4zm11.24 2a.75.75 0 01.75-.75H16a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V15zm-2.25-.75a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75H13a.75.75 0 00.75-.75V15a.75.75 0 00-.75-.75h-.01z" clipRule="evenodd" />
                  </svg>
                  Staff & Classes
                </dt>
                <dd className="mt-2 text-base leading-6 text-gray-600 dark:text-slate-400">
                  Manage teachers, administrative staff, class schedules, subjects, and academic sessions.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Enhanced Gallery Section */}
      <section className="py-16 px-6 lg:px-8 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-800/50 dark:to-slate-700/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Application Gallery</h3>
            <p className="mt-3 text-base text-gray-600 dark:text-slate-400">Explore our intuitive interface and powerful features</p>
          </div>
          
          <div className="relative max-w-5xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl group">
              <img 
                src={carousel[index]} 
                alt={`Screenshot ${index + 1}`} 
                className="w-full h-80 lg:h-96 object-cover transition-all duration-500 ease-in-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
              
              <button 
                onClick={prevSlide}
                className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full p-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full p-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {/* Thumbnail Navigation */}
            <div className="flex justify-center mt-8 gap-3 overflow-x-auto pb-2">
              {carousel.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    i === index 
                      ? 'border-blue-500 shadow-lg scale-110' 
                      : 'border-gray-300 dark:border-slate-600 hover:border-blue-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6 bg-gray-200 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${((index + 1) / carousel.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Contact Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Get In Touch</h2>
            <p className="mt-3 text-base text-gray-600 dark:text-slate-400">Ready to transform your school? Let's discuss how we can help.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl">
                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6">Contact Information</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-slate-100">Email</p>
                      <p className="text-gray-600 dark:text-slate-400">support@edumanage.pro</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-slate-100">Phone</p>
                      <p className="text-gray-600 dark:text-slate-400">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-slate-100">Response Time</p>
                      <p className="text-gray-600 dark:text-slate-400">Within 24 hours</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <h4 className="text-lg font-bold mb-4">Why Choose EduManage Pro?</h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Cloud-based & Secure</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>24/7 Customer Support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Free Training & Setup</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Enhanced Contact Form */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl">
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      id="contact-name" 
                      name="name" 
                      value={contact.name} 
                      onChange={handleContactChange}
                      placeholder="Enter your full name"
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                        errors.name 
                          ? 'border-red-400 focus:border-red-500' 
                          : 'border-gray-200 dark:border-slate-600 focus:border-blue-500'
                      } bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100`}
                    />
                    {errors.name && <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.name}
                    </p>}
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input 
                      id="contact-email" 
                      name="email" 
                      type="email" 
                      value={contact.email} 
                      onChange={handleContactChange}
                      placeholder="your@email.com"
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                        errors.email 
                          ? 'border-red-400 focus:border-red-500' 
                          : 'border-gray-200 dark:border-slate-600 focus:border-blue-500'
                      } bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100`}
                    />
                    {errors.email && <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.email}
                    </p>}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input 
                    id="contact-phone" 
                    name="phone" 
                    type="tel" 
                    value={contact.phone} 
                    onChange={handleContactChange}
                    placeholder="+91 98765 43210"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                      errors.phone 
                        ? 'border-red-400 focus:border-red-500' 
                        : 'border-gray-200 dark:border-slate-600 focus:border-blue-500'
                    } bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100`}
                  />
                  {errors.phone && <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.phone}
                  </p>}
                </div>
                
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    id="contact-message" 
                    name="message" 
                    value={contact.message} 
                    onChange={handleContactChange}
                    rows={5}
                    placeholder="Tell us about your school and how we can help..."
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none resize-none ${
                      errors.message 
                        ? 'border-red-400 focus:border-red-500' 
                        : 'border-gray-200 dark:border-slate-600 focus:border-blue-500'
                    } bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100`}
                  />
                  {errors.message && <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.message}
                  </p>}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    type="submit" 
                    disabled={sending}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {sending ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setContact({ name: '', email: '', phone: '', message: '' }); setErrors({}); toast.success('Form cleared'); }}
                    className="px-6 py-4 border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300"
                  >
                    Clear Form
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="px-6 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Ready to transform your school?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-blue-100">
              Join hundreds of educational institutions already using EduManage Pro to streamline their operations.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
              <button
                onClick={onRegister}
                className="rounded-md bg-white px-6 py-3 text-base font-semibold text-blue-600 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Start Free Trial
              </button>
              <button
                onClick={onSignIn}
                className="text-base font-semibold leading-6 text-white hover:text-blue-200"
              >
                Schedule Demo <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h3 className="text-sm font-semibold leading-6 text-white">EduManage Pro</h3>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              © 2024 EduManage Pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}