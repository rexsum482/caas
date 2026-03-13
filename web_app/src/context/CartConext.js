import { createContext, useContext, useEffect, useState } from "react";
import api from "../components/axios";
import { message } from "antd";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const loadCart = async () => {
    try {
      const res = await api.get("/cart/");
      setCart(res.data.items || []);
    } catch {
      console.error("Cart load failed");
    }
  };

  const addToCart = async (product, quantity = 1) => {
    try {
      await api.post("/cart/", {
        product_id: product.id,
        quantity
      });

      message.success(`${product.name} added to cart`);
      loadCart();
    } catch {
      message.error("Failed to add to cart");
    }
  };

  const removeFromCart = async (id) => {
    await api.delete(`/cart/${id}/`);
    loadCart();
  };

  useEffect(() => {
    loadCart();
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        loadCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
