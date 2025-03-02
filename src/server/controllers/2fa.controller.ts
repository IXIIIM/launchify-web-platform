// src/server/controllers/2fa.controller.ts
import { Request, Response } from 'express';
import { TwoFactorService } from '../services/2fa';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const twoFactorService = new TwoFactorService();

interface AuthRequest extends Request {
  user: any;
}

export const setupAuthenticator = async (req: AuthRequest, res: Response) => {
  try {
    const { secret, qrCode } = await twoFactorService.generateTOTPSecret(req.user.id);
    res.json({ secret, qrCode });
  } catch (error) {
    console.error('Setup authenticator error:', error);
    res.status(500).json({ message: 'Error setting up authenticator' });
  }
};

export const setupSMS = async (req: AuthRequest, res: Response) => {
  try {
    const success = await twoFactorService.sendSMSCode(req.user.id);
    if (!success) {
      throw new Error('Failed to send SMS');
    }
    res.json({ message: 'SMS code sent' });
  } catch (error) {
    console.error('Setup SMS error:', error);
    res.status(500).json({ message: 'Error setting up SMS verification' });
  }
};

export const verify2FA = async (req: AuthRequest, res: Response) => {
  try {
    const { method, code } = req.body;
    let isValid = false;

    if (method === 'authenticator') {
      isValid = await twoFactorService.verifyTOTP(req.user.id, code);
    } else if (method === 'sms') {
      isValid = await twoFactorService.verifySMSCode(req.user.id, code);
    } else if (method === 'recovery') {
      isValid = await twoFactorService.validateRecoveryCode(req.user.id, code);
    }

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // If this is initial setup, generate recovery codes
    if (!req.user.totpEnabled && !req.user.phoneVerified) {
      const recoveryCodes = await twoFactorService.generateRecoveryCodes(req.user.id);
      return res.json({ success: true, recoveryCodes });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ message: 'Error verifying code' });
  }
};

export const resendSMS = async (req: AuthRequest, res: Response) => {
  try {
    const success = await twoFactorService.sendSMSCode(req.user.id);
    if (!success) {
      throw new Error('Failed to send SMS');
    }
    res.json({ message: 'SMS code sent' });
  } catch (error) {
    console.error('Resend SMS error:', error);
    res.status(500).json({ message: 'Error sending SMS code' });
  }
};

export const disable2FA = async (req: AuthRequest, res: Response) => {
  try {
    await twoFactorService.disable2FA(req.user.id);
    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ message: 'Error disabling 2FA' });
  }
};

// src/server/routes/2fa.ts
import express from 'express';
import {
  setupAuthenticator,
  setupSMS,
  verify2FA,
  resendSMS,
  disable2FA
} from '../controllers/2fa.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/setup/authenticator', authenticateToken, setupAuthenticator);
router.post('/setup/sms', authenticateToken, setupSMS);
router.post('/verify', authenticateToken, verify2FA);
router.post('/resend-sms', authenticateToken, resendSMS);
router.post('/disable', authenticateToken, disable2FA);

export default router;

// Update auth controller to handle 2FA during login
// src/server/controllers/auth.controller.ts (append to existing file)
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, twoFactorCode } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Handle 2FA if enabled
    if (user.totpEnabled || user.phoneVerified) {
      // If no 2FA code provided, return the required method
      if (!twoFactorCode) {
        return res.status(202).json({
          require2FA: true,
          method: user.totpEnabled ? 'authenticator' : 'sms'
        });
      }

      // Verify 2FA code
      let isValid = false;
      if (user.totpEnabled) {
        isValid = await twoFactorService.validateTOTP(user.id, twoFactorCode);
      } else {
        isValid = await twoFactorService.verifySMSCode(user.id, twoFactorCode);
      }

      if (!isValid) {
        return res.status(401).json({ message: 'Invalid 2FA code' });
      }
    }

    // Generate JWT and continue with login
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        subscriptionTier: user.subscriptionTier
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};