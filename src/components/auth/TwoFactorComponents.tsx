// src/components/auth/TwoFactorComponents.tsx

import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Main 2FA setup component
const TwoFactorSetup = () => {
  const [step, setStep] = useState('method-selection');
  const [method, setMethod] = useState<'authenticator' | 'sms' | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState('');

  const initializeAuthenticator = async () => {
    try {
      const response = await fetch('/api/2fa/setup/authenticator', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to initialize authenticator');
      
      const data = await response.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('authenticator-setup');
    } catch (error) {
      setError('Failed to initialize authenticator setup');
    }
  };

  const initializeSMS = async () => {
    try {
      const response = await fetch('/api/2fa/setup/sms', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to send SMS code');
      
      setStep('sms-verification');
    } catch (error) {
      setError('Failed to send SMS verification code');
    }
  };

  const verifyCode = async () => {
    try {
      const response = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          code: verificationCode,
        }),
      });

      if (!response.ok) throw new Error('Invalid verification code');

      const { recoveryCodes } = await response.json();
      setRecoveryCodes(recoveryCodes);
      setStep('recovery-codes');
    } catch (error) {
      setError('Invalid verification code');
    }
  };

  const renderMethodSelection = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Choose 2FA Method</h2>
      <div className="grid gap-4">
        <button
          onClick={() => {
            setMethod('authenticator');
            initializeAuthenticator();
          }}
          className="p-4 border rounded-lg hover:bg-gray-50 text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="text-2xl">📱</div>
            <div>
              <h3 className="font-semibold">Authenticator App</h3>
              <p className="text-sm text-gray-600">
                Use Google Authenticator or similar apps
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setMethod('sms');
            initializeSMS();
          }}
          className="p-4 border rounded-lg hover:bg-gray-50 text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="text-2xl">💬</div>
            <div>
              <h3 className="font-semibold">SMS Verification</h3>
              <p className="text-sm text-gray-600">
                Receive codes via text message
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const renderAuthenticatorSetup = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Set Up Authenticator</h2>
      
      <div className="space-y-4">
        <div className="flex justify-center">
          <img src={qrCode} alt="QR Code" className="w-48 h-48" />
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Can't scan the QR code? Enter this code manually:
          </p>
          <code className="bg-gray-100 px-2 py-1 rounded">
            {secret}
          </code>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Enter verification code:
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter 6-digit code"
          />
        </div>

        <button
          onClick={verifyCode}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Verify
        </button>
      </div>
    </div>
  );

  const renderSMSVerification = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">SMS Verification</h2>
      
      <div className="space-y-4">
        <p className="text-gray-600">
          Enter the verification code sent to your phone
        </p>

        <div className="space-y-2">
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter 6-digit code"
          />
        </div>

        <button
          onClick={verifyCode}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Verify
        </button>

        <button
          onClick={initializeSMS}
          className="w-full text-sm text-blue-600 hover:text-blue-700"
        >
          Resend Code
        </button>
      </div>
    </div>
  );

  const renderRecoveryCodes = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Save Your Recovery Codes</h2>
      
      <Alert>
        <AlertTitle>Important!</AlertTitle>
        <AlertDescription>
          Save these recovery codes in a secure place. You'll need them if you
          lose access to your authentication method.
        </AlertDescription>
      </Alert>

      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        {recoveryCodes.map((code, index) => (
          <div
            key={index}
            className="font-mono text-sm bg-white p-2 rounded border"
          >
            {code}
          </div>
        ))}
      </div>

      <button
        onClick={() => window.print()}
        className="w-full py-2 border rounded-lg hover:bg-gray-50"
      >
        Print Recovery Codes
      </button>

      <button
        onClick={() => window.location.href = '/settings'}
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Complete Setup
      </button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === 'method-selection' && renderMethodSelection()}
      {step === 'authenticator-setup' && renderAuthenticatorSetup()}
      {step === 'sms-verification' && renderSMSVerification()}
      {step === 'recovery-codes' && renderRecoveryCodes()}
    </div>
  );
};

// Verification dialog shown during login
const TwoFactorVerification = ({ 
  isOpen,
  onClose,
  onVerify,
  method
}: {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<boolean>;
  method: 'authenticator' | 'sms';
}) => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');

  const handleVerify = async () => {
    setIsVerifying(true);
    setError('');

    try {
      const success = await onVerify(showRecovery ? recoveryCode : code);
      if (success) {
        onClose();
      } else {
        setError('Invalid verification code');
      }
    } catch (error) {
      setError('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendSMS = async () => {
    try {
      const response = await fetch('/api/2fa/resend-sms', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to resend code');
      
      // Show success message
    } catch (error) {
      setError('Failed to resend code');
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-96 bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-xl font-bold mb-4">
            Two-Factor Authentication
          </h2>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!showRecovery ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                {method === 'authenticator'
                  ? 'Enter the code from your authenticator app'
                  : 'Enter the code sent to your phone'}
              </p>

              <div className="space-y-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full p-2 border rounded"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
              </div>

              {method === 'sms' && (
                <button
                  onClick={handleResendSMS}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Resend Code
                </button>
              )}

              <button
                onClick={handleVerify}
                disabled={code.length !== 6 || isVerifying}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isVerifying ? 'Verifying...' : 'Verify'}
              </button>

              <button
                onClick={() => setShowRecovery(true)}
                className="w-full text-sm text-gray-600 hover:text-gray-700"
              >
                Use Recovery Code
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Enter one of your recovery codes
              </p>

              <div className="space-y-2">
                <input
                  type="text"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  className="w-full p-2 border rounded font-mono"
                  placeholder="Enter recovery code"
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={!recoveryCode || isVerifying}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isVerifying ? 'Verifying...' : 'Verify'}
              </button>

              <button
                onClick={() => setShowRecovery(false)}
                className="w-full text-sm text-gray-600 hover:text-gray-700"
              >
                Back to {method === 'authenticator' ? 'Authenticator' : 'SMS'} Verification
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { TwoFactorSetup, TwoFactorVerification };