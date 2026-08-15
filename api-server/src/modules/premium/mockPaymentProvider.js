import { PaymentProvider } from "./paymentProvider.interface.js";

/**
 * MockPaymentProvider — simulates a payment for development/testing.
 *
 * Accepts any reference the user provides and marks it "mock_confirmed"
 * immediately. A real provider would call out to an actual payment API here.
 */
export class MockPaymentProvider extends PaymentProvider {
  async createPayment({ userId, plan, amount }) {
    return {
      paymentReference: `MOCK-TX-${Date.now()}`,
      status: "mock_confirmed",
    };
  }
  async verifyPayment({ paymentReference }) {
    return { status: "mock_confirmed" };
  }
}
