// src/server/templates/emails/verification-approved.ts
export const verificationApprovedTemplate = `
<!DOCTYPE html>
<html>
<head>
  <title>Verification Approved</title>
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
      background-color: #4CAF50;
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
      background-color: #4CAF50;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin-top: 20px;
    }
    .benefits {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
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
    <h1>Verification Approved! 🎉</h1>
  </div>

  <div class="content">
    <p>Hello {{name}},</p>
    
    <p>Great news! Your {{type}} verification request has been approved. Your profile has been updated to reflect your new verification status.</p>

    <div class="benefits">
      <h3>What this means for you:</h3>
      <ul>
        {{#each benefits}}
          <li>{{this}}</li>
        {{/each}}
      </ul>
    </div>

    {{#if notes}}
    <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 15px 0;">
      <strong>Reviewer Notes:</strong>
      <p>{{notes}}</p>
    </div>
    {{/if}}

    <a href="{{profileUrl}}" class="button">View Your Profile</a>

    <p>Thank you for helping maintain the quality and trust of our platform!</p>

    <div class="footer">
      <p>Best regards,<br>The Launchify Team</p>
    </div>
  </div>
</body>
</html>
`;