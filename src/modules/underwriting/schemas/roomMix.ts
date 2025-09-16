import { z } from "zod";

export const RoomTypeSchema = z.object({
  id: z.string().min(1, "Missing id"),
  name: z.string().trim().min(1, "Name required"),
  // coerce -> int -> min(0)
  rooms: z.coerce.number().int().min(0, "Count can't be negative"),
  // optional but coerced, default 100, clamp 50..300 to avoid weird weights
  adrWeight: z
    .coerce
    .number()
    .int()
    .catch(100)
    .transform((n) => Math.min(300, Math.max(50, n))),
});

export const RoomMixSchema = z.array(RoomTypeSchema)
  // strip blank rows (no name AND 0 rooms)
  .transform(list => list.filter(r => r.name.trim() !== "" || r.rooms > 0))
  // de-dupe IDs if any row is missing id
  .transform(list => list.map(r => ({ ...r, id: r.id || crypto.randomUUID() })));

export type RoomTypeParsed = z.infer<typeof RoomTypeSchema>;