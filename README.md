# 🧉 Mate Único - Proyecto E-Commerce

Este repositorio contiene el proyecto **"Mate Único"**, un sistema de e-commerce integral desarrollado para la cátedra de **Taller de Integración** (Licenciatura en Sistemas de Información, UADER - FCyT). 

La plataforma permite la gestión, venta y seguimiento de mates premium y accesorios, integrando tecnologías modernas de desarrollo web y pasarelas de pago reales.

---

### 👨‍💻 Integrantes del Equipo
* **Carballo Tobías**
* **Dacuy Santino**
* **Pereyra Lucrecia**

---

## 🛠️ Stack Tecnológico

El proyecto se basa en una arquitectura de servicios desacoplados para garantizar escalabilidad y facilidad de mantenimiento:

* **Frontend:** React (Vite) + JavaScript (JSX) + CSS3.
* **Backend Autenticación:** Node.js con Express.
* **CMS de Productos:** Strapi (Headless CMS).
* **Base de Datos:** PostgreSQL.
* **Pasarela de Pagos:** Mercado Pago API (Checkout Pro).
* **Servidor de Túnel:** ngrok (para pruebas de Webhooks locales).

---

## 🚀 Funcionalidades Principales

### 🛒 Experiencia de Usuario
* **Catálogo Dinámico:** Productos gestionados desde Strapi con imágenes y stock real.
* **Carrito Híbrido:** Permite agregar productos como invitado y sincroniza con la cuenta al iniciar sesión.
* **Gestión de Favoritos:** Guardado de productos preferidos vinculado al perfil de usuario.
* **Historial de Compras:** Visualización detallada de pedidos anteriores con estados de envío y venta.

### 🔐 Seguridad y Negocio
* **Autenticación:** Registro y login seguro de usuarios.
* **Validación de Stock "Just-in-Time":** El sistema verifica el stock real en Strapi antes de redirigir a Mercado Pago.
* **Cierre de Ciclo de Vida:** Los pedidos en estado "Entregado" se bloquean para evitar modificaciones accidentales.
* **Triggers de Base de Datos:** Protecciones en PostgreSQL (PL/pgSQL) para evitar la eliminación ilegal de facturas/ventas.

---

## 📂 Estructura del Proyecto

* `/front`: Aplicación React con toda la lógica de interfaz y consumo de APIs.
* `/back-auth`: Servidor Node.js que maneja usuarios, la DB Postgres y el Webhook de Mercado Pago.
* `/back`: Configuración y controladores de Strapi para el contenido.

---

## 🔧 Guía de Instalación

### 1. Prerrequisitos
* Node.js (v18+)
* PostgreSQL 15+
* Cuenta de Desarrollador en Mercado Pago.

### 2. Configuración de Base de Datos
1. Crea una base de datos llamada `mate-unico`.
2. Ejecuta el archivo `SQL-principal.sql` disponible en la raíz del proyecto para generar tablas, dominios y triggers.

### 3. Backend (Auth)
```bash
cd back-auth
npm install
# Configurar archivo .env con credenciales de DB y MP
npm run dev
```

### 4. Sttrapi (CMS)
```bash
cd back
npm install
npm run develop
```

### 5. Frontend
```bash
cd front
npm install
npm run dev
```
