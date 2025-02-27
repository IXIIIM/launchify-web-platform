<<<<<<< HEAD
// src/server/templates/emails/security-alert.ts
=======
>>>>>>> feature/security-implementation
export const securityAlertTemplate = `
<!DOCTYPE html>
<html>
<head>
  <title>Security Alert</title>
  <style>
    .alert {
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .severity-critical {
      background-color: #FEE2E2;
      border: 1px solid #DC2626;
      color: #991B1B;
    }
    .severity-high {
      background-color: #FEF3C7;
      border: 1px solid #D97706;
      color: #92400E;
    }
    .severity-medium {
      background-color: #FEF3C7;
      border: 1px solid #F59E0B;
      color: #B45309;
    }
    .severity-low {
      background-color: #E0F2FE;
      border: 1px solid #0284C7;
      color: #075985;
    }
    .metadata {
      background-color: #F3F4F6;
      padding: 15px;
      border-radius: 6px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="alert severity-{{severity}}">
    <h1>⚠️ Security Alert: {{title}}</h1>
    <p><strong>Severity:</strong> {{severity}}</p>
    <p><strong>Time:</strong> {{timestamp}}</p>
    <p>{{description}}</p>
  </div>

  <div class="metadata">
    <h3>Alert Details</h3>
    <pre>{{metadata}}</pre>
  </div>

  <div style="margin-top: 30px;">
    <p>Please review this alert in the admin dashboard:</p>
    <a href="{{dashboardUrl}}" style="display: inline-block; padding: 10px 20px; background-color: #2563EB; color: white; text-decoration: none; border-radius: 4px;">
      View in Dashboard
    </a>
  </div>

  <p style="margin-top: 30px; font-size: 12px; color: #6B7280;">
    This is an automated security alert from Launchify. If you believe you received this in error, please contact the security team.
  </p>
</body>
</html>
`;