'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { businessesApi, locationsApi, reviewsApi } from '@/lib/api';
import { Business, Location, Review } from '@/types';
import { 
  BuildingOfficeIcon, 
  MapPinIcon, 
  StarIcon, 
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [businessRes, locationsRes, statsRes] = await Promise.all([
        businessesApi.getMyBusiness(),
        locationsApi.getAll(),
        businessesApi.getStats(),
      ]);

      setBusiness(businessRes.data);
      setLocations(locationsRes.data);
      setStats(statsRes.data);

      // Load recent reviews
      const reviewsRes = await reviewsApi.getAll({ limit: 5 });
      setRecentReviews(reviewsRes.data.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncLocation = async (locationId: string) => {
    try {
      await locationsApi.sync(locationId);
      // Refresh data
      loadDashboardData();
    } catch (error) {
      console.error('Error syncing location:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {business?.name}
              </h1>
              <p className="text-gray-600">Manage your Google Business Profile reviews</p>
            </div>
            <button
              onClick={() => router.push('/locations/new')}
              className="btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Location
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MapPinIcon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Locations</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.totalLocations || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <StarIcon className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Reviews</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.totalReviews || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Published Replies</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.publishedReplies || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BuildingOfficeIcon className="h-8 w-8 text-orange-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.pendingReviews || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Locations */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Your Locations</h3>
            </div>
            <div className="card-body">
              {locations.length === 0 ? (
                <div className="text-center py-8">
                  <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No locations</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding your first location.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => router.push('/locations/new')}
                      className="btn-primary"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Add Location
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {locations.map((location) => (
                    <div key={location.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{location.name}</h4>
                        <p className="text-sm text-gray-500">{location.address}</p>
                        <p className="text-xs text-gray-400">
                          {location._count?.reviews || 0} reviews
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSyncLocation(location.id)}
                          className="btn-secondary text-xs"
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          Sync
                        </button>
                        <button
                          onClick={() => router.push(`/locations/${location.id}/reviews`)}
                          className="btn-primary text-xs"
                        >
                          View Reviews
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Recent Reviews</h3>
            </div>
            <div className="card-body">
              {recentReviews.length === 0 ? (
                <div className="text-center py-8">
                  <StarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Reviews will appear here once you sync your locations.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentReviews.map((review) => (
                    <div key={review.id} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{review.authorName}</p>
                        <p className="text-sm text-gray-500">{review.text}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(`/reviews/${review.id}`)}
                        className="btn-primary text-xs"
                      >
                        Reply
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

