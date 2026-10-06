"use client";

import { useState } from "react";
import { useAdmin } from "@/components/admin/AdminShell";
import OrdersManager from "@/components/admin/OrdersManager";
import RequestsManager from "@/components/admin/RequestsManager";
import { PageHeader, SubTabs } from "@/components/admin/ui";

export default function OrdersPage() {
  const { pending } = useAdmin();
  const [tab, setTab] = useState<"orders" | "requests">("orders");

  return (
    <>
      <PageHeader title="Orders" subtitle="Orders, payments and custom requests" />
      <SubTabs
        tabs={[
          { id: "orders", label: "Orders", badge: pending.orders },
          { id: "requests", label: "Custom requests", badge: pending.requests },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "orders" ? <OrdersManager /> : <RequestsManager />}
    </>
  );
}