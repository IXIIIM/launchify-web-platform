<<<<<<< HEAD
// src/server/templates/emails/verification-request-admin.ts
=======
>>>>>>> feature/security-implementation
export const verificationRequestAdminTemplate = `
<!DOCTYPE html>
<html>
<head>
  <title>New Verification Request</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #1976D2;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 4px;
    }
    .content {
      padding: 20px;
      background: #fff;
      border-radius: 4px;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #1976D2;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin-top: 20px;
    }
    .request-details {
      background-color: #E3F2FD;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .document-list {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      margin: 15px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #666;
    }
    .priority {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .priority-high {
      background-color: #ffebee;
      color: #c62828;
    }
    .priority-normal {
      background-color: #e3f2fd;
      color: #1565c0;
    }
    .actions {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-top: 20px;
    }
    .user-history {
      background-color: #fff3e0;
      padding: 15px;
      border-radius: 4px;
      margin: 15px 0;
    }
    .status-indicator {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 5px;
    }
    .status-active { background-color: #4CAF50; }
    .status-warning { background-color: #FFC107; }
    .status-blocked { background-color: #F44336; }
  </style>
</head>
<body>
  <div class="header">
    <h1>New Verification Request</h1>
  </div>

  <div class="content">
    <p>A new verification request has been submitted and requires review.</p>

    <div class="request-details">
      <h3>Request Details:</h3>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Request ID:</strong> {{requestId}}</li>
        <li><strong>Type:</strong> {{type}} Verification</li>
        <li><strong>Submitted:</strong> {{submittedAt}}</li>
        <li><strong>User:</strong> {{userEmail}}</li>
        <li><strong>User Type:</strong> {{userType}}</li>
        {{#if subscription}}
        <li><strong>Subscription:</strong> {{subscription}} Tier</li>
        {{/if}}
      </ul>

      {{#if isPriority}}
      <div class="priority priority-high">High Priority</div>
      {{else}}
      <div class="priority priority-normal">Normal Priority</div>
      {{/if}}
    </div>

    <div class="document-list">
      <h3>Submitted Documents:</h3>
      <ul>
        {{#each documents}}
        <li>
          <a href="{{this.url}}" target="_blank">{{this.name}}</a>
          ({{this.type}}, {{this.size}})
        </li>
        {{/each}}
      </ul>
    </div>

    {{#if metadata}}
    <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 15px 0;">
      <h3>Additional Information:</h3>
      <pre style="margin: 0; white-space: pre-wrap;">{{metadata}}</pre>
    </div>
    {{/if}}

    {{#if userHistory}}
    <div class="user-history">
      <h3>User History:</h3>
      <ul style="list-style: none; padding: 0;">
        <li>
          <span class="status-indicator status-{{accountStatus}}"></span>
          <strong>Account Status:</strong> {{accountStatus}}
        </li>
        <li><strong>Member Since:</strong> {{memberSince}}</li>
        <li><strong>Previous Verifications:</strong> {{previousVerifications}}</li>
        {{#if lastVerificationAttempt}}
        <li><strong>Last Verification Attempt:</strong> {{lastVerificationAttempt}}</li>
        {{/if}}
        <li><strong>Reported Issues:</strong> {{reportedIssues}}</li>
      </ul>
    </div>
    {{/if}}

    <div class="actions">
      <a href="{{reviewUrl}}" class="button" style="background-color: #2196F3;">
        Review Request
      </a>
      <a href="{{userProfileUrl}}" class="button" style="background-color: #607D8B;">
        View User Profile
      </a>
    </div>

    <p style="margin-top: 20px; color: #666;">
      <strong>Note:</strong> Please review this request within 24 hours to maintain our service level agreements.
      {{#if isPriority}}
      This is a high-priority request and should be reviewed as soon as possible.
      {{/if}}
    </p>

    <div class="footer">
      <p>
        You received this email because you are part of the verification review team.<br>
        Access your verification dashboard for a complete overview of pending requests.
      </p>
    </div>
  </div>
</body>
</html>
`;