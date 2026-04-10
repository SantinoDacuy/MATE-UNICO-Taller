import React, { useEffect } from 'react';
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
import HistorialCompras from './pages/HistorialCompras';
import FAQ from './pages/FAQ';
import Envios from './pages/Envios';
import QuienesSomos from './pages/QuienesSomos';

const Layout = () => {
  const location = useLocation();
  const hideHeaderFooter = location.pathname === '/login' || location.pathname === '/final';

  useEffect(() => {
    const routeTitles = {
      '/': 'Inicio | Mate Único',
      '/home': 'Inicio | Mate Único',
      '/productos': 'Productos | Mate Único',
      '/login': 'Iniciar Sesión | Mate Único',
      '/perfil': 'Mi Perfil | Mate Único',
      '/carrito': 'Mi Carrito | Mate Único',
      '/direccion-pago': 'Dirección de Envío | Mate Único',
      '/pago-envio': 'Método de Envío | Mate Único',
      '/pago-tarjeta': 'Pago | Mate Único',
      '/final': 'Compra Exitosa | Mate Único',
      '/favoritos': 'Mis Favoritos | Mate Único',
      '/historial-compras': 'Mis Compras | Mate Único',
      '/faq': 'Preguntas Frecuentes | Mate Único',
      '/envios': 'Envíos | Mate Único',
      '/quienes-somos': 'Quiénes Somos | Mate Único',
    };

    if (location.pathname.startsWith('/producto/')) {
      document.title = 'Producto | Mate Único';
    } else {
      document.title = routeTitles[location.pathname] || 'Mate Único';
    }
  }, [location]);

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
        <Route path="/historial-compras" element={<HistorialCompras />} />
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
