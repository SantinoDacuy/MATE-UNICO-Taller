import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import './components/styles.css';
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
import Favoritos from './pages/Favoritos';
import FAQ from './pages/FAQ';
import Envios from './pages/Envios';
import QuienesSomos from './pages/QuienesSomos';

const Layout = () => {
  const location = useLocation();
  const hideHeaderFooter = location.pathname === '/login';

  return (
    <>
      {!hideHeaderFooter && <Header />}
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
        <Route path="/favoritos" element={<Favoritos />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/envios" element={<Envios />} />
        <Route path="/quienes-somos" element={<QuienesSomos />} />
      </Routes>
      {!hideHeaderFooter && <Footer />}
    </>
  );
};

const App = () => {
  return (
    <CartProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </CartProvider>
  );
};

export default App;