      {/* Continue from previous content */}
      
      {/* Report generator */}
      <div className="mt-8">
        <AnalyticsReportGenerator
          onGenerate={handleGenerateReport}
        />
      </div>

      {/* Additional metric breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Match Quality</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Average Match Score</p>
              <p className="text-2xl font-bold">
                {metrics.matches.averageCompatibility.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold">
                {metrics.matches.successRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">User Engagement</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Active Users (30 days)</p>
              <p className="text-2xl font-bold">
                {metrics.users.activeUsers.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Retention Rate</p>
              <p className="text-2xl font-bold">
                {metrics.users.retentionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Metrics</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Average Revenue Per User</p>
              <p className="text-2xl font-bold">
                ${metrics.revenue.averageRevenuePerUser.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">MoM Growth</p>
              <p className="text-2xl font-bold">
                {metrics.revenue.monthlyGrowth > 0 ? '+' : ''}
                {metrics.revenue.monthlyGrowth.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;