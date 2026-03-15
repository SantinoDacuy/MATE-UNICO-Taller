import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('mateUnicoCart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // --- NUEVO: Estado global para el descuento ---
  const [descuento, setDescuento] = useState(() => {
    const savedDescuento = localStorage.getItem('mateUnicoDescuento');
    return savedDescuento ? Number(savedDescuento) : 0;
  });

  useEffect(() => {
    localStorage.setItem('mateUnicoCart', JSON.stringify(cart));
  }, [cart]);

  // --- NUEVO: Guardamos el descuento en memoria ---
  useEffect(() => {
    localStorage.setItem('mateUnicoDescuento', descuento);
  }, [descuento]);

  const addToCart = (producto, cantidad, color, grabado) => {
    setCart((prevCart) => {
      const itemIndex = prevCart.findIndex(
        (item) => item.id === producto.documentId && item.color === color && item.grabado === grabado
      );

      if (itemIndex !== -1) {
        const newCart = [...prevCart];
        newCart[itemIndex] = { 
          ...newCart[itemIndex], 
          cantidad: newCart[itemIndex].cantidad + cantidad 
        };
        return newCart;
      } else {
        return [
          ...prevCart,
          {
            id: producto.documentId,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagenes?.length > 0 ? producto.imagenes[0].url : null,
            cantidad: cantidad,
            color: color,
            grabado: grabado || 'Sin grabado'
          }
        ];
      }
    });
  };

  const removeFromCart = (id, color, grabado) => {
    setCart((prevCart) => prevCart.filter(
      (item) => !(item.id === id && item.color === color && item.grabado === grabado)
    ));
  };

  const clearCart = () => {
    setCart([]);
    setDescuento(0); // Si vaciamos el carrito, borramos el descuento también
  };

  const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  return (
    // EXPORTAMOS EL DESCUENTO PARA QUE LAS PANTALLAS LO PUEDAN USAR
    <CartContext.Provider value={{ 
      cart, addToCart, removeFromCart, clearCart, totalItems, totalPrice,
      descuento, setDescuento 
    }}>
      {children}
    </CartContext.Provider>
  );
};