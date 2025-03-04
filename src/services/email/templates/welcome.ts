export const welcome = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Launchify</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      background-color: #1a56db;
      color: #ffffff;
      border-radius: 8px 8px 0 0;
    }
    .content {
      padding: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #1a56db;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666666;
      font-size: 14px;
    }
    .features {
      margin: 20px 0;
      padding: 0;
      list-style-type: none;
    }
    .features li {
      margin-bottom: 10px;
      padding-left: 24px;
      position: relative;
    }
    .features li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #1a56db;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Launchify!</h1>
    </div>
    
    <div class="content">
      <p>Hello {{name}},</p>
      
      <p>Welcome to Launchify! We're excited to have you join our community of entrepreneurs and investors. Your journey to meaningful connections and successful collaborations starts here.</p>

      {{#if userType === 'entrepreneur'}}
      <p>As an entrepreneur, you now have access to:</p>
      <ul class="features">
        <li>Connect with potential investors who share your vision</li>
        <li>Showcase your project to the right audience</li>
        <li>Secure funding opportunities that match your needs</li>
        <li>Network with other entrepreneurs in your field</li>
      </ul>
      {{else}}
      <p>As an investor, you now have access to:</p>
      <ul class="features">
        <li>Discover promising investment opportunities</li>
        <li>Connect with innovative entrepreneurs</li>
        <li>Build a diverse investment portfolio</li>
        <li>Network with other investors in your field</li>
      </ul>
      {{/if}}

      <p>To get started:</p>
      <ol>
        <li>Complete your profile to increase your visibility</li>
        <li>Set your preferences to receive relevant matches</li>
        <li>Browse and connect with potential {{#if userType === 'entrepreneur'}}investors{{else}}entrepreneurs{{/if}}</li>
      </ol>

      <div style="text-align: center;">
        <a href="{{dashboardUrl}}" class="button">
          Go to Your Dashboard
        </a>
      </div>

      <p>If you have any questions or need assistance, our support team is here to help. Just reply to this email or visit our help center.</p>

      <p>Best regards,<br>The Launchify Team</p>
    </div>

    <div class="footer">
      <p>Follow us on social media for updates and success stories:</p>
      <div>
        <a href="{{socialLinks.linkedin}}" style="margin: 0 10px;">LinkedIn</a>
        <a href="{{socialLinks.twitter}}" style="margin: 0 10px;">Twitter</a>
        <a href="{{socialLinks.facebook}}" style="margin: 0 10px;">Facebook</a>
      </div>
      <p>
        You received this email because you signed up for Launchify.<br>
        {{companyAddress}}
      </p>
    </div>
  </div>
</body>
</html>
`;