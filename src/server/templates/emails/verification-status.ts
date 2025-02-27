<<<<<<< HEAD
// src/server/templates/emails/verification-status.ts
=======
>>>>>>> feature/security-implementation
export const verificationStatusTemplate = `
<!DOCTYPE html>
<html>
<head>
  <title>Verification Status Update</title>
  <style>
    .status-box {
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .status-approved {
      background-color: #ECFDF5;
      border: 1px solid #059669;
      color: #065F46;
    }
    .status-rejected {
      background-color: #FEE2E2;
      border: 1px solid #DC2626;
      color: #991B1B;
    }
    .notes-box {
      background-color: #F3F4F6;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .action-button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2563EB;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <h1>Verification Status Update</h1>
  
  <div class="status-box {{status === 'approved' ? 'status-approved' : 'status-rejected'}}">
    <h2>{{status === 'approved' ? 'Verification Approved! 🎉' : 'Verification Not Approved'}}</h2>
    <p>Your {{type}} verification request has been reviewed.</p>
  </div>

  {{#if notes}}
  <div class="notes-box">
    <h3>Review Notes</h3>
    <p>{{notes}}</p>
  </div>
  {{/if}}

  {{#if status === 'approved'}}
  <p>
    Congratulations! Your account has been updated with the new verification level.
    You now have access to additional features and capabilities.
  </p>
  {{else}}
  <p>
    We encourage you to review the feedback provided and submit a new verification
    request after making the necessary improvements.
  </p>
  {{/if}}

  <p>Review details:</p>
  <ul>
    <li><strong>Verification Type:</strong> {{type}}</li>
    <li><strong>Status:</strong> {{status}}</li>
    <li><strong>Reviewed At:</strong> {{reviewedAt}}</li>
  </ul>

  <a href="{{dashboardUrl}}/profile" class="action-button">
    View Profile
  </a>

  <p style="margin-top: 30px; font-size: 12px; color: #6B7280;">
    This is an automated notification from Launchify's verification system.
    If you have any questions, please contact our support team.
  </p>
</body>
</html>
`;