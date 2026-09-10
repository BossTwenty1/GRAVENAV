export type GeolocationReadiness = "not-requested" | "permission-required" | "unavailable" | "ready";

export interface DeviceLocationState {
  readiness: GeolocationReadiness;
  accuracyMeters?: number;
}
