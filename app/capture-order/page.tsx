import { AppShell } from "@/components/AppShell";
import { CaptureOrderWorkflow } from "./CaptureOrderWorkflow";

export default function CaptureOrderPage() {
  return (
    <AppShell title="Capture order" subtitle="Photo → supplier list">
      <CaptureOrderWorkflow />
    </AppShell>
  );
}
