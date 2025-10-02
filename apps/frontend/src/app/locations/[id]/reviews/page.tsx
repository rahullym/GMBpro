'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { reviewsApi, locationsApi } from '@/lib/api';
import { Review, Location } from '@/types';
import { 
  StarIcon, 
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  FunnelIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export default function LocationReviewsPage() {
  const params = useParams();
  const router = useRouter();
  const locationId = params.id as string;
  
  const [location, setLocation] = useState<Location | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [locationId]);

  const loadData = async () => {
    try {
      const [locationRes, reviewsRes] = await Promise.all([
        locationsApi.getById(locationId),
        reviewsApi.getAll({ locationId }),
      ]);

      setLocation(locationRes.data);
      setReviews(reviewsRes.data.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSelect = (reviewId: string) => {
    setSelectedReviews(prev => 
      prev.includes(reviewId) 
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const handleBulkApprove = async () => {
    try {
      await reviewsApi.bulkUpdateStatus(selectedReviews, 'approved');
      setSelectedReviews([]);
      loadData();
    } catch (error) {
      console.error('Error bulk approving reviews:', error);
    }
  };

  const filteredReviews = reviews.filter(review => 
    statusFilter === 'all' || review.status === statusFilter
  );

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {location?.name} Reviews
                </h1>
                <p className="text-gray-600">{location?.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Actions */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-auto"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="escalated">Escalated</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {selectedReviews.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedReviews.length} selected
              </span>
              <button
                onClick={handleBulkApprove}
                className="btn-primary text-sm"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Approve Selected
              </button>
            </div>
          )}
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <StarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {statusFilter === 'all' 
                  ? 'No reviews have been synced yet for this location.'
                  : `No reviews with status "${statusFilter}" found.`
                }
              </p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div key={review.id} className="card">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedReviews.includes(review.id)}
                        onChange={() => handleReviewSelect(review.id)}
                        className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`h-5 w-5 ${
                                  i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {review.authorName}
                          </span>
                          <span className={`badge ${
                            review.status === 'pending' ? 'badge-warning' :
                            review.status === 'approved' ? 'badge-success' :
                            review.status === 'escalated' ? 'badge-danger' :
                            'badge-info'
                          }`}>
                            {review.status}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{review.text}</p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                          <span>{review.replies?.length || 0} replies</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {review.replies && review.replies.length > 0 ? (
                        <button
                          onClick={() => router.push(`/reviews/${review.id}`)}
                          className="btn-secondary text-sm"
                        >
                          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                          View Replies
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push(`/reviews/${review.id}`)}
                          className="btn-primary text-sm"
                        >
                          Generate Reply
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

