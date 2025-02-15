import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';
import { stringify } from 'csv-stringify/sync';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user: any;
}

interface ErrorLogFilter {
  severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  startDate?: Date;
  endDate?: Date;
  component?: string;
  userId?: string;
}

export const getErrorLogs = async (req: AuthRequest, res: Response) => {
  try {
    const {
      severity,
      startDate,
      endDate,
      component,
      page = 1,
      limit = 50
    } = req.query;

    // Verify admin access
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access to error logs' });
    }

    const filter: ErrorLogFilter = {};

    // Apply filters
    if (severity) {
      filter.severity = severity as 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    }
    if (startDate) {
      filter.startDate = new Date(startDate as string);
    }
    if (endDate) {
      filter.endDate = new Date(endDate as string);
    }
    if (component) {
      filter.component = component as string;
    }

    // Fetch error logs with pagination
    const errorLogs = await prisma.errorLog.findMany({
      where: {
        ...(filter.severity && { severity: filter.severity }),
        ...(filter.startDate && {
          createdAt: { gte: filter.startDate }
        }),
        ...(filter.endDate && {
          createdAt: { lte: filter.endDate }
        }),
        ...(filter.component && { component: filter.component }),
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        user: {
          select: {
            id: true,
            email: true,
            userType: true
          }
        }
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.errorLog.count({
      where: {
        ...(filter.severity && { severity: filter.severity }),
        ...(filter.startDate && {
          createdAt: { gte: filter.startDate }
        }),
        ...(filter.endDate && {
          createdAt: { lte: filter.endDate }
        }),
        ...(filter.component && { component: filter.component }),
      }
    });

    res.json({
      data: errorLogs,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / Number(limit)),
        totalItems: totalCount,
        itemsPerPage: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching error logs:', error);
    res.status(500).json({ message: 'Error retrieving error logs' });
  }
};

export const getErrorLogDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify admin access
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access to error logs' });
    }

    const errorLog = await prisma.errorLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            userType: true
          }
        }
      }
    });

    if (!errorLog) {
      return res.status(404).json({ message: 'Error log not found' });
    }

    res.json(errorLog);
  } catch (error) {
    console.error('Error fetching error log details:', error);
    res.status(500).json({ message: 'Error retrieving error log details' });
  }
};

export const exportErrorLogs = async (req: AuthRequest, res: Response) => {
  try {
    const {
      format = 'csv',
      severity,
      startDate,
      endDate,
      component
    } = req.query;

    // Verify admin access
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access to error logs' });
    }

    const filter: ErrorLogFilter = {};

    // Apply filters
    if (severity) {
      filter.severity = severity as 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    }
    if (startDate) {
      filter.startDate = new Date(startDate as string);
    }
    if (endDate) {
      filter.endDate = new Date(endDate as string);
    }
    if (component) {
      filter.component = component as string;
    }

    const errorLogs = await prisma.errorLog.findMany({
      where: {
        ...(filter.severity && { severity: filter.severity }),
        ...(filter.startDate && {
          createdAt: { gte: filter.startDate }
        }),
        ...(filter.endDate && {
          createdAt: { lte: filter.endDate }
        }),
        ...(filter.component && { component: filter.component }),
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    if (format === 'csv') {
      // Format data for CSV
      const csvData = errorLogs.map(log => ({
        Id: log.id,
        Timestamp: format(log.createdAt, 'yyyy-MM-dd HH:mm:ss'),
        Severity: log.severity,
        Component: log.component,
        Message: log.message,
        Stack: log.stack,
        UserEmail: log.user?.email || 'N/A'
      }));

      const csv = stringify(csvData, {
        header: true,
        columns: ['Id', 'Timestamp', 'Severity', 'Component', 'Message', 'Stack', 'UserEmail']
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=error_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      res.send(csv);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=error_logs_${format(new Date(), 'yyyy-MM-dd')}.json`);
      res.json(errorLogs);
    } else {
      res.status(400).json({ message: 'Unsupported export format' });
    }
  } catch (error) {
    console.error('Error exporting error logs:', error);
    res.status(500).json({ message: 'Error exporting error logs' });
  }
};

export const getErrorStats = async (req: AuthRequest, res: Response) => {
  try {
    // Verify admin access
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access to error stats' });
    }

    const [
      totalErrors,
      severityCounts,
      componentCounts,
      recentTrend
    ] = await Promise.all([
      // Total error count
      prisma.errorLog.count(),
      
      // Errors by severity
      prisma.errorLog.groupBy({
        by: ['severity'],
        _count: true
      }),
      
      // Errors by component
      prisma.errorLog.groupBy({
        by: ['component'],
        _count: true
      }),
      
      // Recent error trend (last 7 days)
      prisma.errorLog.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        _count: true
      })
    ]);

    res.json({
      totalErrors,
      severityDistribution: severityCounts.reduce((acc, curr) => ({
        ...acc,
        [curr.severity]: curr._count
      }), {}),
      componentDistribution: componentCounts.reduce((acc, curr) => ({
        ...acc,
        [curr.component]: curr._count
      }), {}),
      recentTrend: recentTrend.reduce((acc, curr) => ({
        ...acc,
        [format(curr.createdAt, 'yyyy-MM-dd')]: curr._count
      }), {})
    });
  } catch (error) {
    console.error('Error fetching error stats:', error);
    res.status(500).json({ message: 'Error retrieving error statistics' });
  }
};