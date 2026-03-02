import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import ProductPage from './pages/ProductPage';
import Home from './pages/Home';
import HomePage from './pages/HomePage';
import UserProfile from './pages/UserProfile';
import Carrito from './pages/Cart';
import PagoDireccion from './pages/PagoDireccion';
import PagoEnvio from './pages/PagoEnvio';
import PagoTarjeta from './pages/Pago-tarjeta';
import Final from './pages/Final';
import Login from './pages/HomePage';
import './App.css';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
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
  );
};

export default App;