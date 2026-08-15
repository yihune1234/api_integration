/**
 * PaymentProvider — the contract that any payment provider must implement.
 *
 * A real provider (Chapa, Telebirr, Stripe, ...) swaps in by implementing this
 * same shape. The rest of the premium module only ever talks to this interface,
 * so a swap never touches the approval workflow, the schema, or other modules.
 */
export class PaymentProvider {
  async createPayment({ userId, plan, amount }) {
    throw new Error("PaymentProvider.createPayment not implemented");
  }
  async verifyPayment({ paymentReference }) {
    throw new Error("PaymentProvider.verifyPayment not implemented");
  }
}
