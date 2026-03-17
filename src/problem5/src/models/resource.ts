/**
 * Represents a Resource entity stored in the database.
 */
export interface Resource {
  id: string;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating a new resource.
 * The id, createdAt, and updatedAt fields are generated server-side.
 */
export interface CreateResourceDto {
  name: string;
  status: "active" | "inactive";
}

/**
 * DTO for updating an existing resource.
 * Both name and status are required (full update).
 */
export interface UpdateResourceDto {
  name: string;
  status: "active" | "inactive";
}
