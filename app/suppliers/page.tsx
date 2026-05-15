import { AppShell } from "@/components/AppShell";
import { SupplierCard } from "@/components/SupplierCard";
import { suppliers } from "@/lib/mock-data";

export default function SuppliersPage() {
  return (
    <AppShell title="Suppliers" subtitle="Palengke & wholesale">
      <ul className="space-y-4">
        {suppliers.map((supplier) => (
          <li key={supplier.id}>
            <SupplierCard supplier={supplier} />
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
