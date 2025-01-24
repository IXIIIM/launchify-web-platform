# Launchify Web Platform

[Previous content remains...]

## Development Testing

### Development Dashboard (`/dev`)

The development dashboard provides tools for testing and debugging the platform's features:

1. **Notification Testing**
   - Simulate subscription events (renewals, payment failures, trial endings)
   - View sent notifications in real-time
   - Test different user scenarios

2. **Email Preview**
   - View all sent emails
   - Preview email templates with actual data
   - Test email formatting across different scenarios

3. **Subscription Simulation**
   - Test subscription tier changes
   - Simulate payment events
   - Preview subscription states

### Running the Development Environment

1. Start the development server:
```bash
npm run dev
```

2. Access the development dashboard:
```
http://localhost:3000/dev
```

3. Set up test data:
```bash
# Create test user
npm run seed:dev

# Or use the dashboard to configure test users
```

### Testing Features

#### Testing Notifications
1. Configure a test user in the dashboard
2. Click "Simulate Event" buttons to trigger different notifications
3. View sent notifications in the Notifications tab
4. Check email previews in the Email Logs tab

#### Testing Subscription Changes
1. Select a subscription tier for the test user
2. Use the simulation controls to trigger tier changes
3. Verify notification delivery
4. Check email content for accuracy

#### Testing Payment Scenarios
1. Simulate successful/failed payments
2. Verify payment failure notifications
3. Test payment retry flows
4. Check subscription status updates

### Environment Setup for Testing

Add these variables to your `.env` file for testing:
```env
# Development settings
NODE_ENV=development
ENABLE_DEV_TOOLS=true

# Test email settings (optional)
TEST_EMAIL_RECIPIENT=your-email@example.com
SUPPRESS_EMAILS=true  # Set to false to receive actual emails
```

### Available Test Commands

```bash
# Run all tests
npm test

# Run specific test suites
npm test notifications
npm test subscriptions
npm test payments

# Generate test coverage report
npm run test:coverage
```

### Debugging Tools

1. **WebSocket Inspector**
   - View real-time WebSocket messages
   - Test notification delivery
   - Monitor client-server communication

2. **Email Inspector**
   - Preview all email templates
   - Test email rendering
   - Verify email content

3. **State Inspector**
   - Monitor Redux state changes
   - Track subscription status
   - Debug user sessions

### Test Data Management

1. **Seeding Test Data**
```bash
# Seed basic test data
npm run seed:dev

# Reset test data
npm run seed:reset
```

2. **Managing Test Users**
   - Create test users via dashboard
   - Modify user properties
   - Reset user state

3. **Test Scenarios**
   - Pre-configured test scenarios
   - Custom scenario builder
   - Batch testing tools

### API Testing Endpoints

The following endpoints are available in development mode:

```typescript
// Notification testing
POST /api/dev/simulate-event
GET /api/dev/notifications

// Email testing
GET /api/dev/email-logs
POST /api/dev/send-test-email

// Subscription testing
POST /api/dev/simulate-subscription
GET /api/dev/subscription-status

// Data management
POST /api/dev/clear-data
POST /api/dev/reset-state
```

### Best Practices for Testing

1. **Isolated Testing**
   - Use separate test database
   - Reset state between tests
   - Clean up test data

2. **Comprehensive Testing**
   - Test all subscription tiers
   - Verify email templates
   - Check error handling

3. **Performance Testing**
   - Monitor notification delivery
   - Test bulk operations
   - Verify real-time updates

### Troubleshooting

Common issues and solutions:

1. **Notifications not showing**
   - Check WebSocket connection
   - Verify user configuration
   - Check browser console

2. **Emails not sending**
   - Verify email configuration
   - Check SUPPRESS_EMAILS setting
   - Review email logs

3. **Subscription issues**
   - Check database connections
   - Verify Stripe test keys
   - Review transaction logs

For more detailed instructions and scenarios, see the [Development Guide](docs/development-guide.md).
