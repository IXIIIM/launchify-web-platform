// src/server/templates/emails/key-rotation-alert.ts
export const keyRotationAlertTemplate = `
<!DOCTYPE html>
<html>
<head>
  <title>Key Rotation Alert</title>
</head>
<body>
  <h1>{{severity}} Alert: Key Rotation Required</h1>
  
  <p>Hello,</p>

  <p>This is an important security alert regarding your {{keyType}}.</p>

  {{#if documentId}}
    <p>The encryption key for document {{documentId}} is {{keyAge}} days old.</p>
  {{else}}
    <p>Your master encryption key is {{keyAge}} days old.</p>
  {{/if}}

  <p>Recommended Action:</p>
  <ul>
    {{#if severity == 'CRITICAL'}}
      <li>Immediate key rotation is required</li>
      <li>Your key has exceeded the maximum age threshold</li>
      <li>System access may be restricted until rotation is completed</li>
    {{else}}
      <li>Please schedule a key rotation within the next 7 days</li>
      <li>Your key is approaching the maximum age threshold</li>
    {{/if}}
  </ul>

  <a href="{{settingsLink}}" style="background-color: {{#if severity == 'CRITICAL'}}#DC2626{{else}}#3B82F6{{/if}}; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">
    Rotate Key Now
  </a>