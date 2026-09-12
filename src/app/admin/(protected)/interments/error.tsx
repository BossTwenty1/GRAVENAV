"use client";

import { AdminRecordError } from "@/components/admin-record-feedback";

export default function IntermentsError({ reset }: { error: Error; reset: () => void }) {
  return <AdminRecordError description="No changes were made. Check the connection and try again." heading="Interment records are temporarily unavailable" reset={reset} />;
}
