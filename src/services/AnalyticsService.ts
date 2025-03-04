import { API_BASE_URL } from '../constants';
import { getAuthToken } from '../utils/auth';

// Analytics data types
export interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

export interface TimeSeriesData {
  label: string;
  data: TimeSeriesDataPoint[];
  color?: string;
}

export interface MetricCard {
  title: string;
  value: number;
  unit?: string;
  change?: number; // Percentage change
  changeDirection?: 'up' | 'down' | 'neutral';
  icon?: string;
}

export interface DistributionItem {
  label: string;
  value: number;
  percentage: number;
  color?: string;
}

export interface TableRow {
  id: string;
  [key: string]: any;
}

export interface AnalyticsPeriod {
  start: string;
  end: string;
  label: string;
}

export type AnalyticsTimeframe = '7d' | '30d' | '90d' | '1y' | 'all';

export interface AnalyticsFilters {
  timeframe: AnalyticsTimeframe;
  customPeriod?: AnalyticsPeriod;
  categories?: string[];
  tags?: string[];
  userTypes?: ('entrepreneur' | 'investor' | 'mentor')[];
}

// Dashboard data interfaces
export interface InvestmentAnalytics {
  totalInvestments: MetricCard;
  averageInvestment: MetricCard;
  investmentTrend: TimeSeriesData[];
  investmentsByCategory: DistributionItem[];
  investmentsByStage: DistributionItem[];
  topInvestments: TableRow[];
}

export interface EscrowAnalytics {
  activeEscrows: MetricCard;
  completedEscrows: MetricCard;
  escrowVolume: MetricCard;
  escrowTrend: TimeSeriesData[];
  escrowsByStatus: DistributionItem[];
  milestoneCompletion: DistributionItem[];
  recentEscrows: TableRow[];
}

export interface UserEngagementAnalytics {
  activeUsers: MetricCard;
  messagesSent: MetricCard;
  documentsCreated: MetricCard;
  userActivity: TimeSeriesData[];
  usersByType: DistributionItem[];
  userRetention: TimeSeriesData[];
  topActiveUsers: TableRow[];
}

export interface DocumentAnalytics {
  totalDocuments: MetricCard;
  documentViews: MetricCard;
  documentsByType: DistributionItem[];
  documentActivity: TimeSeriesData[];
  popularDocuments: TableRow[];
}

export interface DashboardData {
  investments: InvestmentAnalytics;
  escrows: EscrowAnalytics;
  userEngagement: UserEngagementAnalytics;
  documents: DocumentAnalytics;
}

class AnalyticsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/analytics`;
  }

  private async getHeaders() {
    const token = await getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Get dashboard data with specified filters
   */
  async getDashboardData(filters: AnalyticsFilters): Promise<DashboardData> {
    try {
      const headers = await this.getHeaders();
      const queryParams = new URLSearchParams();
      
      queryParams.append('timeframe', filters.timeframe);
      
      if (filters.customPeriod) {
        queryParams.append('startDate', filters.customPeriod.start);
        queryParams.append('endDate', filters.customPeriod.end);
      }
      
      if (filters.categories && filters.categories.length > 0) {
        filters.categories.forEach(category => {
          queryParams.append('categories', category);
        });
      }
      
      if (filters.tags && filters.tags.length > 0) {
        filters.tags.forEach(tag => {
          queryParams.append('tags', tag);
        });
      }
      
      if (filters.userTypes && filters.userTypes.length > 0) {
        filters.userTypes.forEach(userType => {
          queryParams.append('userTypes', userType);
        });
      }
      
      const response = await fetch(`${this.baseUrl}/dashboard?${queryParams.toString()}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get investment analytics
   */
  async getInvestmentAnalytics(filters: AnalyticsFilters): Promise<InvestmentAnalytics> {
    try {
      const headers = await this.getHeaders();
      const queryParams = new URLSearchParams();
      queryParams.append('timeframe', filters.timeframe);
      
      // Add other filters as needed
      
      const response = await fetch(`${this.baseUrl}/investments?${queryParams.toString()}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch investment analytics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching investment analytics:', error);
      throw error;
    }
  }

  /**
   * Get escrow analytics
   */
  async getEscrowAnalytics(filters: AnalyticsFilters): Promise<EscrowAnalytics> {
    try {
      const headers = await this.getHeaders();
      const queryParams = new URLSearchParams();
      queryParams.append('timeframe', filters.timeframe);
      
      // Add other filters as needed
      
      const response = await fetch(`${this.baseUrl}/escrows?${queryParams.toString()}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch escrow analytics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching escrow analytics:', error);
      throw error;
    }
  }

  /**
   * Get user engagement analytics
   */
  async getUserEngagementAnalytics(filters: AnalyticsFilters): Promise<UserEngagementAnalytics> {
    try {
      const headers = await this.getHeaders();
      const queryParams = new URLSearchParams();
      queryParams.append('timeframe', filters.timeframe);
      
      // Add other filters as needed
      
      const response = await fetch(`${this.baseUrl}/user-engagement?${queryParams.toString()}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user engagement analytics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user engagement analytics:', error);
      throw error;
    }
  }

  /**
   * Get document analytics
   */
  async getDocumentAnalytics(filters: AnalyticsFilters): Promise<DocumentAnalytics> {
    try {
      const headers = await this.getHeaders();
      const queryParams = new URLSearchParams();
      queryParams.append('timeframe', filters.timeframe);
      
      // Add other filters as needed
      
      const response = await fetch(`${this.baseUrl}/documents?${queryParams.toString()}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch document analytics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching document analytics:', error);
      throw error;
    }
  }

  /**
   * Track an analytics event
   */
  async trackEvent(eventName: string, properties: Record<string, any> = {}): Promise<void> {
    try {
      const headers = await this.getHeaders();
      
      await fetch(`${this.baseUrl}/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          eventName,
          properties,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error(`Error tracking event ${eventName}:`, error);
      // Don't throw the error to prevent disrupting the user experience
    }
  }

  // Mock data for development
  getMockDashboardData(): DashboardData {
    return {
      investments: this.getMockInvestmentAnalytics(),
      escrows: this.getMockEscrowAnalytics(),
      userEngagement: this.getMockUserEngagementAnalytics(),
      documents: this.getMockDocumentAnalytics()
    };
  }

  getMockInvestmentAnalytics(): InvestmentAnalytics {
    const now = new Date();
    const dates = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return {
      totalInvestments: {
        title: 'Total Investments',
        value: 1250000,
        unit: 'USD',
        change: 12.5,
        changeDirection: 'up'
      },
      averageInvestment: {
        title: 'Average Investment',
        value: 75000,
        unit: 'USD',
        change: 5.2,
        changeDirection: 'up'
      },
      investmentTrend: [
        {
          label: 'Investments',
          data: dates.map(date => ({
            date,
            value: Math.floor(Math.random() * 100000) + 50000
          })),
          color: '#4CAF50'
        }
      ],
      investmentsByCategory: [
        { label: 'Technology', value: 450000, percentage: 36, color: '#2196F3' },
        { label: 'Healthcare', value: 300000, percentage: 24, color: '#4CAF50' },
        { label: 'Finance', value: 200000, percentage: 16, color: '#FFC107' },
        { label: 'Education', value: 150000, percentage: 12, color: '#9C27B0' },
        { label: 'Other', value: 150000, percentage: 12, color: '#607D8B' }
      ],
      investmentsByStage: [
        { label: 'Seed', value: 500000, percentage: 40, color: '#2196F3' },
        { label: 'Series A', value: 400000, percentage: 32, color: '#4CAF50' },
        { label: 'Series B', value: 250000, percentage: 20, color: '#FFC107' },
        { label: 'Growth', value: 100000, percentage: 8, color: '#9C27B0' }
      ],
      topInvestments: [
        { id: '1', company: 'TechStart Inc.', amount: 150000, date: '2023-05-15', investor: 'John Smith', stage: 'Seed' },
        { id: '2', company: 'MedInnovate', amount: 120000, date: '2023-06-02', investor: 'Sarah Johnson', stage: 'Seed' },
        { id: '3', company: 'FinTech Solutions', amount: 200000, date: '2023-04-20', investor: 'Robert Chen', stage: 'Series A' },
        { id: '4', company: 'EduLearn', amount: 80000, date: '2023-07-10', investor: 'Emily Davis', stage: 'Seed' },
        { id: '5', company: 'GreenEnergy', amount: 175000, date: '2023-03-28', investor: 'Michael Brown', stage: 'Series A' }
      ]
    };
  }

  getMockEscrowAnalytics(): EscrowAnalytics {
    const now = new Date();
    const dates = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return {
      activeEscrows: {
        title: 'Active Escrows',
        value: 28,
        change: 16.7,
        changeDirection: 'up'
      },
      completedEscrows: {
        title: 'Completed Escrows',
        value: 42,
        change: 23.5,
        changeDirection: 'up'
      },
      escrowVolume: {
        title: 'Escrow Volume',
        value: 875000,
        unit: 'USD',
        change: 15.3,
        changeDirection: 'up'
      },
      escrowTrend: [
        {
          label: 'Active Escrows',
          data: dates.map(date => ({
            date,
            value: Math.floor(Math.random() * 10) + 20
          })),
          color: '#2196F3'
        },
        {
          label: 'Completed Escrows',
          data: dates.map(date => ({
            date,
            value: Math.floor(Math.random() * 15) + 30
          })),
          color: '#4CAF50'
        }
      ],
      escrowsByStatus: [
        { label: 'Active', value: 28, percentage: 40, color: '#2196F3' },
        { label: 'Completed', value: 42, percentage: 60, color: '#4CAF50' }
      ],
      milestoneCompletion: [
        { label: 'Completed', value: 87, percentage: 87, color: '#4CAF50' },
        { label: 'In Progress', value: 10, percentage: 10, color: '#FFC107' },
        { label: 'Delayed', value: 3, percentage: 3, color: '#F44336' }
      ],
      recentEscrows: [
        { id: '1', project: 'TechStart Inc.', amount: 150000, startDate: '2023-05-15', status: 'Active', milestones: '2/3' },
        { id: '2', company: 'MedInnovate', amount: 120000, startDate: '2023-06-02', status: 'Active', milestones: '1/4' },
        { id: '3', company: 'FinTech Solutions', amount: 200000, startDate: '2023-04-20', status: 'Completed', milestones: '3/3' },
        { id: '4', company: 'EduLearn', amount: 80000, startDate: '2023-07-10', status: 'Active', milestones: '0/3' },
        { id: '5', company: 'GreenEnergy', amount: 175000, startDate: '2023-03-28', status: 'Completed', milestones: '4/4' }
      ]
    };
  }

  getMockUserEngagementAnalytics(): UserEngagementAnalytics {
    const now = new Date();
    const dates = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return {
      activeUsers: {
        title: 'Active Users',
        value: 1250,
        change: 8.3,
        changeDirection: 'up'
      },
      messagesSent: {
        title: 'Messages Sent',
        value: 8750,
        change: 12.1,
        changeDirection: 'up'
      },
      documentsCreated: {
        title: 'Documents Created',
        value: 320,
        change: 5.7,
        changeDirection: 'up'
      },
      userActivity: [
        {
          label: 'Daily Active Users',
          data: dates.map(date => ({
            date,
            value: Math.floor(Math.random() * 300) + 950
          })),
          color: '#2196F3'
        }
      ],
      usersByType: [
        { label: 'Entrepreneurs', value: 750, percentage: 60, color: '#2196F3' },
        { label: 'Investors', value: 375, percentage: 30, color: '#4CAF50' },
        { label: 'Mentors', value: 125, percentage: 10, color: '#FFC107' }
      ],
      userRetention: [
        {
          label: 'User Retention',
          data: [
            { date: 'Week 1', value: 100 },
            { date: 'Week 2', value: 85 },
            { date: 'Week 3', value: 72 },
            { date: 'Week 4', value: 68 },
            { date: 'Week 5', value: 65 },
            { date: 'Week 6', value: 62 },
            { date: 'Week 7', value: 60 },
            { date: 'Week 8', value: 58 }
          ],
          color: '#9C27B0'
        }
      ],
      topActiveUsers: [
        { id: '1', name: 'John Smith', type: 'Investor', logins: 45, messages: 120, documents: 8 },
        { id: '2', name: 'Sarah Johnson', type: 'Entrepreneur', logins: 52, messages: 95, documents: 12 },
        { id: '3', name: 'Robert Chen', type: 'Investor', logins: 38, messages: 85, documents: 5 },
        { id: '4', name: 'Emily Davis', type: 'Entrepreneur', logins: 41, messages: 110, documents: 10 },
        { id: '5', name: 'Michael Brown', type: 'Mentor', logins: 35, messages: 150, documents: 3 }
      ]
    };
  }

  getMockDocumentAnalytics(): DocumentAnalytics {
    const now = new Date();
    const dates = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return {
      totalDocuments: {
        title: 'Total Documents',
        value: 320,
        change: 15.2,
        changeDirection: 'up'
      },
      documentViews: {
        title: 'Document Views',
        value: 4850,
        change: 23.7,
        changeDirection: 'up'
      },
      documentsByType: [
        { label: 'Pitch Decks', value: 120, percentage: 37.5, color: '#2196F3' },
        { label: 'Business Plans', value: 85, percentage: 26.6, color: '#4CAF50' },
        { label: 'Financial Models', value: 65, percentage: 20.3, color: '#FFC107' },
        { label: 'Legal Agreements', value: 50, percentage: 15.6, color: '#9C27B0' }
      ],
      documentActivity: [
        {
          label: 'Document Views',
          data: dates.map(date => ({
            date,
            value: Math.floor(Math.random() * 200) + 100
          })),
          color: '#2196F3'
        },
        {
          label: 'Document Creations',
          data: dates.map(date => ({
            date,
            value: Math.floor(Math.random() * 15) + 5
          })),
          color: '#4CAF50'
        }
      ],
      popularDocuments: [
        { id: '1', title: 'TechStart Pitch Deck', type: 'Pitch Deck', creator: 'Sarah Johnson', views: 245, created: '2023-05-15' },
        { id: '2', title: 'MedInnovate Business Plan', type: 'Business Plan', creator: 'Robert Chen', views: 187, created: '2023-06-02' },
        { id: '3', title: 'FinTech Financial Projections', type: 'Financial Model', creator: 'John Smith', views: 156, created: '2023-04-20' },
        { id: '4', title: 'EduLearn Investment Proposal', type: 'Pitch Deck', creator: 'Emily Davis', views: 142, created: '2023-07-10' },
        { id: '5', title: 'GreenEnergy Term Sheet', type: 'Legal Agreement', creator: 'Michael Brown', views: 128, created: '2023-03-28' }
      ]
    };
  }
}

export default new AnalyticsService(); 