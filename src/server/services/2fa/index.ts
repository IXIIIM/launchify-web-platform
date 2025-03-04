// src/server/services/2fa/index.ts
import { authenticator } from 'otplib';
import { PrismaClient } from '@prisma/client';
import { Twilio } from 'twilio';
import QRCode from 'qrcode';

const prisma = new PrismaClient();
const twilio = new Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export class TwoFactorService {
  private readonly issuer = 'Launchify';
  private readonly codeValidityDuration = 10 * 60 * 1000; // 10 minutes

  async generateTOTPSecret(userId: string): Promise<{ secret: string; qrCode: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, this.issuer, secret);
    const qrCode = await QRCode.toDataURL(otpauth);

    // Store secret temporarily until verified
    await prisma.user.update({
      where: { id: userId },
      data: {
        tempTOTPSecret: secret,
        totpEnabled: false
      }
    });

    return { secret, qrCode };
  }

  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.tempTOTPSecret) throw new Error('TOTP not set up');

    const isValid = authenticator.verify({
      token,
      secret: user.tempTOTPSecret
    });

    if (isValid) {
      // Move secret from temporary to permanent storage
      await prisma.user.update({
        where: { id: userId },
        data: {
          totpSecret: user.tempTOTPSecret,
          tempTOTPSecret: null,
          totpEnabled: true
        }
      });
    }

    return isValid;
  }

  async validateTOTP(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpSecret || !user.totpEnabled) return false;

    return authenticator.verify({
      token,
      secret: user.totpSecret
    });
  }

  async sendSMSCode(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.phone) throw new Error('Phone number not found');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + this.codeValidityDuration);

    try {
      await twilio.messages.create({
        body: `Your Launchify verification code is: ${code}`,
        to: user.phone,
        from: process.env.TWILIO_PHONE_NUMBER
      });

      await prisma.verificationCode.create({
        data: {
          userId,
          code,
          type: 'SMS',
          expiresAt
        }
      });

      return true;
    } catch (error) {
      console.error('SMS sending error:', error);
      return false;
    }
  }

  async verifySMSCode(userId: string, code: string): Promise<boolean> {
    const verification = await prisma.verificationCode.findFirst({
      where: {
        userId,
        code,
        type: 'SMS',
        expiresAt: {
          gt: new Date()
        },
        used: false
      }
    });

    if (!verification) return false;

    // Mark code as used
    await prisma.verificationCode.update({
      where: { id: verification.id },
      data: { used: true }
    });

    return true;
  }

  async disable2FA(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: null,
        tempTOTPSecret: null,
        totpEnabled: false
      }
    });
  }

  // Recovery codes functionality
  async generateRecoveryCodes(userId: string): Promise<string[]> {
    const codes = Array.from({ length: 10 }, () => 
      [...Array(24)].map(() => Math.random().toString(36)[2]).join('')
    );

    // Store hashed codes
    await Promise.all(codes.map(code => 
      prisma.recoveryCode.create({
        data: {
          userId,
          code: this.hashCode(code),
          used: false
        }
      })
    ));

    return codes;
  }

  async validateRecoveryCode(userId: string, code: string): Promise<boolean> {
    const hashedCode = this.hashCode(code);
    const recoveryCode = await prisma.recoveryCode.findFirst({
      where: {
        userId,
        code: hashedCode,
        used: false
      }
    });

    if (recoveryCode) {
      await prisma.recoveryCode.update({
        where: { id: recoveryCode.id },
        data: { used: true }
      });
      return true;
    }

    return false;
  }

  private hashCode(code: string): string {
    // In production, use a proper crypto hashing function
    return Buffer.from(code).toString('base64');
  }
}

// Update Prisma schema
/*
model User {
  // ... existing fields ...
  totpSecret      String?
  tempTOTPSecret  String?
  totpEnabled     Boolean   @default(false)
  phone           String?
  phoneVerified   Boolean   @default(false)
}

model VerificationCode {
  id        String   @id @default(uuid())
  userId    String
  code      String
  type      String   // SMS, EMAIL
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
}

model RecoveryCode {
  id        String   @id @default(uuid())
  userId    String
  code      String
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
}
*/