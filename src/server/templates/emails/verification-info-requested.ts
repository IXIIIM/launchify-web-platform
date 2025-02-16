export const verificationInfoRequestedTemplate = `
<!DOCTYPE html>
<html>
<head>
  <title>Additional Information Required</title>
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
      background-color: #FF9800;
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
    .requirements {
      background-color: #fff3e0;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      border: 1px solid #FFE0B2;
    }
    .message {
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
  </style>
</head>
<body>
  <div class="header">
    <h1>Additional Information Required</h1>
  </div>

  <div class="content">
    <p>Hello {{name}},</p>
    
    <p>Our verification team has reviewed your {{type}} verification request and needs some additional information to complete the process.</p>

    {{#if message}}
    <div class="message">
      <strong>Message from the verification team:</strong>
      <p>{{message}}</p>
    </div>
    {{/if}}

    <div class="requirements">
      <h3>Required Documents:</h3>
      <ul>
        {{#each requiredDocuments}}
          <li>{{this}}</li>
        {{/each}}
      </ul>
    </div>

    <p><strong>Important:</strong></p>
    <ul>
      <li>Please ensure all documents are clear and legible</li>
      <li>Accepted formats: PDF, JPG, PNG</li>
      <li>Maximum file size: 10MB per document</li>
    </ul>

    <a href="{{uploadUrl}}" class="button">Upload Documents</a>

    <p>Your verification request will remain pending until we receive the requested information. If you have any questions, please don't hesitate to contact our support team.</p>

    <div class="footer">
      <p>Best regards,<br>The Launchify Team</p>
    </div>
  </div>
</body>
</html>
`;