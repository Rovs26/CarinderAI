"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SupplierCard } from "@/components/SupplierCard";
import { suppliers } from "@/lib/mock-data";

export default function SuppliersPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <AppShell title="Suppliers" subtitle="Palengke & wholesale">
      <ul className="space-y-4">
        {suppliers.map((supplier) => (
          <li key={supplier.id}>
            <SupplierCard
              supplier={supplier}
              selected={selectedId === supplier.id}
              onCreateOrder={() => setSelectedId(supplier.id)}
            />
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
