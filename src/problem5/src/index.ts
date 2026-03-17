import express from "express";
import resourceRoutes from "./routes/resource";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 3000;

/** Parse incoming JSON request bodies. */
app.use(express.json());

/** Mount resource routes at /resources. */
app.use("/resources", resourceRoutes);

/** Global error handler — must be registered last. */
app.use(errorHandler);

/** Start the server. */
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
