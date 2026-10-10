import React from "react";
import CentralOperationsHub from "../../components/admin/CentralOperationsHub";

export default function AdminCustomers() {
  return (
    <div className="space-y-6">
      <CentralOperationsHub initialTab="Marketing" />
    </div>
  );
}
