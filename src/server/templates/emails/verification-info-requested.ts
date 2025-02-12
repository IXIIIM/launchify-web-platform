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
      background-color: #FFF3E0;
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
    .document-list {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Additional Information Required</h1>
  </div>

  <div class="content">
    <p>Hello {{name}},</p>
    
    <p>Thank you for submitting your {{type}} verification request. Our review team has reviewed your submission and requires some additional information to complete the verification process.</p>

    <div class="requirements">
      <h3>Additional Documents Required:</h3>
      <ul>
        {{#each requiredDocuments}}
          <li>{{this}}</li>
        {{/each}}
      </ul>
    </div>

    {{#if message}}
    <div class="document-list">
      <strong>Reviewer Message:</strong>
      <p>{{message}}</p>
    </div>
    {{/if}}

    <p>Please provide the requested information through your dashboard:</p>

    <a href="{{uploadUrl}}" class="button">Upload Documents</a>

    <p>Important Notes:</p>
    <ul>
      <li>All documents should be in PDF, JPG, or PNG format</li>
      <li>Maximum file size is 10MB per document</li>
      <li>Ensure all documents are clear and legible</li>
      <li>Documents should be in English or include certified translations</li>
    </ul>

    <p>Your verification request will remain pending until we receive and review the additional information. Once you've uploaded the requested documents, our team will prioritize reviewing your updated submission.</p>

    <p>If you have any questions about the required information or need assistance, please don't hesitate to contact our support team.</p>
  </div>

  <div class="footer">
    <p>Best regards,<br>The Launchify Team</p>
  </div>
</body>
</html>
`;