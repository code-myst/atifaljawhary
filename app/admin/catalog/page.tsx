"use client";

import { useState } from "react";
import ProductsManager from "@/components/admin/ProductsManager";
import ProjectsManager from "@/components/admin/ProjectsManager";
import { PageHeader, SubTabs } from "@/components/admin/ui";

export default function CatalogPage() {
  const [tab, setTab] = useState<"projects" | "products">("projects");

  return (
    <>
      <PageHeader title="Catalog" subtitle="Your portfolio work and shop products" />
      <SubTabs
        tabs={[
          { id: "projects", label: "Projects" },
          { id: "products", label: "Products" },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "projects" ? <ProjectsManager /> : <ProductsManager />}
    </>
  );
}