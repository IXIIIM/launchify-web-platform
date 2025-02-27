export type ErrorSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface ErrorLog {
  id: string;
  severity: ErrorSeverity;
  component: string;
  message: string;
  stack?: string;
  metadata?: Record<string, any>;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ErrorAlert {
  id: string;
  type: string;
  severity: ErrorSeverity;
  message: string;
  metadata?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ErrorStats {
  totalErrors: number;
  byComponent: Record<string, number>;
  bySeverity: Record<string, number>;
  dailyTrend: Record<string, number>;
}

export interface ErrorUpdateMessage {
  type: 'ERROR_STATS_UPDATE';
  stats: ErrorStats;
}

export interface ErrorAlertMessage {
  type: 'ERROR_ALERT';
  alert: ErrorAlert;
}

export type ErrorWebSocketMessage = ErrorUpdateMessage | ErrorAlertMessage;