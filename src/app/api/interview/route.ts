import { NextRequest, NextResponse } from "next/server";
import { OfficialApiRequestSchema } from "@/lib/api/contract";
import { handleOfficialInterviewRequest } from "@/lib/api/request-adapter";
import { ApiError, formatErrorResponse } from "@/lib/api/errors";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let rawJson: unknown;
    try {
      rawJson = await req.json();
    } catch {
      let bodyText = "";
      try {
        bodyText = await req.text();
      } catch {
        throw new ApiError(400, "MALFORMED_JSON", "Failed to read HTTP request body.");
      }

      if (!bodyText.trim()) {
        throw new ApiError(
          400,
          "EMPTY_PAYLOAD",
          "Request body cannot be empty. Please provide a JSON payload containing 'candidateId' or 'sessionId'."
        );
      }

      try {
        rawJson = JSON.parse(bodyText);
      } catch {
        throw new ApiError(
          400,
          "MALFORMED_JSON",
          "Invalid JSON payload syntax. Request body must be valid JSON."
        );
      }
    }

    const parseResult = OfficialApiRequestSchema.safeParse(rawJson);
    if (!parseResult.success) {
      console.error("SAFE_PARSE_ERROR:", parseResult.error.format());
      throw new ApiError(
        422,
        "UNPROCESSABLE_ENTITY",
        parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
        parseResult.error.format()
      );
    }

    const officialResponse = await handleOfficialInterviewRequest(parseResult.data);
    return NextResponse.json(officialResponse, { status: 200 });
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function GET(): Promise<NextResponse> {
  return formatErrorResponse(
    new ApiError(
      405,
      "METHOD_NOT_ALLOWED",
      "HTTP GET is not supported on this endpoint. Use HTTP POST with JSON body."
    )
  );
}

export async function PUT(): Promise<NextResponse> {
  return formatErrorResponse(
    new ApiError(
      405,
      "METHOD_NOT_ALLOWED",
      "HTTP PUT is not supported on this endpoint. Use HTTP POST with JSON body."
    )
  );
}

export async function DELETE(): Promise<NextResponse> {
  return formatErrorResponse(
    new ApiError(
      405,
      "METHOD_NOT_ALLOWED",
      "HTTP DELETE is not supported on this endpoint. Use HTTP POST with JSON body."
    )
  );
}
