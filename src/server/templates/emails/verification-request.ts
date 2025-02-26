// src/server/templates/emails/verification-request.ts
export const verificationRequestTemplate = `
<!DOCTYPE html>
<html>
<head>
  <title>New Verification Request</title>
  <style>
    .verification-details {
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
  <h1>New Verification Request</h1>
  
  <p>A new verification request has been submitted and requires your review.</p>

  <div class="verification-details">
    <h3>Request Details</h3>
    <p><strong>Request ID:</strong> {{requestId}}</p>
    <p><strong>Type:</strong> {{type}}</p>
    <p><strong>User ID:</strong> {{userId}}</p>
    <p><strong>Documents Submitted:</strong> {{documentCount}}</p>
    <p><strong>Submitted At:</strong> {{submittedAt}}</p>
  </div>

  <p>Please review this request in the admin dashboard:</p>
  <a href="{{dashboardUrl}}/verification-queue" class="action-button">
    Review Request
  </a>

  <p style="margin-top: 30px; font-size: 12px; color: #6B7280;">
    This is an automated notification from Launchify's verification system.
  </p>
</body>
</html>
`;