import React, { useRef } from "react";
import { Camera, User } from "lucide-react";

interface StaffAvatarProps {
  name: string;
  avatar?: string;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  editable?: boolean;
  onPhotoChange?: (photoUrl: string) => void;
  statusBadge?: boolean;
}

const sizeClasses: Record<string, { container: string; text: string; icon: string }> = {
  xs: { container: "w-6 h-6", text: "text-[10px]", icon: "w-3 h-3" },
  sm: { container: "w-8 h-8", text: "text-xs", icon: "w-4 h-4" },
  md: { container: "w-10 h-10", text: "text-sm", icon: "w-5 h-5" },
  lg: { container: "w-12 h-12", text: "text-base", icon: "w-6 h-6" },
  xl: { container: "w-16 h-16", text: "text-lg", icon: "w-8 h-8" },
  "2xl": { container: "w-20 h-20", text: "text-xl", icon: "w-10 h-10" }
};

export default function StaffAvatar({
  name,
  avatar,
  className = "",
  size = "md",
  editable = false,
  onPhotoChange,
  statusBadge = false
}: StaffAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = React.useState(false);

  // Check if avatar is an image URL or base64 data
  const isImage = Boolean(
    avatar &&
    !imageError &&
    (avatar.startsWith("http://") ||
      avatar.startsWith("https://") ||
      avatar.startsWith("data:image/") ||
      avatar.startsWith("/") ||
      avatar.startsWith("blob:"))
  );

  const getInitials = (n: string) => {
    if (!n) return "WB";
    const parts = n.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be 5MB maximum");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result && onPhotoChange) {
        setImageError(false);
        onPhotoChange(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`relative inline-block shrink-0 ${currentSize.container} ${className}`}>
      <div
        className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold text-white shadow-xs border-2 border-white/80 bg-gradient-to-tr from-slate-700 via-slate-800 to-indigo-900 ${
          editable ? "group cursor-pointer" : ""
        }`}
        onClick={() => editable && fileInputRef.current?.click()}
        title={editable ? "Click to upload a new photo" : name}
      >
        {isImage ? (
          <img
            src={avatar}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className={`${currentSize.text} tracking-wider font-mono select-none`}>
            {getInitials(avatar || name)}
          </span>
        )}

        {/* Hover overlay if editable */}
        {editable && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-full text-white">
            <Camera className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Hidden file input */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      )}

      {/* Online / Active status badge */}
      {statusBadge && (
        <span
          className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-600/20"
          title="Active Officer"
        />
      )}
    </div>
  );
}
