import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** channel-sync 폴더 — .env · data/ 위치의 기준 */
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
