import React from "react";
import { CustomizerSectionId } from "../../context/SiteSettingsContext";

interface LiveEditableSectionProps {
  sectionId: CustomizerSectionId;
  label: string;
  visible?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function LiveEditableSection({
  visible = true,
  children,
  className = "",
}: LiveEditableSectionProps) {
  if (!visible) {
    return null;
  }

  return <div className={className}>{children}</div>;
}
