import { NextResponse } from "next/server";

/**
 * Centralized production guard for debug endpoints.
 *
 * In production (`NODE_ENV === 'production'`), returns HTTP 404 to prevent exposure of
 * raw internal state, planner signals, candidate intelligence priors, or debug traces.
 *
 * In development and test environments, returns null allowing debug routes to function normally.
 */
export function guardDebugRoute(): NextResponse | null {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "NOT_FOUND" },
      { status: 404 }
    );
  }
  return null;
}
