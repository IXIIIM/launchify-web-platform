import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Flag, Search, XCircle, Filter, User, Calendar, Star } from 'lucide-react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { UserRole } from '@/services/AdminService';

// Types
interface ReviewFlag {
  id: string;
  reporterId: string;
  reason: string;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED';
  createdAt: Date;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
}

interface Review {
  id: string;
  reviewerId: string;
  reviewedId: string;
  rating: number;
  categories: {
    communication: number;
    reliability: number;
    expertise: number;
    professionalism: number;
  };
  content: string;
  status: 'PENDING' | 'PUBLISHED' | 'FLAGGED' | 'REMOVED';
  flags: ReviewFlag[];
  createdAt: Date;
  updatedAt: Date;
  reviewer: {
    id: string;
    name: string;
    email: string;
    userType: string;
  };
  reviewed: {
    id: string;
    name: string;
    email: string;
    userType: string;
  };
}

interface ReviewStats {
  totalReviews: number;
  flaggedReviews: number;
  removedReviews: number;
  averageRating: number;
}

// Mock data
const mockReviews: Review[] = [
  {
    id: '1',
    reviewerId: 'user1',
    reviewedId: 'user2',
    rating: 2,
    categories: {
      communication: 2,
      reliability: 1,
      expertise: 3,
      professionalism: 2
    },
    content: 'This entrepreneur was very difficult to work with. They missed several deadlines and were unresponsive to messages for days at a time.',
    status: 'FLAGGED',
    flags: [
      {
        id: 'flag1',
        reporterId: 'user2',
        reason: 'This review is unfair and does not accurately represent our interaction.',
        status: 'PENDING',
        createdAt: new Date('2023-06-01'),
        reporter: {
          id: 'user2',
          name: 'Sarah Williams',
          email: 'sarah@example.com'
        }
      },
      {
        id: 'flag2',
        reporterId: 'user3',
        reason: 'This review contains false information about the entrepreneur.',
        status: 'PENDING',
        createdAt: new Date('2023-06-02'),
        reporter: {
          id: 'user3',
          name: 'Michael Chen',
          email: 'michael@example.com'
        }
      }
    ],
    createdAt: new Date('2023-05-30'),
    updatedAt: new Date('2023-05-30'),
    reviewer: {
      id: 'user1',
      name: 'John Smith',
      email: 'john@example.com',
      userType: 'FUNDER'
    },
    reviewed: {
      id: 'user2',
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      userType: 'ENTREPRENEUR'
    }
  },
  {
    id: '2',
    reviewerId: 'user4',
    reviewedId: 'user5',
    rating: 1,
    categories: {
      communication: 1,
      reliability: 1,
      expertise: 2,
      professionalism: 1
    },
    content: 'This funder made unreasonable demands and constantly changed requirements. They also used inappropriate language during our meetings.',
    status: 'FLAGGED',
    flags: [
      {
        id: 'flag3',
        reporterId: 'user5',
        reason: 'This review contains false accusations and inappropriate characterizations.',
        status: 'PENDING',
        createdAt: new Date('2023-06-05'),
        reporter: {
          id: 'user5',
          name: 'David Johnson',
          email: 'david@example.com'
        }
      }
    ],
    createdAt: new Date('2023-06-03'),
    updatedAt: new Date('2023-06-03'),
    reviewer: {
      id: 'user4',
      name: 'Emily Rodriguez',
      email: 'emily@example.com',
      userType: 'ENTREPRENEUR'
    },
    reviewed: {
      id: 'user5',
      name: 'David Johnson',
      email: 'david@example.com',
      userType: 'FUNDER'
    }
  },
  {
    id: '3',
    reviewerId: 'user6',
    reviewedId: 'user7',
    rating: 3,
    categories: {
      communication: 3,
      reliability: 2,
      expertise: 4,
      professionalism: 3
    },
    content: 'The entrepreneur has a good concept but lacks follow-through. They need to improve their communication skills.',
    status: 'FLAGGED',
    flags: [
      {
        id: 'flag4',
        reporterId: 'user7',
        reason: 'This review is misleading and does not reflect our actual interaction.',
        status: 'PENDING',
        createdAt: new Date('2023-06-10'),
        reporter: {
          id: 'user7',
          name: 'Jessica Lee',
          email: 'jessica@example.com'
        }
      }
    ],
    createdAt: new Date('2023-06-08'),
    updatedAt: new Date('2023-06-08'),
    reviewer: {
      id: 'user6',
      name: 'Robert Kim',
      email: 'robert@example.com',
      userType: 'FUNDER'
    },
    reviewed: {
      id: 'user7',
      name: 'Jessica Lee',
      email: 'jessica@example.com',
      userType: 'ENTREPRENEUR'
    }
  }
];

const mockStats: ReviewStats = {
  totalReviews: 245,
  flaggedReviews: 12,
  removedReviews: 8,
  averageRating: 4.2
};

const ReviewModeration: React.FC = () => {
  const { hasAccess } = useRoleAccess();
  const canModerate = hasAccess(UserRole.MODERATOR);

  // State
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [stats, setStats] = useState<ReviewStats>(mockStats);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('FLAGGED');
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Effects
  useEffect(() => {
    // In a real implementation, this would fetch data from the API
    // fetchReviews();
    // fetchStats();
  }, []);

  // Handlers
  const handleSearch = () => {
    // In a real implementation, this would search reviews
    setIsLoading(true);
    setTimeout(() => {
      const filtered = mockReviews.filter(review => 
        review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.reviewer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.reviewed.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setReviews(filtered);
      setIsLoading(false);
    }, 500);
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    // In a real implementation, this would filter reviews by status
    setIsLoading(true);
    setTimeout(() => {
      setReviews(mockReviews.filter(review => status === 'ALL' || review.status === status));
      setIsLoading(false);
    }, 500);
  };

  const handleModerateReview = (reviewId: string, action: 'DISMISS' | 'REMOVE') => {
    if (!canModerate) return;

    setIsLoading(true);
    // In a real implementation, this would call the API
    setTimeout(() => {
      if (action === 'DISMISS') {
        setReviews(reviews.map(review => 
          review.id === reviewId 
            ? { ...review, status: 'PUBLISHED', flags: review.flags.map(flag => ({ ...flag, status: 'DISMISSED' })) } 
            : review
        ));
      } else {
        setReviews(reviews.map(review => 
          review.id === reviewId 
            ? { ...review, status: 'REMOVED', flags: review.flags.map(flag => ({ ...flag, status: 'REVIEWED' })) } 
            : review
        ));
      }
      
      // Update stats
      setStats({
        ...stats,
        flaggedReviews: stats.flaggedReviews - 1,
        removedReviews: action === 'REMOVE' ? stats.removedReviews + 1 : stats.removedReviews
      });
      
      setSelectedReview(null);
      setShowReviewModal(false);
      setIsLoading(false);
    }, 800);
  };

  // Render helpers
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  const renderCategoryRatings = (categories: Review['categories']) => {
    return (
      <div className="grid grid-cols-2 gap-2 mt-2">
        {Object.entries(categories).map(([category, rating]) => (
          <div key={category} className="flex items-center justify-between">
            <span className="text-sm capitalize text-gray-600">{category}:</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-3 w-3 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Review Moderation</h1>
          <p className="text-gray-500">
            Manage flagged reviews and moderate content
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Flagged Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.flaggedReviews}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Removed Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.removedReviews}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <div className="flex mt-1">
              {renderStars(Math.round(stats.averageRating))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search reviews by content or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border rounded-md"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Search
          </button>
          
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-4 py-2 pl-10 border rounded-md appearance-none pr-8"
            >
              <option value="ALL">All Reviews</option>
              <option value="FLAGGED">Flagged</option>
              <option value="PUBLISHED">Published</option>
              <option value="REMOVED">Removed</option>
            </select>
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-md">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No reviews found</h3>
            <p className="text-gray-500">
              Try adjusting your filters or search terms
            </p>
          </div>
        ) : (
          reviews.map(review => (
            <Card key={review.id} className={`overflow-hidden ${review.status === 'REMOVED' ? 'bg-gray-50' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-sm font-medium">{review.rating}/5</span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        review.status === 'FLAGGED' ? 'bg-red-100 text-red-800' :
                        review.status === 'REMOVED' ? 'bg-gray-100 text-gray-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {review.status}
                      </span>
                    </div>
                    <CardTitle className="text-lg mt-1">
                      Review by {review.reviewer.name} ({review.reviewer.userType})
                    </CardTitle>
                    <CardDescription>
                      For {review.reviewed.name} ({review.reviewed.userType}) • {formatDate(review.createdAt)}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-red-500">
                      <Flag className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">{review.flags.length}</span>
                    </div>
                    
                    {canModerate && (
                      <button
                        onClick={() => {
                          setSelectedReview(review);
                          setShowReviewModal(true);
                        }}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Review Flags
                      </button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-700">{review.content}</p>
                    {renderCategoryRatings(review.categories)}
                  </div>
                  
                  {review.flags.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Flags ({review.flags.length})</h4>
                      <div className="space-y-2">
                        {review.flags.slice(0, 1).map(flag => (
                          <div key={flag.id} className="bg-red-50 p-3 rounded-md">
                            <div className="flex items-center text-sm text-gray-600 mb-1">
                              <User className="h-3 w-3 mr-1" />
                              <span>{flag.reporter.name}</span>
                              <span className="mx-1">•</span>
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{formatDate(flag.createdAt)}</span>
                            </div>
                            <p className="text-sm text-gray-700">{flag.reason}</p>
                          </div>
                        ))}
                        
                        {review.flags.length > 1 && (
                          <p className="text-sm text-gray-500">
                            + {review.flags.length - 1} more {review.flags.length - 1 === 1 ? 'flag' : 'flags'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">Review Moderation</h2>
                <button 
                  onClick={() => {
                    setSelectedReview(null);
                    setShowReviewModal(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(selectedReview.rating)}
                  <span className="text-sm font-medium">{selectedReview.rating}/5</span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    selectedReview.status === 'FLAGGED' ? 'bg-red-100 text-red-800' :
                    selectedReview.status === 'REMOVED' ? 'bg-gray-100 text-gray-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedReview.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <User className="h-4 w-4" />
                  <span>
                    <strong>Reviewer:</strong> {selectedReview.reviewer.name} ({selectedReview.reviewer.userType})
                  </span>
                  <span className="mx-1">•</span>
                  <span>
                    <strong>Reviewed:</strong> {selectedReview.reviewed.name} ({selectedReview.reviewed.userType})
                  </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <p className="text-gray-700">{selectedReview.content}</p>
                  {renderCategoryRatings(selectedReview.categories)}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Flags ({selectedReview.flags.length})</h3>
                <div className="space-y-3">
                  {selectedReview.flags.map(flag => (
                    <div key={flag.id} className="bg-red-50 p-4 rounded-md">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <User className="h-4 w-4 mr-1" />
                        <span>{flag.reporter.name}</span>
                        <span className="mx-1">•</span>
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{formatDate(flag.createdAt)}</span>
                      </div>
                      <p className="text-gray-700">{flag.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {canModerate && (
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => handleModerateReview(selectedReview.id, 'DISMISS')}
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Dismiss Flags
                  </button>
                  
                  <button
                    onClick={() => handleModerateReview(selectedReview.id, 'REMOVE')}
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Remove Review
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewModeration; 