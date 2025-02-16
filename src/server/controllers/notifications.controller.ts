import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user: any;
}

// Validation schema for notification preferences
const NotificationPreferencesSchema = z.object({
  email: z.object({
    securityAlerts: z.boolean(),
    newMatches: z.boolean(),
    messages: z.boolean(),
    systemUpdates: z.boolean(),
    subscriptionUpdates: z.boolean(),
    marketingEmails: z.boolean()
  }),
  push: z.object({
    securityAlerts: z.boolean(),
    newMatches: z.boolean(),
    messages: z.boolean(),
    systemUpdates: z.boolean(),
    subscriptionUpdates: z.boolean(),
    marketingNotifications: z.boolean()
  }),
  frequency: z.enum(['instant', 'daily', 'weekly']),
  quietHours: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
  })
});

export const getNotificationPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: req.user.id }
    });

    if (!preferences) {
      // Return default preferences if none exist
      return res.json({
        email: {
          securityAlerts: true,
          newMatches: true,
          messages: true,
          systemUpdates: false,
          subscriptionUpdates: true,
          marketingEmails: false
        },
        push: {
          securityAlerts: true,
          newMatches: true,
          messages: true,
          systemUpdates: true,
          subscriptionUpdates: false,
          marketingNotifications: false
        },
        frequency: 'instant',
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '07:00'
        }
      });
    }

    res.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ message: 'Error fetching notification preferences' });
  }
};

export const updateNotificationPreferences = async (req: AuthRequest, res: Response) => {
  try {
    // Validate request body
    const validatedPreferences = NotificationPreferencesSchema.parse(req.body);

    // Update or create preferences
    const preferences = await prisma.notificationPreferences.upsert({
      where: { userId: req.user.id },
      update: validatedPreferences,
      create: {
        ...validatedPreferences,
        userId: req.user.id
      }
    });

    // Log the preferences change
    await prisma.userActivityLog.create({
      data: {
        userId: req.user.id,
        activityType: 'UPDATE_NOTIFICATION_PREFERENCES',
        details: {
          previousPreferences: req.body,
          newPreferences: preferences
        }
      }
    });

    res.json(preferences);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid notification preferences',
        errors: error.errors
      });
    }

    console.error('Error updating notification preferences:', error);
    res.status(500).json({ message: 'Error updating notification preferences' });
  }
};

export const testNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { type, channel } = req.body;

    // Validate notification type and channel
    if (!['securityAlerts', 'newMatches', 'messages', 'systemUpdates'].includes(type)) {
      return res.status(400).json({ message: 'Invalid notification type' });
    }

    if (!['email', 'push'].includes(channel)) {
      return res.status(400).json({ message: 'Invalid notification channel' });
    }

    // Get user's notification preferences
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: req.user.id }
    });

    // Check if notification type is enabled for the channel
    if (!preferences || !preferences[channel][type]) {
      return res.status(400).json({
        message: `${type} notifications are disabled for ${channel}`
      });
    }

    // Check quiet hours
    if (preferences.quietHours.enabled && channel === 'push') {
      const now = new Date();
      const currentTime = now.getHours() * 100 + now.getMinutes();
      const startTime = parseInt(preferences.quietHours.start.replace(':', ''));
      const endTime = parseInt(preferences.quietHours.end.replace(':', ''));

      if (currentTime >= startTime || currentTime <= endTime) {
        return res.status(400).json({
          message: 'Cannot send test notification during quiet hours'
        });
      }
    }

    // Send test notification (implement actual notification sending here)
    const testMessage = `This is a test ${type} notification via ${channel}`;
    
    // Log the test notification
    await prisma.userActivityLog.create({
      data: {
        userId: req.user.id,
        activityType: 'TEST_NOTIFICATION',
        details: {
          type,
          channel,
          message: testMessage
        }
      }
    });

    res.json({
      message: 'Test notification sent successfully',
      details: {
        type,
        channel,
        content: testMessage
      }
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ message: 'Error sending test notification' });
  }
};