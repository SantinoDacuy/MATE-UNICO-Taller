# 📋 PLAN COMPLETO: SISTEMA DE REVIEWS Y OPINIONES
## Mate Único - Refactorización Fase 4

**Fecha:** Abril 2026  
**Objetivo:** Implementar un sistema dinámico y funcional de reseñas/opiniones con validación de compra  
**Tecnología:** React Frontend + Node.js/Express Backend + PostgreSQL

---

## 🎯 VISIÓN GENERAL

Transformar la sección estática de "Opiniones" en un sistema CRUD completo donde:
- ✅ Solo usuarios que **compraron** pueden dejar opinión
- ✅ **Un review por producto por usuario** (no duplicados)
- ✅ Máximo **3 opiniones visibles** con **blur en 4ta**
- ✅ **Modal** para ver todas las opiniones
- ✅ **Calificación 1-5 estrellas** interactiva
- ✅ **Average rating** calculado en backend
- ✅ **Validación de sesión** requerida

---

## 📁 ARCHIVOS CREADOS (Frontend)

### 1. **front/src/components/StarRating.jsx**
**Descripción:** Componente interactivo de estrellas 1-5

**Características:**
- Props: `rating` (valor actual), `onChange` (callback), `readOnly` (modo lectura), `size` ('small'|'normal'|'large')
- Click en estrella selecciona rating
- Hover preview del rating antes de confirmar
- Uso en: ReviewForm (selección) y ReviewsSection/ReviewsModal (display)

**Código destacado:**
```jsx
{[1, 2, 3, 4, 5].map((starValue) => (
    <span
        key={starValue}
        onClick={() => !readOnly && onChange(starValue)}
        style={{ cursor: readOnly ? 'default' : 'pointer' }}
    >
        {/* Star logic aquí */}
    </span>
))}
```

---

### 2. **front/src/components/StarRating.css**
**Estilos:** Gold stars (#ffc107), hover effects, responsive sizing

---

### 3. **front/src/components/ReviewForm.jsx**
**Descripción:** Formulario para dejar opinión (gated por compra)

**Lógica:**
1. En `useEffect`, hace GET a `/api/reviews/can-review?productId=X&productType=Y` con credentials
2. Si `canReview: false`, muestra mensaje bloqueado
3. Si `canReview: true`, habilita formulario con:
   - Campo título (máx 100 chars)
   - TextArea contenido (máx 500 chars)
   - StarRating para seleccionar calificación
4. Submit: POST a `/api/reviews` con {productId, productType, titulo, contenido, calificacion}
5. Success: Limpia form y llama `onReviewSubmitted()` callback

**Props:**
- `productId` (string: strapi documentId)
- `productType` ('producto'|'combo')
- `onReviewSubmitted` (callback function)

---

### 4. **front/src/components/ReviewForm.css**
**Estilos:** Form inputs, textarea con focus states, botón submit, mensajes de error/success

---

### 5. **front/src/components/ReviewsSection.jsx**
**Descripción:** Display principal de opiniones (3 límite + blur 4ta)

**Lógica:**
1. `useEffect` fetch GET `/api/reviews?productId=X&productType=Y`
2. Calcula `averageRating` del response
3. Muestra header con rating promedio ⭐
4. `visibleReviews = reviews.slice(0, 3)` (primeras 3)
5. Si hay 4+ reviews, 4ta tiene `className="review-card-blur"`
6. Botón "Ver Más Opiniones" abre ReviewsModal
7. ReviewForm integrado para dejar nueva opinión

**Props:**
- `productId` (string)
- `productType` ('producto'|'combo')

---

### 6. **front/src/components/ReviewsSection.css**
**Estilos:** 
- Grid de reviews
- Blur overlay gradient (transparente → blanco)
- Review card con hover
- Responsive breakpoints (768px, 480px)

---

### 7. **front/src/components/ReviewsModal.jsx**
**Descripción:** Modal fullscreen con todas las opiniones + sorting

**Lógica:**
1. Props: `reviews` array, `isOpen` boolean, `onClose` callback
2. Tres opciones sort:
   - "Más recientes" (fecha_creacion DESC)
   - "Rating más alto" (calificacion DESC)
   - "Rating más bajo" (calificacion ASC)
3. Usa StarRating para mostrar cada rating
4. Overlay con backdrop-filter blur(4px)
5. SlideUp animation en entrada

---

### 8. **front/src/components/ReviewsModal.css**
**Estilos:** Overlay, backdrop blur, modal box, animations

---

## 📝 ARCHIVOS MODIFICADOS (Frontend)

### **front/src/pages/ProductPage.jsx**
**Cambios:**
1. **Línea 5:** Agregar import
   ```jsx
   import ReviewsSection from '../components/ReviewsSection';
   ```

2. **Buscar la sección de reviews vacía:**
   ```jsx
   <section className="reviews-section">
     <h2>Opiniones</h2>
   </section>
   ```

3. **Reemplazar por:**
   ```jsx
   <section className="reviews-section">
     <ReviewsSection productId={id} productType="producto" />
   </section>
   ```

**Notas:**
- `id` viene de `const { id } = useParams()` (ya existe)
- `productType` siempre es "producto" aquí (para combos sería "combo")

---

## 🔧 CAMBIOS EN BACKEND

### **back-auth/index.js**

#### **1. Nueva función helper (línea ~250):**
```javascript
const getProductIdFromDocumentId = async (documentId) => {
    try {
        // Intento 1: Si es número, buscar directo en Producto
        const numId = parseInt(documentId, 10);
        if (!isNaN(numId)) {
            let result = await db.query(
                `SELECT id FROM "Producto" WHERE id = $1 LIMIT 1`,
                [numId]
            );
            if (result.rows.length > 0) {
                console.log(`✓ Producto encontrado por ID directo: ${numId}`);
                return numId;
            }
        }
        
        // Intento 2: Buscar en strapi_producto_map usando documentId
        let result = await db.query(
            `SELECT producto_id FROM strapi_producto_map 
             WHERE strapi_document_id = $1 LIMIT 1`,
            [documentId]
        );
        
        if (result.rows.length > 0 && result.rows[0].producto_id) {
            console.log(`✓ Producto encontrado vía strapi_producto_map: ${result.rows[0].producto_id}`);
            return result.rows[0].producto_id;
        }
        
        console.warn(`⚠️ No se encontró Producto para documentId: ${documentId}`);
        return null;
    } catch (err) {
        console.error('Error mapeando documentId:', err);
        return null;
    }
};
```

**Propósito:** Convierte strapi documentId → id_producto de PostgreSQL usando tabla `strapi_producto_map`

---

#### **2. Endpoint GET /api/reviews/can-review**

**URL:** `GET /api/reviews/can-review?productId=XXX&productType=producto`

**Lógica:**
1. Verificar sesión (`req.session.userId`)
2. Mapear documentId a id_producto con `getProductIdFromDocumentId(productId)`
3. Consultar compra (JOIN venta + detalle_venta) sin estado 'Pendiente'
4. Consultar duplicado en tabla reseña
5. Retornar:
   ```json
   { "canReview": true }
   // O
   { "canReview": false, "message": "🔒 Debes comprar este producto..." }
   ```

---

#### **3. Endpoint GET /api/reviews**

**URL:** `GET /api/reviews?productId=XXX&productType=producto`

**Lógica:**
1. Mapear documentId a id_producto
2. SELECT reseñas con JOIN a Usuario para nombre
3. Calcular `averageRating` = SUM(calificacion) / COUNT
4. Retornar:
   ```json
   {
       "success": true,
       "reviews": [
           {
               "id": 1,
               "titulo": "Excelente",
               "contenido": "Muy bueno...",
               "calificacion": 5,
               "fecha_creacion": "2026-04-09",
               "usuario_nombre": "Juan"
           }
       ],
       "averageRating": 4.5
   }
   ```

---

#### **4. Endpoint POST /api/reviews**

**URL:** `POST /api/reviews`

**Body:**
```json
{
    "productId": "o9g4qq37xo59nxnvrzstypfb",
    "productType": "producto",
    "titulo": "Excelente calidad",
    "contenido": "Un mate muy bien hecho...",
    "calificacion": 5
}
```

**Lógica:**
1. Verificar sesión
2. Validar campos (titulo, calificacion 1-5)
3. Mapear documentId a id_producto
4. Verificar compra (JOIN venta/detalle_venta)
5. Verificar no hay review anterior (UNIQUE constraint)
6. INSERT en tabla reseña con CURRENT_DATE
7. Retornar:
   ```json
   {
       "success": true,
       "reviewId": 42,
       "message": "Reseña guardada correctamente"
   }
   ```

---

## 🗄️ CAMBIOS EN BASE DE DATOS

### **TPFI-SQL/8-Reseñas.sql**

**Ejecutar en pgAdmin:**

```sql
CREATE TABLE IF NOT EXISTS reseña (
    id SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES Usuario(id) ON DELETE CASCADE,
    id_producto INT REFERENCES Producto(id) ON DELETE CASCADE,
    id_combo INT REFERENCES Combo(id) ON DELETE CASCADE,
    titulo VARCHAR(100) NOT NULL,
    contenido TEXT,
    calificacion INT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT check_product_or_combo CHECK (
        (id_producto IS NOT NULL AND id_combo IS NULL) OR
        (id_producto IS NULL AND id_combo IS NOT NULL)
    ),
    CONSTRAINT unique_user_product UNIQUE (id_usuario, id_producto),
    CONSTRAINT unique_user_combo UNIQUE (id_usuario, id_combo)
);

CREATE INDEX IF NOT EXISTS idx_reseña_producto ON reseña(id_producto);
CREATE INDEX IF NOT EXISTS idx_reseña_combo ON reseña(id_combo);
CREATE INDEX IF NOT EXISTS idx_reseña_usuario ON reseña(id_usuario);
CREATE INDEX IF NOT EXISTS idx_reseña_fecha ON reseña(fecha_creacion DESC);
```

**Lo que hace:**
- Crea tabla `reseña` con referencias a Usuario/Producto/Combo
- UNIQUE constraint: (id_usuario, id_producto) → una reseña por usuario/producto
- CHECK constraint: calificacion entre 1-5
- Índices para optimizar búsquedas

---

## ⚠️ PROBLEMA CONOCIDO & SOLUCIÓN

### **Error:** "Producto no encontrado"

**Causa:** Frontend envía strapi documentId, backend no lo mapea correctamente a id_producto

**Síntomas:**
- URL muestra: `/producto/o9g4qq37xo59nxnvrzstypfb`
- ReviewsSection devuelve: "⚠️ Producto no encontrado"
- Formulario bloqueado

**Solución ya implementada:**
1. Función `getProductIdFromDocumentId()` busca en `strapi_producto_map`
2. Intenta 3 formas (número directo → strapi_document_id → documentId)
3. Si aún falla → devuelve null → "Producto no encontrado"

**Si aún no funciona:**
- Verificar que `strapi_producto_map` tenga registros para el producto
- Query: `SELECT * FROM strapi_producto_map LIMIT 5;`
- Si está vacía, llena con datos desde Strapi

---

## 🧪 FLUJO END-TO-END DE PRUEBA

### **Paso 1: Usuario hace compra**
```
HomeCliente → ProductPage → Carrito → Mercado Pago → Compra exitosa
```

### **Paso 2: Usuario va a su perfil**
```
UserProfile → Click en "Mis Pedidos" → Navega a /historial-compras
```

### **Paso 3: Usuario abre producto comprado**
```
HistorialCompras → Click en un mate → ProductPage (ej: /producto/o9g4qq37xo59nxnvrzstypfb)
```

### **Paso 4: Sección Opiniones**
```
Baja en ProductPage → Ve ReviewsSection
- ✓ Si compró: Formulario habilitado
- ✓ Si no compró: Mensaje "🔒 Debes comprar"
- ✓ Si dejó review: Mensaje "✓ Ya dejaste opinión"
```

### **Paso 5: Submit opinión**
```
ReviewForm → Click "Enviar" → Backend valida → INSERT en reseña
→ Refetch GET /api/reviews → Aparece en ReviewsSection
```

### **Paso 6: Ver más opiniones**
```
Si hay 4+ opiniones:
- Primeras 3 normales
- 4ta borrosa (blur)
- Click "Ver Más Opiniones" → Modal abre
- En modal: Puede ordenar por reciente/rating alto/bajo
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

Para un compañero que baja el código:

- [ ] **BD creada:** Ejecutar `TPFI-SQL/8-Reseñas.sql` en pgAdmin
- [ ] **Tabla `strapi_producto_map` existe:** Verificar con `SELECT * FROM strapi_producto_map LIMIT 1;`
- [ ] **Backend actualizado:** `back-auth/index.js` tiene función `getProductIdFromDocumentId` y 3 endpoints `/api/reviews/*`
- [ ] **Frontend componentes creados:** 8 archivos en `front/src/components/` (Star*, Review*)
- [ ] **ProductPage actualizado:** Import + `<ReviewsSection productId={id} productType="producto" />`
- [ ] **Back-auth reiniciado:** `npm start` en `back-auth/`
- [ ] **Front reiniciado:** `npm run dev` en `front/`
- [ ] **Probar flujo:** Compra → Historial → ProductPage → ReviewsSection

---

## 🔗 REFERENCIAS CRUZADAS

### **Tabla reseña↔️Producto**
```
reseña.id_producto → Producto.id
```

### **Strapi↔️PostgreSQL**
```
Strapi documentId → strapi_producto_map.strapi_document_id → strapi_producto_map.producto_id → Producto.id
```

### **Validación de compra**
```
venta.id_usuario + detalle_venta.id_producto → Valida permiso para opinar
```

---

## 📞 SOPORTE RÁPIDO

**Problema:** "Producto no encontrado"
- Verificar: `SELECT COUNT(*) FROM strapi_producto_map WHERE strapi_document_id LIKE 'o9g4%';`
- Si = 0, faltan registros en strapi_producto_map

**Problema:** Formulario no aparece
- Check: ¿Ejecutó `TPFI-SQL/8-Reseñas.sql`?
- Check: ¿Backend levantó sin errores?
- Check: Console browser (F12) → Network → GET `/api/reviews/can-review`

**Problema:** "Ya dejaste opinión"
- Esperado si usuario ya opinó ese producto
- Query: `SELECT * FROM reseña WHERE id_usuario = X AND id_producto = Y;`

---

## 🎨 NOTAS ESTÉTICAS

✅ **NO cambiar:**
- Colores, fuentes, layout del CSS
- Estructura de componentes React
- HTML semantics

✅ **Personalizables:**
- Textos de mensajes (bloqueo, error, success)
- Estilos de botones (colores, padding)
- Animaciones (duración, ease)

---

**Versión:** 1.0  
**Última actualización:** Abril 2026
