import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import './App.css';
import ProductPage from './pages/ProductPage';
import Home from './pages/Home';
import HomePage from './pages/HomePage';
import Productos from './pages/Productos';
import UserProfile from './pages/UserProfile';
import Carrito from './pages/Cart';
import PagoDireccion from './pages/PagoDireccion';
import PagoEnvio from './pages/PagoEnvio';
import PagoTarjeta from './pages/Pago-tarjeta';
import Final from './pages/Final';
import Login from './pages/HomePage';


const App = () => {
  return (
    // ENVOLVEMOS TODO CON EL CARTPROVIDER
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/producto/:id?" element={<ProductPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<HomePage />} />
          <Route path="/perfil" element={<UserProfile />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/direccion-pago" element={<PagoDireccion />} />
          <Route path="/pago-envio" element={<PagoEnvio />} />
          <Route path="/pago-tarjeta" element={<PagoTarjeta />} />
          <Route path="/final" element={<Final />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
};

export default App;