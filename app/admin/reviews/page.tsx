"use client";

import { useState } from "react";
import { useAdmin } from "@/components/admin/AdminShell";
import ReviewsManager from "@/components/admin/ReviewsManager";
import TestimonialsManager from "@/components/admin/TestimonialsManager";
import { PageHeader, SubTabs } from "@/components/admin/ui";

export default function ReviewsPage() {
  const { pending } = useAdmin();
  const [tab, setTab] = useState<"reviews" | "testimonials">("reviews");

  return (
    <>
      <PageHeader title="Reviews" subtitle="Moderate reviews and manage testimonials" />
      <SubTabs
        tabs={[
          { id: "reviews", label: "Reviews", badge: pending.reviews },
          { id: "testimonials", label: "Testimonials" },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "reviews" ? <ReviewsManager /> : <TestimonialsManager />}
    </>
  );
}