import { NextResponse } from "next/server";

export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function formatErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details ?? null,
      },
      { status: error.statusCode }
    );
  }

  // Never leak internal stack traces or secrets to the client
  console.error("[Official API Error]:", error);

  return NextResponse.json(
    {
      error: "An internal server error occurred while processing the interview request.",
      code: "INTERNAL_SERVER_ERROR",
    },
    { status: 500 }
  );
}
