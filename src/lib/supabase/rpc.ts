import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;
type RecordState = Database["public"]["Enums"]["record_state"];

type DeceasedParameters = {
  p_source_display_name: string;
  p_date_of_birth: string | null;
  p_date_of_death: string | null;
};

type IntermentParameters = {
  p_confirm_occupied?: boolean;
  p_deceased_person_id: string;
  p_plot_id: string;
  p_interment_date: string | null;
  p_interment_type: string | null;
  p_position_sequence: number | null;
  p_permanence_status: string | null;
};

// PostgreSQL routine metadata does not declare argument nullability, so the
// Supabase generator emits non-null arguments even when the function accepts
// SQL NULL. Keep that application-specific correction at this narrow boundary
// while leaving database.types.ts reproducible generator output.
export function createDeceasedPersonRpc(client: Client, parameters: DeceasedParameters) {
  return client.rpc(
    "create_deceased_person",
    parameters as unknown as Database["public"]["Functions"]["create_deceased_person"]["Args"],
  );
}

export function updateDeceasedPersonRpc(
  client: Client,
  parameters: DeceasedParameters & { p_deceased_person_id: string },
) {
  return client.rpc(
    "update_deceased_person",
    parameters as unknown as Database["public"]["Functions"]["update_deceased_person"]["Args"],
  );
}

export function createIntermentRpc(client: Client, parameters: IntermentParameters) {
  return client.rpc(
    "create_interment",
    parameters as unknown as Database["public"]["Functions"]["create_interment"]["Args"],
  );
}

export function updateIntermentRpc(
  client: Client,
  parameters: IntermentParameters & { p_interment_id: string; p_state: RecordState },
) {
  return client.rpc(
    "update_interment",
    parameters as unknown as Database["public"]["Functions"]["update_interment"]["Args"],
  );
}
