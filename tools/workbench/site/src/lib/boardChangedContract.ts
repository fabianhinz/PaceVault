import { z } from 'zod';

const boardChangedPayloadSchema = z.object({ path: z.string() });

export type BoardChangedPayload = z.infer<typeof boardChangedPayloadSchema>;
