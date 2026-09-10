export type MapDataStatus = "not-configured" | "synthetic" | "verified-client";

export interface GravesiteMapTarget {
  id: string;
  status: MapDataStatus;
  latitude?: number;
  longitude?: number;
}
