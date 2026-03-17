import { Router, Request, Response, NextFunction } from "express";
import {
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource,
} from "../controllers/resource";
import {
  validateCreateResource,
  validateUpdateResource,
} from "../middleware/validate";
import { CreateResourceDto, UpdateResourceDto } from "../models/resource";

const router = Router();

/**
 * POST /resources
 * Creates a new resource.
 */
router.post(
  "/",
  validateCreateResource,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dto = req.body as CreateResourceDto;
      const resource = createResource(dto);
      res.status(201).json({ success: true, data: resource });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /resources
 * Lists all resources. Supports optional ?status= query filter.
 */
router.get("/", (req: Request, res: Response, next: NextFunction): void => {
  try {
    const status = req.query.status as string | undefined;
    const resources = getAllResources(status);
    res.status(200).json({ success: true, data: resources });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /resources/:id
 * Retrieves a single resource by ID.
 */
router.get("/:id", (req: Request, res: Response, next: NextFunction): void => {
  try {
    const resource = getResourceById(req.params.id as string);
    if (!resource) {
      res.status(404).json({ success: false, error: "Resource not found" });
      return;
    }
    res.status(200).json({ success: true, data: resource });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /resources/:id
 * Full update of a resource (name + status required).
 */
router.put(
  "/:id",
  validateUpdateResource,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dto = req.body as UpdateResourceDto;
      const resource = updateResource(req.params.id as string, dto);
      if (!resource) {
        res.status(404).json({ success: false, error: "Resource not found" });
        return;
      }
      res.status(200).json({ success: true, data: resource });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * DELETE /resources/:id
 * Deletes a resource by ID. Returns 204 No Content on success.
 */
router.delete(
  "/:id",
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const deleted = deleteResource(req.params.id as string);
      if (!deleted) {
        res.status(404).json({ success: false, error: "Resource not found" });
        return;
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export default router;
