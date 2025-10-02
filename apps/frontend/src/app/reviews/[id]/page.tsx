'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { reviewsApi, repliesApi } from '@/lib/api';
import { Review, Reply, BrandVoice } from '@/types';
import { 
  StarIcon, 
  ArrowLeftIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params.id as string;
  
  const [review, setReview] = useState<Review | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<BrandVoice>('polite');
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');

  useEffect(() => {
    loadData();
  }, [reviewId]);

  const loadData = async () => {
    try {
      const [reviewRes, repliesRes] = await Promise.all([
        reviewsApi.getById(reviewId),
        repliesApi.getByReview(reviewId),
      ]);

      setReview(reviewRes.data);
      setReplies(repliesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReply = async () => {
    setGenerating(true);
    try {
      await repliesApi.generate(reviewId, selectedVoice);
      // Refresh replies after generation
      setTimeout(() => {
        loadData();
      }, 2000);
    } catch (error) {
      console.error('Error generating reply:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handlePublishReply = async (replyId: string, finalText: string) => {
    setPublishing(replyId);
    try {
      await repliesApi.publish(replyId, finalText);
      loadData();
    } catch (error) {
      console.error('Error publishing reply:', error);
    } finally {
      setPublishing(null);
    }
  };

  const handleEditReply = (reply: Reply) => {
    setEditingReply(reply.id);
    setEditedText(reply.draftText);
  };

  const handleSaveEdit = async (replyId: string) => {
    try {
      await repliesApi.update(replyId, { draftText: editedText });
      setEditingReply(null);
      loadData();
    } catch (error) {
      console.error('Error updating reply:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading review...</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Review not found</h3>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary mt-4"
          >
            Back to Dashboard
          </button>
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
                onClick={() => router.back()}
                className="mr-4 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Review Details</h1>
                <p className="text-gray-600">{review.location?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Review Card */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-6 w-6 ${
                          i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {review.authorName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`badge ${
                  review.status === 'pending' ? 'badge-warning' :
                  review.status === 'approved' ? 'badge-success' :
                  review.status === 'escalated' ? 'badge-danger' :
                  'badge-info'
                }`}>
                  {review.status}
                </span>
              </div>
              
              <p className="text-gray-700 text-lg leading-relaxed">
                {review.text}
              </p>
            </div>
          </div>

          {/* Generate Reply Section */}
          {replies.length === 0 && (
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Generate AI Reply</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand Voice
                    </label>
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value as BrandVoice)}
                      className="input w-full max-w-xs"
                    >
                      <option value="polite">Polite & Professional</option>
                      <option value="casual">Casual & Friendly</option>
                      <option value="professional">Professional & Formal</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={handleGenerateReply}
                    disabled={generating}
                    className="btn-primary"
                  >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    {generating ? 'Generating...' : 'Generate Reply'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Replies */}
          {replies.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">
                  Generated Replies ({replies.length})
                </h3>
              </div>
              <div className="card-body">
                <div className="space-y-6">
                  {replies.map((reply) => (
                    <div key={reply.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="badge badge-info">{reply.voice}</span>
                          {reply.escalate && (
                            <span className="badge badge-warning">Escalate</span>
                          )}
                          {reply.published && (
                            <span className="badge badge-success">Published</span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {editingReply === reply.id ? (
                        <div className="space-y-4">
                          <textarea
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            rows={4}
                            className="input w-full"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSaveEdit(reply.id)}
                              className="btn-primary"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingReply(null)}
                              className="btn-secondary"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                            {reply.draftText}
                          </p>
                          
                          <div className="flex space-x-2">
                            {!reply.published && (
                              <>
                                <button
                                  onClick={() => handleEditReply(reply)}
                                  className="btn-secondary"
                                >
                                  <PencilIcon className="h-4 w-4 mr-1" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handlePublishReply(reply.id, reply.draftText)}
                                  disabled={publishing === reply.id}
                                  className="btn-primary"
                                >
                                  <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                                  {publishing === reply.id ? 'Publishing...' : 'Publish'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

