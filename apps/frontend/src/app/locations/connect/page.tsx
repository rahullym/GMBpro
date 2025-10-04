'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPinIcon, 
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function ConnectLocationPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();

  const handleGoogleConnect = async () => {
    setIsConnecting(true);
    try {
      // Redirect to backend OAuth endpoint
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      window.location.href = `${backendUrl}/auth/google`;
    } catch (error) {
      console.error('Google connection error:', error);
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Connect Location</h1>
              <p className="text-gray-600">Connect your Google Business Profile location</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          <div className="card-body">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <MapPinIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Connect Your Google Business Profile
              </h2>
              <p className="text-gray-600">
                Authorize GMB Optimizer to access your Google Business Profile locations and reviews.
              </p>
            </div>

            {/* Benefits */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">What you'll get:</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Automatic Review Sync</p>
                    <p className="text-sm text-gray-500">Reviews are automatically imported from Google Business Profile</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">AI-Powered Replies</p>
                    <p className="text-sm text-gray-500">Generate and publish responses to customer reviews</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Multi-Location Support</p>
                    <p className="text-sm text-gray-500">Manage multiple business locations from one dashboard</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Real-time Updates</p>
                    <p className="text-sm text-gray-500">Stay on top of new reviews and customer feedback</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Requirements</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• You must be the owner or manager of a Google Business Profile</li>
                    <li>• Your business must be verified on Google</li>
                    <li>• You need a Google account with access to the business</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mb-8 p-4 bg-green-50 rounded-lg">
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-green-900 mb-2">Your Data is Secure</h4>
                  <p className="text-sm text-green-800">
                    We use industry-standard encryption to protect your data. Your Google credentials are encrypted and stored securely. 
                    You can revoke access at any time from your Google account settings.
                  </p>
                </div>
              </div>
            </div>

            {/* Connect Button */}
            <div className="text-center">
              <button
                onClick={handleGoogleConnect}
                disabled={isConnecting}
                className="btn-primary text-lg px-8 py-3"
              >
                {isConnecting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Connecting...
                  </div>
                ) : (
                  <div className="flex items-center">
                    {/* Google Logo */}
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Connect with Google
                  </div>
                )}
              </button>
              
              <p className="mt-4 text-sm text-gray-500">
                By connecting, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 card">
          <div className="card-body">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong>Don't see your business?</strong> Make sure you're signed in with the Google account that manages your business profile.
              </p>
              <p>
                <strong>Permission denied?</strong> Ensure you have owner or manager access to the Google Business Profile.
              </p>
              <p>
                <strong>Still having issues?</strong> Check our setup guide or contact support for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

