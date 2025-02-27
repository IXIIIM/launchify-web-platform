<<<<<<< HEAD
// src/server/templates/emails/verification-rejected.ts
=======
>>>>>>> feature/security-implementation
export const verificationRejectedTemplate = `
<!DOCTYPE html>
<html>
<head>
  <title>Verification Request Update</title>
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
      background-color: #607D8B;
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
      background-color: #2196F3;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin-top: 20px;
    }
    .feedback {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .next-steps {
      background-color: #E3F2FD;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      border: 1px solid #BBDEFB;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Verification Request Update</h1>
  </div>

  <div class="content">
    <p>Hello {{name}},</p>
    
    <p>We have carefully reviewed your {{type}} verification request. Unfortunately, we are unable to approve it at this time.</p>

    {{#if notes}}
    <div class="feedback">
      <strong>Feedback from our verification team:</strong>
      <p>{{notes}}</p>
    </div>
    {{/if}}

    <div class="next-steps">
      <h3>Next Steps:</h3>
      <ul>
        <li>Review the feedback provided above</li>
        <li>Make the necessary adjustments or gather additional documentation</li>
        <li>Submit a new verification request when ready</li>
      </ul>
    </div>

    <p>Common reasons for verification rejection include:</p>
    <ul>
      <li>Incomplete or unclear documentation</li>
      <li>Documents don't meet our verification requirements</li>
      <li>Inconsistencies in provided information</li>
      <li>Quality or resolution issues with submitted files</li>
    </ul>

    <a href="{{verificationGuideUrl}}" class="button">View Verification Guide</a>

    <p>If you believe this decision was made in error or need clarification, please don't hesitate to contact our support team. We're here to help you succeed in getting verified.</p>

    <div class="footer">
      <p>Best regards,<br>The Launchify Team</p>
    </div>
  </div>
</body>
</html>
`;