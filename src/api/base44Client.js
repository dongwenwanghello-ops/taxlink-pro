/**
 * Compatibility shim — legacy `base44` imports delegate to TaxLink providers.
 * @deprecated Import { api } from '@/config/providers' in new code.
 */
import { api } from "@/config/providers";

export const base44 = api;
