import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { CreditCard, Lock, Shield, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);

interface PaymentDetails {
  amount: number;
  currency: string;
  description: string;
  escrow?: {
    milestones: {
      id: string;
      description: string;
      amount: number;
      dueDate: string;
    }[];
    totalAmount: number;
  };
}

interface PaymentFormProps {
  paymentDetails: PaymentDetails;
  onPaymentComplete: (paymentId: string) => void;
}

function PaymentForm({ paymentDetails, onPaymentComplete }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: paymentDetails.amount,
            currency: paymentDetails.currency,
            description: paymentDetails.description,
            escrow: paymentDetails.escrow
          })
        });

        if (!response.ok) throw new Error('Failed to create payment intent');
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to initialize payment');
      }
    };

    createPaymentIntent();
  }, [paymentDetails]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) return;

    try {
      setProcessing(true);
      setError('');

      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payments/confirm`,
        },
        redirect: 'if_required'
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // If escrow payment, create escrow record
        if (paymentDetails.escrow) {
          const escrowResponse = await fetch('/api/escrow/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              milestones: paymentDetails.escrow.milestones
            })
          });

          if (!escrowResponse.ok) {
            throw new Error('Failed to create escrow record');
          }
        }

        onPaymentComplete(paymentIntent.id);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (!clientSecret) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Secure Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Payment Amount Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Total Amount</span>
                <span className="text-lg font-bold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: paymentDetails.currency
                  }).format(paymentDetails.amount / 100)}
                </span>
              </div>
              <p className="text-sm text-gray-600">{paymentDetails.description}</p>
            </div>

            {/* Escrow Details if applicable */}
            {paymentDetails.escrow && (
              <div className="space-y-2">
                <h3 className="font-medium">Escrow Milestones</h3>
                {paymentDetails.escrow.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex justify-between items-center p-3 bg-white border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{milestone.description}</div>
                      <div className="text-sm text-gray-600">
                        Due: {new Date(milestone.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="font-medium">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: paymentDetails.currency
                      }).format(milestone.amount / 100)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stripe Payment Element */}
            <PaymentElement />

            {/* Security Info */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Lock className="h-4 w-4 mr-1" />
                Secure Payment
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                Protected
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 
                 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Pay Securely
          </>
        )}
      </button>
    </form>
  );
}

export default function PaymentProcessor({ paymentDetails, onPaymentComplete }: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        paymentDetails={paymentDetails}
        onPaymentComplete={onPaymentComplete}
      />
    </Elements>
  );
}