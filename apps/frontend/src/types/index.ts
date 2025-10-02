export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  businessId: string;
  role: string;
}

export interface Business {
  id: string;
  name: string;
  planTier: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  googlePlaceId: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
  website?: string;
  isActive: boolean;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    reviews: number;
  };
}

export interface Review {
  id: string;
  locationId: string;
  googleReviewId: string;
  authorName: string;
  authorEmail?: string;
  rating: number;
  text?: string;
  sentiment?: string;
  status: string;
  isPublished: boolean;
  createdAt: string;
  ingestedAt: string;
  updatedAt: string;
  location?: {
    id: string;
    name: string;
    address: string;
  };
  replies?: Reply[];
}

export interface Reply {
  id: string;
  reviewId: string;
  voice: string;
  draftText: string;
  finalText?: string;
  escalate: boolean;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  businessId: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  actor?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export type BrandVoice = 'polite' | 'casual' | 'professional';

export type ReviewStatus = 'pending' | 'approved' | 'escalated' | 'archived';

export type ReviewRating = 1 | 2 | 3 | 4 | 5;

