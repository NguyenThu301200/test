import { Request, Response, NextFunction } from "express";

/**
 * Global error-handling middleware.
 * Catches all unhandled errors and returns a consistent error response.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ success: false, error: "Internal server error" });
}
