export const verificationRejectedTemplate = `
<!DOCTYPE html>
<html>
<head>
  <title>Verification Request Rejected</title>
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
      background-color: #F44336;
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
    .reasons {
      background-color: #FFEBEE;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .next-steps {
      background-color: #f5f5f5;
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
    <h1>Verification Request Rejected</h1>
  </div>

  <div class="content">
    <p>Hello {{name}},</p>
    
    <p>We regret to inform you that your {{type}} verification request has been rejected. Our review team has carefully evaluated your submission and determined that it does not meet our current verification requirements.</p>

    {{#if notes}}
    <div class="reasons">
      <h3>Reason for Rejection:</h3>
      <p>{{notes}}</p>
    </div>
    {{/if}}

    <div class="next-steps">
      <h3>Next Steps:</h3>
      <ol>
        <li>Review our verification requirements and guidelines carefully</li>
        <li>Ensure all submitted documents meet our specified format and content requirements</li>
        <li>Address any specific issues mentioned in the rejection reason</li>
        <li>Submit a new verification request when ready</li>
      </ol>
    </div>

    <p>You can submit a new verification request after addressing these issues:</p>

    <a href="{{newRequestUrl}}" class="button">Submit New Request</a>

    <p>If you believe this rejection was made in error or need clarification about the requirements, please don't hesitate to contact our support team.</p>

    <p>You can view our complete verification guidelines and requirements here:</p>
    
    <a href="{{guidelinesUrl}}" class="button" style="background-color: #757575;">View Guidelines</a>
  </div>

  <div class="footer">
    <p>Best regards,<br>The Launchify Team</p>
  </div>
</body>
</html>
`;