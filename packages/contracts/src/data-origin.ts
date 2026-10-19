import { z } from 'zod';

/** Verinin kökeni (§12.4, REQ-VER-018). DEMO kayıtlar üretim yüzeylerine giremez. */
export const DataOrigin = z.enum(['DEMO', 'EDITORIAL', 'USER', 'OWNER', 'PROVIDER', 'IMPORT']);
export type DataOrigin = z.infer<typeof DataOrigin>;
