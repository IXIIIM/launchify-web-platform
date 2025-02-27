// src/server/services/review.ts

import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notification';

const prisma = new PrismaClient();
const notificationService = new NotificationService();

interface ReviewCategories {
  communication: number;
  reliability: number;
  expertise: number;
  professionalism: number;
}

export class ReviewService {
  async createReview(reviewerId: string, reviewedId: string, data: {
    rating: number;
    categories: ReviewCategories;
    content?: string;
  }) {
    // Verify completed transaction/interaction
    const hasInteraction = await this.verifyInteraction(reviewerId, reviewedId);
    if (!hasInteraction) {
      throw new Error('No completed interaction found between users');
    }

    // Check for existing review
    const existingReview = await prisma.review.findFirst({
      where: {
        reviewerId,
        reviewedId,
        status: 'PUBLISHED'
      }
    });

    if (existingReview) {
      throw new Error('Review already exists');
    }

    const review = await prisma.review.create({
      data: {
        reviewerId,
        reviewedId,
        rating: data.rating,
        categories: data.categories,
        content: data.content,
        status: 'PUBLISHED'
      }
    });

    // Update user's average rating
    await this.updateUserRating(reviewedId);

    // Notify reviewed user
    await notificationService.sendNotification(reviewedId, {
      type: 'NEW_REVIEW',
      content: `You received a new ${data.rating}-star review`
    });

    return review;
  }

  async flagReview(reviewId: string, reporterId: string, reason: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) throw new Error('Review not found');
    if (review.reviewerId === reporterId) {
      throw new Error('Cannot flag your own review');
    }

    const flag = await prisma.flag.create({
      data: {
        reviewId,
        reporterId,
        reason,
        status: 'PENDING'
      }
    });

    // If multiple flags, mark review for moderation
    const flagCount = await prisma.flag.count({
      where: { reviewId }
    });

    if (flagCount >= 3) {
      await prisma.review.update({
        where: { id: reviewId },
        data: { status: 'FLAGGED' }
      });
    }

    return flag;
  }

  async moderateReview(reviewId: string, action: 'DISMISS' | 'REMOVE', moderatorId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) throw new Error('Review not found');

    if (action === 'REMOVE') {
      await prisma.$transaction([
        prisma.review.update({
          where: { id: reviewId },
          data: { status: 'REMOVED' }
        }),
        prisma.flag.updateMany({
          where: { reviewId },
          data: { status: 'REVIEWED' }
        })
      ]);

      // Recalculate user rating
      await this.updateUserRating(review.reviewedId);
    } else {
      await prisma.$transaction([
        prisma.review.update({
          where: { id: reviewId },
          data: { status: 'PUBLISHED' }
        }),
        prisma.flag.updateMany({
          where: { reviewId },
          data: { status: 'DISMISSED' }
        })
      ]);
    }
  }

  async getReviews(userId: string, options?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 10, status = 'PUBLISHED' } = options || {};

    const reviews = await prisma.review.findMany({
      where: {
        reviewedId: userId,
        status
      },
      include: {
        reviewer: {
          select: {
            id: true,
            userType: true,
            entrepreneurProfile: true,
            funderProfile: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    const total = await prisma.review.count({
      where: {
        reviewedId: userId,
        status
      }
    });

    return {
      reviews,
      total,
      pages: Math.ceil(total / limit)
    };
  }

  private async verifyInteraction(reviewerId: string, reviewedId: string): Promise<boolean> {
    // Check for completed match or transaction
    const completedMatch = await prisma.match.findFirst({
      where: {
        OR: [
          { userId: reviewerId, matchedWithId: reviewedId },
          { userId: reviewedId, matchedWithId: reviewerId }
        ],
        status: 'COMPLETED'
      }
    });

    if (completedMatch) return true;

    // Check for completed escrow
    const completedEscrow = await prisma.escrowAccount.findFirst({
      where: {
        OR: [
          { entrepreneurId: reviewerId, funderId: reviewedId },
          { entrepreneurId: reviewedId, funderId: reviewerId }
        ],
        status: 'COMPLETED'
      }
    });

    return !!completedEscrow;
  }

  private async updateUserRating(userId: string) {
    const reviews = await prisma.review.findMany({
      where: {
        reviewedId: userId,
        status: 'PUBLISHED'
      },
      select: {
        rating: true,
        categories: true
      }
    });

    if (reviews.length === 0) return;

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    const categoryRatings = reviews.reduce((acc, review) => {
      const categories = review.categories as ReviewCategories;
      Object.keys(categories).forEach(key => {
        acc[key] = (acc[key] || 0) + categories[key];
      });
      return acc;
    }, {} as Record<string, number>);

    Object.keys(categoryRatings).forEach(key => {
      categoryRatings[key] /= reviews.length;
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        rating: averageRating,
        categoryRatings
      }
    });
  }
}