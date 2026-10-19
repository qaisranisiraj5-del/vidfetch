/**
 * Registry of all platform integrations.
 */

import type { PlatformId } from "../config";
import type {
  IntegrationStatus,
  PlatformIntegration,
} from "./types";
import { youtubeIntegration } from "./youtube";
import { instagramIntegration } from "./instagram";
import { facebookIntegration } from "./facebook";
import { tiktokIntegration } from "./tiktok";

export const INTEGRATIONS: Record<PlatformId, PlatformIntegration> = {
  youtube: youtubeIntegration,
  instagram: instagramIntegration,
  facebook: facebookIntegration,
  tiktok: tiktokIntegration,
};

export function getIntegration(id: PlatformId): PlatformIntegration {
  return INTEGRATIONS[id];
}

export async function getAllStatuses(): Promise<IntegrationStatus[]> {
  return Promise.all(
    (Object.keys(INTEGRATIONS) as PlatformId[]).map((id) =>
      INTEGRATIONS[id].checkStatus()
    )
  );
}
