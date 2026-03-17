import crypto from "crypto";
import db from "../db";
import {
  Resource,
  CreateResourceDto,
  UpdateResourceDto,
} from "../models/resource";

/**
 * Creates a new resource in the database.
 * Generates a UUID for the id and sets createdAt/updatedAt to current ISO timestamp.
 */
export function createResource(dto: CreateResourceDto): Resource {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO resources (id, name, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, dto.name.trim(), dto.status, now, now);

  return {
    id,
    name: dto.name.trim(),
    status: dto.status,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Retrieves all resources, optionally filtered by status.
 * @param status - Optional filter: "active" or "inactive"
 */
export function getAllResources(status?: string): Resource[] {
  if (status) {
    const stmt = db.prepare("SELECT * FROM resources WHERE status = ?");
    return stmt.all(status) as Resource[];
  }
  const stmt = db.prepare("SELECT * FROM resources");
  return stmt.all() as Resource[];
}

/**
 * Retrieves a single resource by its ID.
 * @returns The resource, or null if not found.
 */
export function getResourceById(id: string): Resource | null {
  const stmt = db.prepare("SELECT * FROM resources WHERE id = ?");
  const row = stmt.get(id) as Resource | undefined;
  return row ?? null;
}

/**
 * Updates an existing resource with new name and status.
 * Sets updatedAt to the current ISO timestamp.
 * @returns The updated resource, or null if not found.
 */
export function updateResource(
  id: string,
  dto: UpdateResourceDto,
): Resource | null {
  const existing = getResourceById(id);
  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE resources SET name = ?, status = ?, updatedAt = ? WHERE id = ?
  `);
  stmt.run(dto.name.trim(), dto.status, now, id);

  return {
    id,
    name: dto.name.trim(),
    status: dto.status,
    createdAt: existing.createdAt,
    updatedAt: now,
  };
}

/**
 * Deletes a resource by its ID.
 * @returns true if a resource was deleted, false if not found.
 */
export function deleteResource(id: string): boolean {
  const stmt = db.prepare("DELETE FROM resources WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}
