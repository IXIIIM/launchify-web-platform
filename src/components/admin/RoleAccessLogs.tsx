import React, { useState, useEffect, useCallback } from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { UserRole } from '@/services/AdminService';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react';
import { useAdminWebSocket } from '@/hooks/useAdminWebSocket';

// Simple UI components
const Table = ({ children }) => <table className="min-w-full divide-y divide-gray-200">{children}</table>;
const TableHeader = ({ children }) => <thead className="bg-gray-50">{children}</thead>;
const TableBody = ({ children }) => <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>;
const TableRow = ({ children }) => <tr>{children}</tr>;
const TableHead = ({ children }) => <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{children}</th>;
const TableCell = ({ children, className = "" }) => <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${className}`}>{children}</td>;

const Card = ({ children }) => <div className="bg-white shadow rounded-lg overflow-hidden">{children}</div>;
const CardHeader = ({ children }) => <div className="px-4 py-5 sm:px-6 border-b border-gray-200">{children}</div>;
const CardTitle = ({ children }) => <h3 className="text-lg leading-6 font-medium text-gray-900">{children}</h3>;
const CardDescription = ({ children }) => <p className="mt-1 max-w-2xl text-sm text-gray-500">{children}</p>;
const CardContent = ({ children }) => <div className="px-4 py-5 sm:p-6">{children}</div>;

const Select = ({ value, onValueChange, children }) => (
  <select 
    value={value} 
    onChange={(e) => onValueChange(e.target.value)}
    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
  >
    {children}
  </select>
);
const SelectTrigger = ({ children }) => <div>{children}</div>;
const SelectValue = ({ placeholder }) => <span className="text-gray-500">{placeholder}</span>;
const SelectContent = ({ children }) => <div>{children}</div>;
const SelectItem = ({ value, children }) => <option value={value}>{children}</option>;

const Input = ({ type = "text", placeholder, value, onChange }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
  />
);

const Button = ({ onClick, variant = "primary", children }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
      variant === "outline" 
        ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-50" 
        : "text-white bg-blue-600 hover:bg-blue-700"
    }`}
  >
    {children}
  </button>
);

const Badge = ({ variant = "default", children }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    variant === "success" ? "bg-green-100 text-green-800" :
    variant === "destructive" ? "bg-red-100 text-red-800" :
    variant === "outline" ? "bg-gray-100 text-gray-800 border border-gray-300" :
    "bg-blue-100 text-blue-800"
  }`}>
    {children}
  </span>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  return (
    <div className="flex items-center justify-center space-x-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
      >
        Previous
      </button>
      
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded ${
            currentPage === page
              ? "bg-blue-600 text-white"
              : "border border-gray-300"
          }`}
        >
          {page}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
};

const Spinner = ({ size = "md" }) => (
  <div className={`animate-spin rounded-full border-t-2 border-b-2 border-blue-500 ${
    size === "lg" ? "h-8 w-8" : size === "sm" ? "h-4 w-4" : "h-6 w-6"
  }`}></div>
);

const Alert = ({ variant = "default", children }) => (
  <div className={`p-4 rounded-md ${
    variant === "destructive" ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"
  }`}>
    {children}
  </div>
);

const AlertTitle = ({ children }) => <h3 className="text-sm font-medium mb-2">{children}</h3>;
const AlertDescription = ({ children }) => <div className="text-sm">{children}</div>;

// Add a mobile-friendly card for log entries
const LogCard = ({ log, formatDate }) => (
  <div className="bg-white border rounded-lg p-4 mb-3 shadow-sm">
    <div className="flex justify-between items-start mb-2">
      <span className="text-xs text-gray-500">{formatDate(log.createdAt)}</span>
      {log.status === 'SUCCESS' ? (
        <Badge variant="success">Success</Badge>
      ) : (
        <Badge variant="destructive">Failure</Badge>
      )}
    </div>
    
    <div className="mb-2">
      <div className="text-sm font-medium">User:</div>
      <div className="text-sm truncate">{log.user?.email || log.userId}</div>
    </div>
    
    <div className="mb-2">
      <div className="text-sm font-medium">Roles:</div>
      <div className="flex space-x-2 mt-1">
        <Badge variant="outline">{log.details.requiredRole}</Badge>
        <span className="text-xs">→</span>
        <Badge variant="outline">{log.details.userRole}</Badge>
      </div>
    </div>
    
    <div className="mb-2">
      <div className="text-sm font-medium">Path:</div>
      <div className="text-sm break-all">{log.details.path}</div>
    </div>
    
    <div>
      <div className="text-sm font-medium">IP Address:</div>
      <div className="text-sm">{log.ipAddress}</div>
    </div>
  </div>
);

interface RoleAccessLog {
  id: string;
  userId: string;
  eventType: string;
  status: string;
  ipAddress: string;
  message: string;
  severity: string;
  details: {
    requiredRole: string;
    userRole: string;
    path: string;
    timestamp: string;
  };
  createdAt: string;
  user: {
    email: string;
    role: string;
  };
}

interface LogsResponse {
  logs: RoleAccessLog[];
  stats: {
    successCount: number;
    failureCount: number;
    successRate: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const RoleAccessLogs: React.FC = () => {
  const { hasAccess, isLoading: accessLoading } = useRoleAccess(UserRole.SUPER_ADMIN);
  const [logs, setLogs] = useState<RoleAccessLog[]>([]);
  const [stats, setStats] = useState<LogsResponse['stats'] | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  
  // Filter states
  const [role, setRole] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [path, setPath] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Handle real-time updates via WebSocket
  const handleRoleAccessAttempt = useCallback((data: any) => {
    if (!realtimeEnabled) return;
    
    // Create a new log entry from the WebSocket data
    const newLog: RoleAccessLog = {
      id: data.id,
      userId: data.userId,
      eventType: 'ROLE_ACCESS_ATTEMPT',
      status: data.success ? 'SUCCESS' : 'FAILURE',
      ipAddress: data.ipAddress || 'unknown',
      message: data.success 
        ? `User successfully accessed ${data.path} with role ${data.userRole}`
        : `User attempted to access ${data.path} but lacked required role ${data.requiredRole}`,
      severity: data.success ? 'INFO' : 'WARNING',
      details: {
        requiredRole: data.requiredRole,
        userRole: data.userRole,
        path: data.path,
        timestamp: data.timestamp.toISOString()
      },
      createdAt: new Date(data.timestamp).toISOString(),
      user: {
        email: data.userId, // We might not have the email in real-time
        role: data.userRole
      }
    };
    
    // Add the new log to the top of the list
    setLogs(prevLogs => {
      // Only add if it passes the current filters
      if (
        (role && data.requiredRole !== role) ||
        (success && data.success.toString() !== success) ||
        (userId && data.userId !== userId) ||
        (path && !data.path.includes(path))
      ) {
        return prevLogs;
      }
      
      // Add to the beginning and maintain the current page size
      const updatedLogs = [newLog, ...prevLogs];
      if (updatedLogs.length > pagination.limit) {
        updatedLogs.pop();
      }
      
      return updatedLogs;
    });
    
    // Update stats
    setStats(prevStats => {
      if (!prevStats) return null;
      
      const successCount = data.success 
        ? prevStats.successCount + 1 
        : prevStats.successCount;
        
      const failureCount = !data.success 
        ? prevStats.failureCount + 1 
        : prevStats.failureCount;
        
      const total = successCount + failureCount;
      const successRate = total > 0 ? (successCount / total) * 100 : 0;
      
      return {
        successCount,
        failureCount,
        successRate
      };
    });
    
    // Update pagination total
    setPagination(prev => ({
      ...prev,
      total: prev.total + 1,
      pages: Math.ceil((prev.total + 1) / prev.limit)
    }));
  }, [realtimeEnabled, role, success, userId, path, pagination.limit]);
  
  // Initialize WebSocket connection
  const { connected } = useAdminWebSocket({
    onRoleAccessAttempt: handleRoleAccessAttempt
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      
      if (role) params.append('role', role);
      if (success) params.append('success', success);
      if (userId) params.append('userId', userId);
      if (path) params.append('path', path);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/admin/role-access-logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching logs: ${response.statusText}`);
      }
      
      const data: LogsResponse = await response.json();
      setLogs(data.logs);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchLogs();
    }
  }, [hasAccess, pagination.page]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleFilter = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const handleClearFilters = () => {
    setRole('');
    setSuccess('');
    setUserId('');
    setPath('');
    setStartDate('');
    setEndDate('');
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const toggleRealtime = () => {
    setRealtimeEnabled(prev => !prev);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
  };

  if (accessLoading) {
    return <Spinner size="lg" />;
  }

  if (!hasAccess) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You do not have permission to view role-based access logs. This feature requires SUPER_ADMIN privileges.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div className="mb-4 sm:mb-0">
              <CardTitle>Role-Based Access Logs</CardTitle>
              <CardDescription>
                View and analyze role-based access control logs to monitor security and access patterns
              </CardDescription>
            </div>
            <Button 
              onClick={toggleRealtime} 
              variant={realtimeEnabled ? "primary" : "outline"}
              className="self-start sm:self-auto"
            >
              {realtimeEnabled ? (
                <><Wifi className="h-4 w-4 mr-2" /> Real-time On</>
              ) : (
                <><WifiOff className="h-4 w-4 mr-2" /> Real-time Off</>
              )}
            </Button>
          </div>
          {!connected && realtimeEnabled && (
            <div className="mt-2 text-amber-500 text-sm flex items-center">
              <WifiOff className="h-4 w-4 mr-1" /> 
              WebSocket disconnected. Real-time updates paused.
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* Filters - Mobile Accordion */}
          <div className="block md:hidden mb-6">
            <details className="border rounded-md">
              <summary className="px-4 py-3 font-medium cursor-pointer">
                Filters
              </summary>
              <div className="p-4 border-t">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Required Role</label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Roles</SelectItem>
                        <SelectItem value="USER">USER</SelectItem>
                        <SelectItem value="MODERATOR">MODERATOR</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                        <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Access Status</label>
                    <Select value={success} onValueChange={setSuccess}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        <SelectItem value="true">Success</SelectItem>
                        <SelectItem value="false">Failure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Path Contains</label>
                    <Input 
                      placeholder="Filter by path" 
                      value={path} 
                      onChange={(e) => setPath(e.target.value)} 
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">User ID</label>
                    <Input 
                      placeholder="Filter by user ID" 
                      value={userId} 
                      onChange={(e) => setUserId(e.target.value)} 
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Start Date</label>
                    <Input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)} 
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">End Date</label>
                    <Input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)} 
                    />
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Button onClick={handleFilter}>Apply</Button>
                    <Button variant="outline" onClick={handleClearFilters}>Clear</Button>
                  </div>
                </div>
              </div>
            </details>
          </div>
          
          {/* Filters - Desktop Grid */}
          <div className="hidden md:block">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium">Required Role</label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Roles</SelectItem>
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="MODERATOR">MODERATOR</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                    <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Access Status</label>
                <Select value={success} onValueChange={setSuccess}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="true">Success</SelectItem>
                    <SelectItem value="false">Failure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Path Contains</label>
                <Input 
                  placeholder="Filter by path" 
                  value={path} 
                  onChange={(e) => setPath(e.target.value)} 
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">User ID</label>
                <Input 
                  placeholder="Filter by user ID" 
                  value={userId} 
                  onChange={(e) => setUserId(e.target.value)} 
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="flex justify-between mb-6">
              <Button onClick={handleFilter}>Apply Filters</Button>
              <Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>
            </div>
          </div>
          
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Successful Access</p>
                      <h3 className="text-2xl font-bold">{stats.successCount}</h3>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Failed Access</p>
                      <h3 className="text-2xl font-bold">{stats.failureCount}</h3>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                      <h3 className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</h3>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-700 font-bold">%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center my-8">
              <Spinner size="lg" />
            </div>
          )}
          
          {/* Logs table and cards */}
          {!loading && logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No logs found matching the current filters</p>
            </div>
          ) : (
            <>
              {/* Mobile view - Cards */}
              <div className="md:hidden">
                {logs.map((log) => (
                  <LogCard key={log.id} log={log} formatDate={formatDate} />
                ))}
              </div>
              
              {/* Desktop view - Table */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Required Role</TableHead>
                      <TableHead>User Role</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{formatDate(log.createdAt)}</TableCell>
                        <TableCell>{log.user?.email || log.userId}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.details.requiredRole}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.details.userRole}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{log.details.path}</TableCell>
                        <TableCell>
                          {log.status === 'SUCCESS' ? (
                            <Badge variant="success">Success</Badge>
                          ) : (
                            <Badge variant="destructive">Failure</Badge>
                          )}
                        </TableCell>
                        <TableCell>{log.ipAddress}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleAccessLogs; 