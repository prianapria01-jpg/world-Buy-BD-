import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product } from "../types";
import { useAuth } from "./AuthContext";

interface WishlistContextType {
  wishlist: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const localUser = localStorage.getItem("phone_user");
      if (!localUser) return [];
      const saved = localStorage.getItem("worldbuybd_wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load wishlist from localStorage", e);
      return [];
    }
  });

  // Global event listeners for immediate state reset
  useEffect(() => {
    const handleLogout = () => {
      setWishlist([]);
      try {
        localStorage.removeItem("worldbuybd_wishlist");
      } catch {}
    };

    const handleNewUser = () => {
      setWishlist([]);
      try {
        localStorage.removeItem("worldbuybd_wishlist");
      } catch {}
    };

    window.addEventListener("auth_logout", handleLogout);
    window.addEventListener("auth_new_user", handleNewUser);

    return () => {
      window.removeEventListener("auth_logout", handleLogout);
      window.removeEventListener("auth_new_user", handleNewUser);
    };
  }, []);

  // When user auth changes:
  useEffect(() => {
    if (!user) {
      // User is logged out: clear wishlist to zero
      setWishlist([]);
      try {
        localStorage.removeItem("worldbuybd_wishlist");
      } catch {}
      return;
    }

    if (user.isNewAccount) {
      // New account: zero wishlist
      setWishlist([]);
      try {
        localStorage.removeItem("worldbuybd_wishlist");
      } catch {}
      return;
    }

    // Existing customer: fetch their saved wishlist from server
    const identifier = user.id || user.uid || user.phoneNumber || user.phone || user.email;
    if (!identifier) return;

    fetch(`/api/users/${encodeURIComponent(identifier)}/cart-wishlist`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.wishlist)) {
          setWishlist(data.wishlist);
        } else {
          setWishlist([]);
        }
      })
      .catch((err) => console.warn("Failed to load user wishlist:", err));
  }, [user]);

  // Persist wishlist to localStorage and sync to server if logged in
  useEffect(() => {
    if (!user) {
      return;
    }

    try {
      localStorage.setItem("worldbuybd_wishlist", JSON.stringify(wishlist));
    } catch (e) {
      console.error("Failed to save wishlist to localStorage", e);
    }

    const identifier = user.id || user.uid || user.phoneNumber || user.phone || user.email;
    if (identifier) {
      const timer = setTimeout(() => {
        fetch("/api/users/sync-cart-wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id || user.uid,
            phone: user.phoneNumber || user.phone,
            email: user.email,
            wishlist
          })
        }).catch((err) => console.warn("Sync wishlist error:", err));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [wishlist, user]);

  const isInWishlist = (productId: string): boolean => {
    return wishlist.some((item) => item.id === productId || (item.offerId && item.offerId === productId));
  };

  const addToWishlist = (product: Product) => {
    setWishlist((prev) => {
      if (prev.some((item) => item.id === product.id || (product.offerId && item.offerId === product.offerId))) {
        return prev;
      }
      return [product, ...prev];
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== productId && item.offerId !== productId));
  };

  const toggleWishlist = (product: Product) => {
    if (isInWishlist(product.id) || (product.offerId && isInWishlist(product.offerId))) {
      removeFromWishlist(product.id);
      if (product.offerId) {
        removeFromWishlist(product.offerId);
      }
    } else {
      addToWishlist(product);
    }
  };

  const clearWishlist = () => setWishlist([]);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
        wishlistCount: wishlist.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
