/**
 * Minimal Usage stub for Phase 4.
 *
 * Phase 5 will build a full Usage module. For now this stub
 * delegates to the database model so the extraction pipeline
 * doesn't break when it tries to record usage.
 */

import { upsertDailyUsage } from "../../db/models/api-usage.js";

export { upsertDailyUsage };

/**
 * Wrapper that never throws – the extraction pipeline should
 * never fail because usage recording fails.
 */
export async function recordUsage(usage) {
  try {
    await upsertDailyUsage(usage);
  } catch {
    // swallow — non-critical
  }
}