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
      const grabadoReal = grabado || 'Sin grabado';
      const itemIndex = prevCart.findIndex(
        (item) => item.id === producto.id && item.color === color && item.grabado === grabadoReal
      );

      if (itemIndex !== -1) {
        const newCart = [...prevCart];
        const stockDisponible = producto.stock || 0;
        const cantidadTotal = newCart[itemIndex].cantidad + cantidad;
        const cantidadFinal = Math.min(cantidadTotal, Math.max(0, stockDisponible));
        newCart[itemIndex] = { 
          ...newCart[itemIndex], 
          cantidad: cantidadFinal,
          stock: producto.stock || 0
        };
        return newCart;
      } else {
        return [
          ...prevCart,
          {
            id: producto.id,
            documentId: producto.documentId,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagenes?.length > 0 ? producto.imagenes[0].url : null,
            cantidad: cantidad,
            color: color,
            grabado: grabado || 'Sin grabado',
            stock: producto.stock || 0
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

  // --- NUEVA FUNCIÓN: Actualizar stock de items desde backend ---
  const updateStockFromBackend = async () => {
    try {
      const updatedCart = [...cart];
      
      for (let i = 0; i < updatedCart.length; i++) {
        const item = updatedCart[i];
        const res = await fetch(`http://localhost:1337/api/productos/${item.documentId}?fields=stock`);
        
        if (res.ok) {
          const data = await res.json();
          const nuevoStock = data.data?.stock ?? 0;
          updatedCart[i].stock = nuevoStock;
          
          // Si la cantidad supera el nuevo stock, ajustar automáticamente
          if (item.cantidad > nuevoStock) {
            updatedCart[i].cantidad = Math.max(1, nuevoStock);
          }
        }
      }
      
      setCart(updatedCart);
    } catch (error) {
      console.error('Error actualizando stock desde backend:', error);
    }
  };

  const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  return (
    // EXPORTAMOS EL DESCUENTO PARA QUE LAS PANTALLAS LO PUEDAN USAR
    <CartContext.Provider value={{ 
      cart, addToCart, removeFromCart, clearCart, totalItems, totalPrice,
      descuento, setDescuento, updateStockFromBackend 
    }}>
      {children}
    </CartContext.Provider>
  );
};