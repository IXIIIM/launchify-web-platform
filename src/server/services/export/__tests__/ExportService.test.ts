import { ExportService } from '../ExportService';
import { PlatformMetrics } from '../../../types/analytics';
import * as XLSX from 'xlsx';

describe('ExportService', () => {
  let exportService: ExportService;
  let mockMetrics: PlatformMetrics;

  beforeEach(() => {
    exportService = new ExportService();
    mockMetrics = {
      users: {
        total: 1000,
        previousTotal: 900,
        activeUsers: 800,
        growthRate: 11.11,
        retentionRate: 80,
        byType: {
          entrepreneurs: 600,
          funders: 400
        },
        dailySignups: []
      },
      subscriptions: {
        active: 750,
        previousActive: 700,
        byTier: {
          Basic: 200,
          Chrome: 200,
          Bronze: 150,
          Silver: 100,
          Gold: 75,
          Platinum: 25
        },
        churnRate: 5,
        conversionRate: 75
      },
      matches: {
        total: 5000,
        successful: 4000,
        successRate: 80,
        averageCompatibility: 85,
        dailyStats: []
      },
      revenue: {
        daily: 5000,
        monthly: 150000,
        monthlyGrowth: 15,
        averageRevenuePerUser: 150,
        bySubscriptionTier: {},
        projections: {
          nextMonth: 172500,
          nextQuarter: 550000,
          nextYear: 2400000
        }
      },
      timestamp: new Date()
    };
  });

  describe('formatData', () => {
    it('should generate CSV format correctly', async () => {
      const result = await exportService.formatData(mockMetrics, 'csv');
      expect(typeof result).toBe('string');
      expect(result).toContain('category,metric,value');
      expect(result).toContain('Users,Total Users,1000');
    });

    it('should generate XLSX format correctly', async () => {
      const result = await exportService.formatData(mockMetrics, 'xlsx');
      expect(result).toBeInstanceOf(Buffer);
      
      // Parse the generated XLSX to verify content
      const workbook = XLSX.read(result, { type: 'buffer' });
      const worksheet = workbook.Sheets['Analytics'];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('category');
      expect(data[0]).toHaveProperty('metric');
      expect(data[0]).toHaveProperty('value');
    });

    it('should generate JSON format correctly', async () => {
      const result = await exportService.formatData(mockMetrics, 'json');
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(mockMetrics);
    });

    it('should throw error for unsupported format', async () => {
      await expect(exportService.formatData(mockMetrics, 'pdf' as any))
        .rejects
        .toThrow('Unsupported export format');
    });
  });

  describe('getContentType', () => {
    it('should return correct content type for CSV', () => {
      expect(exportService.getContentType('csv')).toBe('text/csv');
    });

    it('should return correct content type for XLSX', () => {
      expect(exportService.getContentType('xlsx'))
        .toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should return correct content type for JSON', () => {
      expect(exportService.getContentType('json')).toBe('application/json');
    });

    it('should throw error for unsupported format', () => {
      expect(() => exportService.getContentType('pdf' as any))
        .toThrow('Unsupported export format');
    });
  });
});