import React from "react";
import CustomInvoiceModal from "../invoice/CustomInvoiceModal";

export default function DeliveryInvoiceModal({
  order,
  existingInvoice,
  onClose,
  onSaved
}: {
  order: any;
  existingInvoice?: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <CustomInvoiceModal
      order={order}
      existingInvoice={existingInvoice}
      isAdmin={true}
      hide1688={true}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

