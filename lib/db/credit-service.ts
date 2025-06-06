import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';

/**
 * Service class to handle user credit operations
 */
export class CreditService {
  /**
   * Add 5 daily credits if the user hasn't received them today
   */
  static async resetDailyCredits(userId: string): Promise<{ credits: number, wasReset: boolean }> {
    // Get the user with their credit information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        credits: true,
        lastCreditReset: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if we need to add daily credits (if lastCreditReset is null or not today)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const needsReset = !user.lastCreditReset ||
      user.lastCreditReset.getTime() < today.getTime();

    if (needsReset) {
      // Add 5 credits and update lastCreditReset
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: 5
          },
          lastCreditReset: now
        },
        select: {
          credits: true
        }
      });

      return { credits: updatedUser.credits, wasReset: true };
    }

    return { credits: user.credits, wasReset: false };
  }

  /**
   * Get current credits for a user, adding daily credits if needed
   */
  static async getUserCredits(userId: string): Promise<number> {
    const { credits } = await this.resetDailyCredits(userId);
    return credits;
  }

  /**
   * Decrement a user's credits, returns the new credit count
   * Throws an error if the user doesn't have enough credits
   */
  static async useCredit(userId: string): Promise<number> {
    // First check if we need to add daily credits
    await this.resetDailyCredits(userId);

    // Get current credit count
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        credits: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.credits <= 0) {
      throw new Error('Not enough credits');
    }

    // Decrement credit
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: 1
        }
      },
      select: {
        credits: true
      }
    });

    return updatedUser.credits;
  }

  /**
   * Add credits to a user, returns the new credit count
   */
  static async addCredits(userId: string, amount: number): Promise<number> {
    // Add credits
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: amount
        }
      },
      select: {
        credits: true
      }
    });

    return updatedUser.credits;
  }

  /**
   * Check if a user has enough credits
   */
  static async hasEnoughCredits(userId: string): Promise<boolean> {
    // First check if we need to add daily credits
    await this.resetDailyCredits(userId);

    // Get current credit count
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true
      }
    });

    return user ? user.credits > 0 : false;
  }

  /**
   * Add credits for shared content with high view counts
   * Returns the number of bonus credits added
   */
  static async processViewMilestone(
    userId: string,
    itemType: 'conversation' | 'artifact',
    itemId: string,
    viewCount: number
  ): Promise<number> {
    // Add 3 credits for every 100 views
    if (viewCount % 100 === 0 && viewCount > 0) {
      await this.addCredits(userId, 3);

      // Log this milestone
      await prisma.analytics.create({
        data: {
          event: `${itemType}_view_milestone`,
          userId,
          [itemType === 'conversation' ? 'conversationId' : 'artifactId']: itemId,
          metadata: {
            viewCount,
            creditsAwarded: 3
          } as Prisma.JsonObject
        }
      });

      return 3;
    }

    return 0;
  }
} 
