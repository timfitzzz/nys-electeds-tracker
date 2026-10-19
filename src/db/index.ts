import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

// prepare: false keeps this compatible with Neon's pooled (PgBouncer) connection string.
export const db = url ? drizzle(postgres(url, { prepare: false, max: 1 }), { schema }) : null;
