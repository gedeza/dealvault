import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "./logger";

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status: number) {
  if (status >= 500) {
    logger.error(message);
  }
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown, fallbackMessage = "Internal server error") {
  if (error instanceof z.ZodError) {
    return errorResponse(error.issues[0].message, 400);
  }

  logger.error(fallbackMessage, {
    error: error instanceof Error ? error.message : String(error),
  });

  return errorResponse(fallbackMessage, 500);
}
