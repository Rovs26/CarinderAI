"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SupplierCard } from "@/components/SupplierCard";
import { suppliers } from "@/lib/mock-data";
import { setSelectedSupplier } from "@/lib/supplier-session";

export default function SuppliersPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleCreateOrder = (supplierId: string, supplierName: string) => {
    setSelectedSupplier({ id: supplierId, name: supplierName });
    setSelectedId(supplierId);
    router.push("/capture-order");
  };

  return (
    <AppShell title="Suppliers" subtitle="Palengke & wholesale">
      <ul className="space-y-4">
        {suppliers.map((supplier) => (
          <li key={supplier.id}>
            <SupplierCard
              supplier={supplier}
              selected={selectedId === supplier.id}
              onCreateOrder={() => handleCreateOrder(supplier.id, supplier.name)}
            />
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
