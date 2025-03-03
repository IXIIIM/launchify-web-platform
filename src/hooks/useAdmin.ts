import { useState, useEffect, useCallback } from 'react';
import AdminService, { 
  User, 
  UserFilter, 
  ContentReport, 
  ReportFilter, 
  PlatformStats, 
  SystemSettings,
  UserRole,
  UserStatus
} from '../services/AdminService';
import { useAuth } from './useAuth';

interface UseAdminReturn {
  // Users
  users: User[];
  totalUsers: number;
  userLoading: boolean;
  userError: Error | null;
  selectedUser: User | null;
  getUsers: (filter?: UserFilter) => Promise<void>;
  getUserById: (userId: string) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  
  // Reports
  reports: ContentReport[];
  totalReports: number;
  reportLoading: boolean;
  reportError: Error | null;
  selectedReport: ContentReport | null;
  getReports: (filter?: ReportFilter) => Promise<void>;
  updateReport: (reportId: string, reportData: Partial<ContentReport>) => Promise<void>;
  
  // Statistics
  stats: PlatformStats | null;
  statsLoading: boolean;
  statsError: Error | null;
  getStats: () => Promise<void>;
  
  // Settings
  settings: SystemSettings | null;
  settingsLoading: boolean;
  settingsError: Error | null;
  getSettings: () => Promise<void>;
  updateSettings: (settings: Partial<SystemSettings>) => Promise<void>;
  
  // Filters
  userFilter: UserFilter;
  setUserFilter: (filter: UserFilter) => void;
  reportFilter: ReportFilter;
  setReportFilter: (filter: ReportFilter) => void;
  
  // Pagination
  userPage: number;
  setUserPage: (page: number) => void;
  reportPage: number;
  setReportPage: (page: number) => void;
}

export const useAdmin = (): UseAdminReturn => {
  const { user } = useAuth();
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [userLoading, setUserLoading] = useState<boolean>(false);
  const [userError, setUserError] = useState<Error | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Reports state
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [totalReports, setTotalReports] = useState<number>(0);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [reportError, setReportError] = useState<Error | null>(null);
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  
  // Statistics state
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [statsError, setStatsError] = useState<Error | null>(null);
  
  // Settings state
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(false);
  const [settingsError, setSettingsError] = useState<Error | null>(null);
  
  // Filters state
  const [userFilter, setUserFilter] = useState<UserFilter>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [reportFilter, setReportFilter] = useState<ReportFilter>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  // Pagination state
  const [userPage, setUserPage] = useState<number>(1);
  const [reportPage, setReportPage] = useState<number>(1);
  
  // Get users
  const getUsers = useCallback(async (filter?: UserFilter) => {
    try {
      setUserLoading(true);
      setUserError(null);
      
      const mergedFilter = { ...userFilter, ...filter, page: filter?.page || userPage };
      const { users: fetchedUsers, total } = await AdminService.getUsers(mergedFilter);
      
      setUsers(fetchedUsers);
      setTotalUsers(total);
      setUserLoading(false);
    } catch (error) {
      setUserError(error instanceof Error ? error : new Error('Failed to fetch users'));
      setUserLoading(false);
    }
  }, [userFilter, userPage]);
  
  // Get user by ID
  const getUserById = useCallback(async (userId: string) => {
    try {
      setUserLoading(true);
      setUserError(null);
      
      const fetchedUser = await AdminService.getUserById(userId);
      
      setSelectedUser(fetchedUser);
      setUserLoading(false);
    } catch (error) {
      setUserError(error instanceof Error ? error : new Error(`Failed to fetch user with ID ${userId}`));
      setUserLoading(false);
    }
  }, []);
  
  // Update user
  const updateUser = useCallback(async (userId: string, userData: Partial<User>) => {
    try {
      setUserLoading(true);
      setUserError(null);
      
      const updatedUser = await AdminService.updateUser(userId, userData);
      
      setSelectedUser(updatedUser);
      
      // Update the user in the list if it exists
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, ...userData } : user
        )
      );
      
      setUserLoading(false);
    } catch (error) {
      setUserError(error instanceof Error ? error : new Error(`Failed to update user with ID ${userId}`));
      setUserLoading(false);
    }
  }, []);
  
  // Get reports
  const getReports = useCallback(async (filter?: ReportFilter) => {
    try {
      setReportLoading(true);
      setReportError(null);
      
      const mergedFilter = { ...reportFilter, ...filter, page: filter?.page || reportPage };
      const { reports: fetchedReports, total } = await AdminService.getContentReports(mergedFilter);
      
      setReports(fetchedReports);
      setTotalReports(total);
      setReportLoading(false);
    } catch (error) {
      setReportError(error instanceof Error ? error : new Error('Failed to fetch reports'));
      setReportLoading(false);
    }
  }, [reportFilter, reportPage]);
  
  // Update report
  const updateReport = useCallback(async (reportId: string, reportData: Partial<ContentReport>) => {
    try {
      setReportLoading(true);
      setReportError(null);
      
      const updatedReport = await AdminService.updateContentReport(reportId, reportData);
      
      setSelectedReport(updatedReport);
      
      // Update the report in the list if it exists
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === reportId ? { ...report, ...reportData } : report
        )
      );
      
      setReportLoading(false);
    } catch (error) {
      setReportError(error instanceof Error ? error : new Error(`Failed to update report with ID ${reportId}`));
      setReportLoading(false);
    }
  }, []);
  
  // Get statistics
  const getStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      
      const fetchedStats = await AdminService.getPlatformStats();
      
      setStats(fetchedStats);
      setStatsLoading(false);
    } catch (error) {
      setStatsError(error instanceof Error ? error : new Error('Failed to fetch statistics'));
      setStatsLoading(false);
    }
  }, []);
  
  // Get settings
  const getSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      setSettingsError(null);
      
      const fetchedSettings = await AdminService.getSystemSettings();
      
      setSettings(fetchedSettings);
      setSettingsLoading(false);
    } catch (error) {
      setSettingsError(error instanceof Error ? error : new Error('Failed to fetch settings'));
      setSettingsLoading(false);
    }
  }, []);
  
  // Update settings
  const updateSettings = useCallback(async (settingsData: Partial<SystemSettings>) => {
    try {
      setSettingsLoading(true);
      setSettingsError(null);
      
      const updatedSettings = await AdminService.updateSystemSettings(settingsData);
      
      setSettings(updatedSettings);
      setSettingsLoading(false);
    } catch (error) {
      setSettingsError(error instanceof Error ? error : new Error('Failed to update settings'));
      setSettingsLoading(false);
    }
  }, []);
  
  // Update user page
  useEffect(() => {
    setUserFilter(prevFilter => ({ ...prevFilter, page: userPage }));
  }, [userPage]);
  
  // Update report page
  useEffect(() => {
    setReportFilter(prevFilter => ({ ...prevFilter, page: reportPage }));
  }, [reportPage]);
  
  // Initial data fetch
  useEffect(() => {
    if (user && (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN)) {
      getUsers();
      getReports();
      getStats();
      getSettings();
    }
  }, [user, getUsers, getReports, getStats, getSettings]);
  
  return {
    // Users
    users,
    totalUsers,
    userLoading,
    userError,
    selectedUser,
    getUsers,
    getUserById,
    updateUser,
    
    // Reports
    reports,
    totalReports,
    reportLoading,
    reportError,
    selectedReport,
    getReports,
    updateReport,
    
    // Statistics
    stats,
    statsLoading,
    statsError,
    getStats,
    
    // Settings
    settings,
    settingsLoading,
    settingsError,
    getSettings,
    updateSettings,
    
    // Filters
    userFilter,
    setUserFilter,
    reportFilter,
    setReportFilter,
    
    // Pagination
    userPage,
    setUserPage,
    reportPage,
    setReportPage
  };
}; 