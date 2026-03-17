import { Request, Response, NextFunction } from "express";

/** Valid status values for a resource. */
const VALID_STATUSES = ["active", "inactive"] as const;

/**
 * Validates the request body for creating a resource.
 * Requires `name` (non-empty string) and `status` ("active" | "inactive").
 */
export function validateCreateResource(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { name, status } = req.body as Record<string, unknown>;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ success: false, error: "name is required" });
    return;
  }

  if (!status || typeof status !== "string") {
    res.status(400).json({ success: false, error: "status is required" });
    return;
  }

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    res.status(400).json({
      success: false,
      error: "status must be one of: active, inactive",
    });
    return;
  }

  next();
}

/**
 * Validates the request body for updating a resource.
 * Both `name` and `status` are required.
 */
export function validateUpdateResource(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // name and status are required in update
  validateCreateResource(req, res, next);
}
