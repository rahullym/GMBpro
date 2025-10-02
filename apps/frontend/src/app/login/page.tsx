'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import Cookies from 'js-cookie';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    businessName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      
      if (isLogin) {
        response = await authApi.login(formData.email, formData.password);
      } else {
        response = await authApi.register(formData);
      }

      const { accessToken, refreshToken, user } = response.data;
      
      // Store tokens in cookies
      Cookies.set('accessToken', accessToken, { expires: 7 });
      Cookies.set('refreshToken', refreshToken, { expires: 30 });
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Authentication Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-12 h-6 bg-black rounded-full shadow-sm mb-8"></div>
            <h1 className="text-3xl font-bold text-black mb-2">
              Welcome back
            </h1>
            <p className="text-base text-black">
              Please enter your details.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email Input */}
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 px-4 rounded-lg font-semibold text-base hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Continue'}
            </button>

            {/* Separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* Google Auth Button */}
            <div>
              <GoogleAuthButton className="w-full" />
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-black underline hover:text-gray-700 transition-colors duration-200"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Visual/Decorative */}
      <div className="hidden lg:flex lg:flex-1 relative">
        {/* Background with gradient and geometric overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 geometric-overlay">
          {/* Animated geometric shapes */}
          <div className="absolute inset-0 geometric-shapes"></div>
          
          {/* Static geometric elements */}
          <div className="absolute inset-0 opacity-30">
            {/* Large circles */}
            <div className="absolute top-16 left-16 w-24 h-24 border-2 border-white/40 rounded-full"></div>
            <div className="absolute top-40 right-20 w-20 h-20 border-2 border-white/30 rounded-full"></div>
            <div className="absolute bottom-40 left-24 w-32 h-32 border-2 border-white/20 rounded-full"></div>
            
            {/* Squares and rectangles */}
            <div className="absolute top-32 right-16 w-16 h-16 bg-white/20 rounded-lg transform rotate-45"></div>
            <div className="absolute bottom-32 left-20 w-24 h-24 border-2 border-white/30 rounded-lg"></div>
            <div className="absolute bottom-20 right-12 w-12 h-12 bg-white/25 rounded-lg transform rotate-12"></div>
            
            {/* Abstract lines and curves */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 600">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="white" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="white" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              
              {/* Curved lines */}
              <path
                d="M50,120 Q150,80 250,120 T450,120"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M80,220 Q180,180 280,220 T480,220"
                stroke="url(#lineGradient)"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M30,380 Q130,340 230,380 T430,380"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                fill="none"
              />
              
              {/* Concentric circles */}
              <circle cx="350" cy="300" r="30" stroke="white" strokeWidth="1" fill="none" opacity="0.2" />
              <circle cx="350" cy="300" r="50" stroke="white" strokeWidth="1" fill="none" opacity="0.15" />
              <circle cx="350" cy="300" r="70" stroke="white" strokeWidth="1" fill="none" opacity="0.1" />
              
              {/* Leaf-like shapes */}
              <path
                d="M100,450 Q120,430 140,450 Q120,470 100,450"
                stroke="white"
                strokeWidth="1"
                fill="none"
                opacity="0.2"
              />
              <path
                d="M300,150 Q320,130 340,150 Q320,170 300,150"
                stroke="white"
                strokeWidth="1"
                fill="none"
                opacity="0.2"
              />
            </svg>
          </div>
          
          {/* Content overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-slate-700">
              <div className="mb-8">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-4xl font-bold mb-4 text-slate-800">
                  GMB Optimizer
                </h2>
                <p className="text-xl text-slate-600 max-w-sm mx-auto leading-relaxed">
                  AI-powered Google Business Profile management made simple
                </p>
              </div>
              
              {/* Feature highlights */}
              <div className="space-y-3 text-left max-w-xs mx-auto">
                <div className="flex items-center text-slate-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm">Automated review responses</span>
                </div>
                <div className="flex items-center text-slate-600">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                  <span className="text-sm">Real-time sentiment analysis</span>
                </div>
                <div className="flex items-center text-slate-600">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-sm">Multi-location management</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

