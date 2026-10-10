import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CartItem, Product } from "../types";
import { useAuth } from "./AuthContext";

export interface SavedCartItem extends CartItem {
  savedAt?: string;
  reason?: string;
}

interface CartContextType {
  cart: CartItem[];
  savedCartItems: SavedCartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    variantName?: string,
    variantPrice?: number,
    variantImage?: string,
    variantSkuId?: string
  ) => void;
  removeFromCart: (cartItemId: string, archive?: boolean) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: (archive?: boolean) => void;
  saveToSavedCart: (item: CartItem, reason?: string) => void;
  removeFromSavedCart: (cartItemId: string) => void;
  clearSavedCart: () => void;
  restoreToCart: (item: CartItem | SavedCartItem) => void;
  restoreAllToCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      // If no active user session, initialize clean
      const localUser = localStorage.getItem("phone_user");
      if (!localUser) return [];
      const saved = localStorage.getItem("myshop_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [savedCartItems, setSavedCartItems] = useState<SavedCartItem[]>(() => {
    try {
      const localUser = localStorage.getItem("phone_user");
      if (!localUser) return [];
      const saved = localStorage.getItem("myshop_saved_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Global event listeners for immediate state reset
  useEffect(() => {
    const handleLogout = () => {
      setCart([]);
      setSavedCartItems([]);
      try {
        localStorage.removeItem("myshop_cart");
        localStorage.removeItem("myshop_saved_cart");
      } catch {}
    };

    const handleNewUser = () => {
      setCart([]);
      setSavedCartItems([]);
      try {
        localStorage.removeItem("myshop_cart");
        localStorage.removeItem("myshop_saved_cart");
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
      // User is logged out: completely clear cart and saved items
      setCart([]);
      setSavedCartItems([]);
      try {
        localStorage.removeItem("myshop_cart");
        localStorage.removeItem("myshop_saved_cart");
      } catch {}
      return;
    }

    // If newly created account: start 100% fresh and clean with 0 items
    if (user.isNewAccount) {
      setCart([]);
      setSavedCartItems([]);
      try {
        localStorage.removeItem("myshop_cart");
        localStorage.removeItem("myshop_saved_cart");
      } catch {}
      return;
    }

    // Existing customer: load their saved personal cart from database
    const identifier = user.id || user.uid || user.phoneNumber || user.phone || user.email;
    if (!identifier) return;

    fetch(`/api/users/${encodeURIComponent(identifier)}/cart-wishlist`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.cart)) {
          setCart(data.cart);
        } else {
          setCart([]);
        }
      })
      .catch((err) => console.warn("Failed to load user cart:", err));
  }, [user]);

  // Persist cart to localStorage and sync to server if logged in
  useEffect(() => {
    if (!user) {
      return;
    }

    try {
      localStorage.setItem("myshop_cart", JSON.stringify(cart));
      localStorage.setItem("myshop_saved_cart", JSON.stringify(savedCartItems));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
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
            cart
          })
        }).catch((err) => console.warn("Sync cart error:", err));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cart, savedCartItems, user]);

  const addToCart = (
    product: Product,
    quantity = 1,
    variantName?: string,
    variantPrice?: number,
    variantImage?: string,
    variantSkuId?: string
  ) => {
    const cleanCode = String(product.offerId || product.id || "").replace(/^abb-/, "");
    const resolvedUrl =
      product.importedUrl ||
      (cleanCode ? `https://worldbuybd.web.app/product/abb-${cleanCode}` : "");
    const safeProduct: Product = {
      ...product,
      importedUrl: resolvedUrl || product.importedUrl
    };

    setCart((prev) => {
      // Create a unique cart item ID combining product ID and variant name
      const cartItemId = variantName ? `${product.id}-${variantName}` : product.id;
      const existing = prev.find((item) => item.cartItemId === cartItemId || (!item.cartItemId && item.id === product.id && item.variantName === variantName));
      
      if (existing) {
        return prev.map((item) =>
          (item.cartItemId === cartItemId || (!item.cartItemId && item.id === product.id && item.variantName === variantName)) 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { 
        ...safeProduct, 
        quantity, 
        variantName, 
        variantImage: variantImage || safeProduct.image,
        variantSkuId,
        image: variantImage || safeProduct.image,
        price: variantPrice !== undefined ? variantPrice : safeProduct.price,
        cartItemId 
      }];
    });
  };

  const saveToSavedCart = (item: CartItem, reason = "Saved for later") => {
    setSavedCartItems((prev) => {
      const targetId = item.cartItemId || item.id;
      const filtered = prev.filter((it) => (it.cartItemId || it.id) !== targetId);
      return [
        {
          ...item,
          savedAt: new Date().toISOString(),
          reason
        },
        ...filtered
      ];
    });
  };

  const removeFromCart = (cartItemId: string, archive = true) => {
    setCart((prev) => {
      const removed = prev.find((item) => item.cartItemId === cartItemId || item.id === cartItemId);
      if (removed && archive) {
        saveToSavedCart(removed, "Removed from active cart");
      }
      return prev.filter((item) => item.cartItemId !== cartItemId && item.id !== cartItemId);
    });
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) => (item.cartItemId === cartItemId || item.id === cartItemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = (archive = false) => {
    if (archive && cart.length > 0) {
      setSavedCartItems((prev) => {
        const existingIds = new Set(prev.map((it) => it.cartItemId || it.id));
        const newArchived = cart
          .filter((it) => !existingIds.has(it.cartItemId || it.id))
          .map((it) => ({
            ...it,
            savedAt: new Date().toISOString(),
            reason: "Archived from cleared cart"
          }));
        return [...newArchived, ...prev];
      });
    }
    setCart([]);
    localStorage.removeItem("myshop_cart");
  };

  const removeFromSavedCart = (cartItemId: string) => {
    setSavedCartItems((prev) => prev.filter((item) => (item.cartItemId || item.id) !== cartItemId));
  };

  const clearSavedCart = () => {
    setSavedCartItems([]);
    localStorage.removeItem("myshop_saved_cart");
  };

  const restoreToCart = (item: CartItem | SavedCartItem) => {
    addToCart(item, item.quantity || 1, item.variantName, item.price, item.variantImage || item.image, item.variantSkuId);
    removeFromSavedCart(item.cartItemId || item.id);
  };

  const restoreAllToCart = () => {
    savedCartItems.forEach((item) => {
      addToCart(item, item.quantity || 1, item.variantName, item.price, item.variantImage || item.image, item.variantSkuId);
    });
    clearSavedCart();
  };

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        savedCartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        saveToSavedCart,
        removeFromSavedCart,
        clearSavedCart,
        restoreToCart,
        restoreAllToCart,
        cartTotal,
        cartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
