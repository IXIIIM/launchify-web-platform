import { PrismaClient } from '@prisma/client';
import { SubscriptionTier } from '../hooks/useSubscription';

// Mock database client
const prisma = new PrismaClient();

// User role types
export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// User status types
export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  PENDING = 'pending'
}

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  userType: 'entrepreneur' | 'funder';
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  lastLogin: Date | null;
  subscriptionTier: SubscriptionTier;
  verificationLevel: number;
  profileCompleted: boolean;
}

// Platform statistics interface
export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalMatches: number;
  newMatchesToday: number;
  totalVerifications: number;
  pendingVerifications: number;
  totalSubscriptions: {
    [key in SubscriptionTier]: number;
  };
  revenue: {
    daily: number;
    weekly: number;
    monthly: number;
    annual: number;
  };
}

// Content report interface
export interface ContentReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetId: string;
  targetType: 'user' | 'message' | 'profile' | 'document';
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
  moderatorId?: string;
  moderatorNotes?: string;
  actionTaken?: string;
}

// System settings interface
export interface SystemSettings {
  maintenanceMode: boolean;
  registrationOpen: boolean;
  matchingEnabled: boolean;
  verificationEnabled: boolean;
  subscriptionEnabled: boolean;
  chatEnabled: boolean;
  maintenanceMessage: string;
  platformFees: {
    transactionFeePercentage: number;
    subscriptionFeePercentage: number;
    minimumTransactionFee: number;
  };
  emailSettings: {
    welcomeEmailEnabled: boolean;
    matchNotificationsEnabled: boolean;
    verificationNotificationsEnabled: boolean;
    subscriptionNotificationsEnabled: boolean;
    marketingEmailsEnabled: boolean;
  };
}

// User filter interface
export interface UserFilter {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  userType?: 'entrepreneur' | 'funder';
  subscriptionTier?: SubscriptionTier;
  verificationLevel?: number;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastLogin' | 'subscriptionTier' | 'verificationLevel';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Report filter interface
export interface ReportFilter {
  status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  targetType?: 'user' | 'message' | 'profile' | 'document';
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Admin service class
class AdminService {
  // Get all users with filtering and pagination
  async getUsers(filter: UserFilter = {}): Promise<{ users: User[]; total: number }> {
    try {
      // In a real application, this would query the database
      // For now, we'll return mock data
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'john@example.com',
          name: 'John Doe',
          userType: 'entrepreneur',
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          subscriptionTier: SubscriptionTier.BASIC,
          verificationLevel: 1,
          profileCompleted: true
        },
        {
          id: '2',
          email: 'jane@example.com',
          name: 'Jane Smith',
          userType: 'funder',
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          subscriptionTier: SubscriptionTier.GOLD,
          verificationLevel: 3,
          profileCompleted: true
        },
        {
          id: '3',
          email: 'admin@example.com',
          name: 'Admin User',
          userType: 'funder',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          lastLogin: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000),
          subscriptionTier: SubscriptionTier.PLATINUM,
          verificationLevel: 3,
          profileCompleted: true
        },
        {
          id: '4',
          email: 'suspended@example.com',
          name: 'Suspended User',
          userType: 'entrepreneur',
          role: UserRole.USER,
          status: UserStatus.SUSPENDED,
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          lastLogin: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          subscriptionTier: SubscriptionTier.BRONZE,
          verificationLevel: 2,
          profileCompleted: true
        },
        {
          id: '5',
          email: 'new@example.com',
          name: 'New User',
          userType: 'entrepreneur',
          role: UserRole.USER,
          status: UserStatus.PENDING,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          lastLogin: null,
          subscriptionTier: SubscriptionTier.BASIC,
          verificationLevel: 0,
          profileCompleted: false
        }
      ];

      // Apply filters
      let filteredUsers = [...mockUsers];

      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredUsers = filteredUsers.filter(
          user => 
            user.name.toLowerCase().includes(searchLower) || 
            user.email.toLowerCase().includes(searchLower)
        );
      }

      if (filter.role) {
        filteredUsers = filteredUsers.filter(user => user.role === filter.role);
      }

      if (filter.status) {
        filteredUsers = filteredUsers.filter(user => user.status === filter.status);
      }

      if (filter.userType) {
        filteredUsers = filteredUsers.filter(user => user.userType === filter.userType);
      }

      if (filter.subscriptionTier) {
        filteredUsers = filteredUsers.filter(user => user.subscriptionTier === filter.subscriptionTier);
      }

      if (filter.verificationLevel !== undefined) {
        filteredUsers = filteredUsers.filter(user => user.verificationLevel === filter.verificationLevel);
      }

      if (filter.startDate) {
        filteredUsers = filteredUsers.filter(user => user.createdAt >= filter.startDate!);
      }

      if (filter.endDate) {
        filteredUsers = filteredUsers.filter(user => user.createdAt <= filter.endDate!);
      }

      // Apply sorting
      if (filter.sortBy) {
        filteredUsers.sort((a, b) => {
          const aValue = a[filter.sortBy as keyof User];
          const bValue = b[filter.sortBy as keyof User];
          
          if (aValue === null) return 1;
          if (bValue === null) return -1;
          
          if (aValue < bValue) return filter.sortOrder === 'asc' ? -1 : 1;
          if (aValue > bValue) return filter.sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      } else {
        // Default sort by createdAt desc
        filteredUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      // Apply pagination
      const page = filter.page || 1;
      const limit = filter.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

      return {
        users: paginatedUsers,
        total: filteredUsers.length
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get a single user by ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      // In a real application, this would query the database
      // For now, we'll return mock data
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'john@example.com',
          name: 'John Doe',
          userType: 'entrepreneur',
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          subscriptionTier: SubscriptionTier.BASIC,
          verificationLevel: 1,
          profileCompleted: true
        }
      ];

      const user = mockUsers.find(user => user.id === userId);
      return user || null;
    } catch (error) {
      console.error(`Error fetching user with ID ${userId}:`, error);
      throw error;
    }
  }

  // Update a user
  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    try {
      // In a real application, this would update the database
      // For now, we'll return mock data
      const mockUser: User = {
        id: userId,
        email: 'john@example.com',
        name: 'John Doe',
        userType: 'entrepreneur',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        subscriptionTier: SubscriptionTier.BASIC,
        verificationLevel: 1,
        profileCompleted: true,
        ...userData
      };

      return mockUser;
    } catch (error) {
      console.error(`Error updating user with ID ${userId}:`, error);
      throw error;
    }
  }

  // Get platform statistics
  async getPlatformStats(): Promise<PlatformStats> {
    try {
      // In a real application, this would query the database
      // For now, we'll return mock data
      const mockStats: PlatformStats = {
        totalUsers: 1250,
        activeUsers: 875,
        newUsersToday: 15,
        totalMatches: 3450,
        newMatchesToday: 42,
        totalVerifications: 950,
        pendingVerifications: 28,
        totalSubscriptions: {
          [SubscriptionTier.BASIC]: 500,
          [SubscriptionTier.CHROME]: 300,
          [SubscriptionTier.BRONZE]: 200,
          [SubscriptionTier.SILVER]: 150,
          [SubscriptionTier.GOLD]: 75,
          [SubscriptionTier.PLATINUM]: 25
        },
        revenue: {
          daily: 1250,
          weekly: 8750,
          monthly: 35000,
          annual: 420000
        }
      };

      return mockStats;
    } catch (error) {
      console.error('Error fetching platform statistics:', error);
      throw error;
    }
  }

  // Get content reports with filtering and pagination
  async getContentReports(filter: ReportFilter = {}): Promise<{ reports: ContentReport[]; total: number }> {
    try {
      // In a real application, this would query the database
      // For now, we'll return mock data
      const mockReports: ContentReport[] = [
        {
          id: '1',
          reporterId: '2',
          reporterName: 'Jane Smith',
          targetId: '1',
          targetType: 'user',
          reason: 'Inappropriate behavior',
          description: 'This user has been sending spam messages.',
          status: 'pending',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          reporterId: '1',
          reporterName: 'John Doe',
          targetId: 'msg_123',
          targetType: 'message',
          reason: 'Offensive content',
          description: 'This message contains offensive language.',
          status: 'reviewed',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          moderatorId: '3',
          moderatorNotes: 'Reviewing the message content.'
        },
        {
          id: '3',
          reporterId: '4',
          reporterName: 'Suspended User',
          targetId: '2',
          targetType: 'profile',
          reason: 'Misrepresentation',
          description: 'This profile contains false information.',
          status: 'resolved',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          moderatorId: '3',
          moderatorNotes: 'Verified that the profile information is accurate.',
          actionTaken: 'No action needed.'
        },
        {
          id: '4',
          reporterId: '2',
          reporterName: 'Jane Smith',
          targetId: 'doc_456',
          targetType: 'document',
          reason: 'Fraudulent document',
          description: 'This document appears to be forged.',
          status: 'dismissed',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          moderatorId: '3',
          moderatorNotes: 'Document has been verified as authentic.',
          actionTaken: 'Report dismissed.'
        }
      ];

      // Apply filters
      let filteredReports = [...mockReports];

      if (filter.status) {
        filteredReports = filteredReports.filter(report => report.status === filter.status);
      }

      if (filter.targetType) {
        filteredReports = filteredReports.filter(report => report.targetType === filter.targetType);
      }

      if (filter.startDate) {
        filteredReports = filteredReports.filter(report => report.createdAt >= filter.startDate!);
      }

      if (filter.endDate) {
        filteredReports = filteredReports.filter(report => report.createdAt <= filter.endDate!);
      }

      // Apply sorting
      if (filter.sortBy) {
        filteredReports.sort((a, b) => {
          const aValue = a[filter.sortBy as keyof ContentReport];
          const bValue = b[filter.sortBy as keyof ContentReport];
          
          if (aValue === undefined) return 1;
          if (bValue === undefined) return -1;
          
          if (aValue < bValue) return filter.sortOrder === 'asc' ? -1 : 1;
          if (aValue > bValue) return filter.sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      } else {
        // Default sort by createdAt desc
        filteredReports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      // Apply pagination
      const page = filter.page || 1;
      const limit = filter.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedReports = filteredReports.slice(startIndex, endIndex);

      return {
        reports: paginatedReports,
        total: filteredReports.length
      };
    } catch (error) {
      console.error('Error fetching content reports:', error);
      throw error;
    }
  }

  // Update a content report
  async updateContentReport(reportId: string, reportData: Partial<ContentReport>): Promise<ContentReport> {
    try {
      // In a real application, this would update the database
      // For now, we'll return mock data
      const mockReport: ContentReport = {
        id: reportId,
        reporterId: '2',
        reporterName: 'Jane Smith',
        targetId: '1',
        targetType: 'user',
        reason: 'Inappropriate behavior',
        description: 'This user has been sending spam messages.',
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        ...reportData
      };

      return mockReport;
    } catch (error) {
      console.error(`Error updating content report with ID ${reportId}:`, error);
      throw error;
    }
  }

  // Get system settings
  async getSystemSettings(): Promise<SystemSettings> {
    try {
      // In a real application, this would query the database
      // For now, we'll return mock data
      const mockSettings: SystemSettings = {
        maintenanceMode: false,
        registrationOpen: true,
        matchingEnabled: true,
        verificationEnabled: true,
        subscriptionEnabled: true,
        chatEnabled: true,
        maintenanceMessage: 'The system is currently undergoing maintenance. Please check back later.',
        platformFees: {
          transactionFeePercentage: 2.5,
          subscriptionFeePercentage: 0,
          minimumTransactionFee: 1.00
        },
        emailSettings: {
          welcomeEmailEnabled: true,
          matchNotificationsEnabled: true,
          verificationNotificationsEnabled: true,
          subscriptionNotificationsEnabled: true,
          marketingEmailsEnabled: true
        }
      };

      return mockSettings;
    } catch (error) {
      console.error('Error fetching system settings:', error);
      throw error;
    }
  }

  // Update system settings
  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    try {
      // In a real application, this would update the database
      // For now, we'll return mock data
      const mockSettings: SystemSettings = {
        maintenanceMode: false,
        registrationOpen: true,
        matchingEnabled: true,
        verificationEnabled: true,
        subscriptionEnabled: true,
        chatEnabled: true,
        maintenanceMessage: 'The system is currently undergoing maintenance. Please check back later.',
        platformFees: {
          transactionFeePercentage: 2.5,
          subscriptionFeePercentage: 0,
          minimumTransactionFee: 1.00
        },
        emailSettings: {
          welcomeEmailEnabled: true,
          matchNotificationsEnabled: true,
          verificationNotificationsEnabled: true,
          subscriptionNotificationsEnabled: true,
          marketingEmailsEnabled: true
        },
        ...settings
      };

      return mockSettings;
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }
}

export default new AdminService(); 