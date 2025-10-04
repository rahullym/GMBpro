'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { locationsApi, reviewsApi } from '@/lib/api';
import { Location, Review } from '@/types';
import { 
  StarIcon, 
  ArrowLeftIcon,
  ArrowPathIcon,
  FunnelIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default function LocationReviewsPage() {
  const [location, setLocation] = useState<Location | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState('all');
  const router = useRouter();
  const params = useParams();
  const locationId = params?.id as string;

  useEffect(() => {
    if (locationId) {
      loadLocationAndReviews();
    }
  }, [locationId]);

  const loadLocationAndReviews = async () => {
    try {
      const [locationRes, reviewsRes] = await Promise.all([
        locationsApi.getById(locationId),
        reviewsApi.getAll({ locationId, limit: 50 })
      ]);
      
      setLocation(locationRes.data);
      setReviews(reviewsRes.data.data);
    } catch (error) {
      console.error('Error loading location and reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncReviews = async () => {
    setSyncing(true);
    try {
      await locationsApi.sync(locationId);
      await loadLocationAndReviews();
    } catch (error) {
      console.error('Error syncing reviews:', error);
    } finally {
      setSyncing(false);
    }
  };

  const getFilteredReviews = () => {
    switch (filter) {
      case 'pending':
        return reviews.filter(review => review.status === 'pending');
      case 'approved':
        return reviews.filter(review => review.status === 'approved');
      case 'escalated':
        return reviews.filter(review => review.status === 'escalated');
      case '5-star':
        return reviews.filter(review => review.rating === 5);
      case '1-2-star':
        return reviews.filter(review => review.rating <= 2);
      default:
        return reviews;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'escalated':
        return 'bg-red-100 text-red-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Location not found</h2>
          <p className="text-gray-600 mt-2">The requested location could not be found.</p>
          <button
            onClick={() => router.push('/locations')}
            className="btn-primary mt-4"
          >
            Back to Locations
          </button>
        </div>
      </div>
    );
  }

  const filteredReviews = getFilteredReviews();

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
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{location.name}</h1>
              <p className="text-gray-600">{location.address}</p>
            </div>
            <button
              onClick={handleSyncReviews}
              disabled={syncing}
              className="btn-secondary"
            >
              {syncing ? (
                <div className="flex items-center">
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </div>
              ) : (
                <div className="flex items-center">
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Sync Reviews
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <StarIcon className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Reviews</p>
                  <p className="text-2xl font-semibold text-gray-900">{reviews.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-semibold">!</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {reviews.filter(r => r.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">✓</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Approved</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {reviews.filter(r => r.status === 'approved').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Replied</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {reviews.filter(r => r.replies && r.replies.length > 0).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="flex items-center space-x-4">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Reviews</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="escalated">Escalated</option>
                <option value="5-star">5 Star</option>
                <option value="1-2-star">1-2 Star</option>
              </select>
              <span className="text-sm text-gray-500">
                {filteredReviews.length} of {reviews.length} reviews
              </span>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-12">
              <StarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' 
                  ? 'No reviews have been synced yet. Click "Sync Reviews" to import reviews from Google Business Profile.'
                  : `No reviews match the "${filter}" filter.`
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div key={review.id} className="card">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
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
                        <span className="text-sm font-medium text-gray-900">
                          {review.authorName}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                          {review.status}
                        </span>
                        {review.sentiment && (
                          <span className={`text-xs font-medium ${getSentimentColor(review.sentiment)}`}>
                            {review.sentiment}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-700 mb-3">{review.text}</p>
                      
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                        {review.replies && review.replies.length > 0 && (
                          <span className="text-green-600">
                            {review.replies.length} reply{review.replies.length > 1 ? 'ies' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => router.push(`/reviews/${review.id}`)}
                        className="btn-primary text-sm"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}