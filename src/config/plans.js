export const planLimits = {
  free: 100,
  business: 10_000,
  enterprise: 2_147_483_647,
};

export function maxRequestsForPlan(plan) {
  const maxRequests = planLimits[plan];
  if (!maxRequests) {
    const error = new Error(`Unsupported plan: ${plan}`);
    error.code = "VALIDATION_ERROR";
    error.status = 422;
    throw error;
  }
  return maxRequests;
}

export function nextDailyReset() {
  const reset = new Date();
  reset.setUTCHours(24, 0, 0, 0);
  return reset;
}