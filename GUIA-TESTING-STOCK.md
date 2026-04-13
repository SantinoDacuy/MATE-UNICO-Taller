# 📋 Guía de Prueba: Sistema de Stock y Persistencia de Carrito

## 🎯 Objetivo
Verificar que el sistema maneja correctamente los escenarios de múltiples usuarios comprando simultáneamente el mismo producto con stock limitado.

---

## 🧪 Scenario de Prueba Principal

**Situación**: Mate Torpedo Feliciano tiene **1 unidad** en stock.

### 📍 Escenario 1: Dos usuarios agregan el mismo producto al carrito

#### Usuario A - Navegador 1 (Puerto 5173 normal)
```
1. Navega a Home
2. Agrega "Mate Torpedo Feliciano" (qty: 1) al carrito
3. Ve carrito → Debe ver "1 disponible"
4. Continúa checkout → Debe validar OK ✅
```

#### Usuario B - Navegador 2 (En privado o diferente perfil)
```
1. Abre http://localhost:5173 en modo privado (otro usuario)
2. Agrega "Mate Torpedo Feliciano" (qty: 1) al carrito
3. Ve carrito → Debe ver "1 disponible" (cada usuario tiene su localStorage)
4. Continúa checkout → TAMBIÉN debe validar OK por ahora
```

#### Usuario A - Finaliza Compra
```
5. Usuario A hace click en "Continuar al Envío" en PagoDireccion
6. Debe ver:
   - "Validando stock..." (botón deshabilitado)
   - ✅ "Stock verificado! Continuando..."
   - Redirigir a /pago-envio
7. Finalmente paga en Mercado Pago
8. ⚠️ En el webhook se DESCUENTA el stock en Strapi
```

#### Usuario B - ¿Qué sucede?
```
9. Usuario B hace click en "Continuar al Envío"
10. El sistema:
    - Valida stock desde backend → Stock = 0 (ya se compró)
    - Muestra error: "❌ 'Mate Torpedo Feliciano' ya no tiene stock"
    - ❌ NO permite continuar
    - Carrito se ajusta automáticamente
11. Usuario B ve en su carrito:
    - Producto tiene qty = 0
    - Imagen gris opaco 
    - Overlay "SIN STOCK"
    - Si intenta agregar más, no puede (stock = 0)
```

---

## 🔍 Escenarios Adicionales de Prueba

### Scenario 2: Cambio de Stock Mientras Está en Carrito
```
1. Usuario agrega 2 unidades de Mate X
2. Se va a otra página
3. Otro usuario compra las 2 últimas unidades
4. Usuario regresa al carrito
5. Al cargar, se ejecuta updateStockFromBackend():
   - Stock se obtiene del backend (stock = 0)
   - Automáticamente cantidad se ajusta a 0
   - Debe ver toast: "⚠️ Mate X ya no tiene stock"
```

### Scenario 3: Stock Disponible pero Menor que Cantidad
```
1. Usuario agrega 3 unidades de Mate X (inicialmente hay stock)
2. Alguien más compra 2 unidades
3. Ahora solo hay 1 disponible
4. Usuario va a checkout
5. Al validar:
   - Detecta que qty (3) > stock (1)
   - Muestra: "❌ 'Mate X' solo quedan 1 unidades"
   - Carrito se ajusta: cantidad = 1
   - Usuario debe reenviarel formulario para continuar
```

### Scenario 4: Visualización de "SIN STOCK" en Home
```
1. Mate Torpedo tiene stock = 0 (ya comprado)
2. Usuario navega a Home (/productos)
3. ProductCard del mate debe mostrar:
   - ✅ Imagen gris opaco (opacity: 0.35)
   - ✅ Overlay rojo diagonal: "SIN STOCK"
   - ✅ Texto rojo: "Sin Stock"
```

---

## 🛠️ Cómo Testear

### Opción A: Dos Navegadores (Recomendado)
```bash
# Terminal 1 - Frontend corriendo
npm run dev

# Terminal 2 - Abre URL en navegador 1
# http://localhost:5173

# Terminal 2 - En el MISMO navegador (diferente pestaña)
# Abre Developer Tools > Application > Storage
# Borra localStorage de "mateUnicoCart"
# Abre nueva pestaña http://localhost:5173 (otro usuario)
```

### Opción B: Inspeccionador y localStorage
```javascript
// En Console de Navegador 1:
localStorage.removeItem('mateUnicoCart');
// Ahora ese usuario tiene carrito vacío

// En Navegador 2:
// Normal, carrito con productos
```

### Opción C: Modo Privado
```bash
# Navegador 1: Normal
http://localhost:5173

# Navegador 2: Modo privado/incógnito
http://localhost:5173
# (localStorage es aislado en modo privado)
```

---

## 📊 Checklist de Validación

- [ ] ProductCard muestra imagen gris opaco cuando stock = 0
- [ ] ProductCard muestra overlay "SIN STOCK" diagonal rojo
- [ ] Al agregar producto al carrito se guarda el stock
- [ ] Al cargar `/carrito`, se refrescan todos los stocks
- [ ] En PagoDireccion, al click en "Continuar al Envío", valida stock
- [ ] Si stock < cantidad, muestra error específico
- [ ] Botón se desactiva mientras valida ("Validando stock...")
- [ ] Si OK, permite continuar a /pago-envio
- [ ] Si hay cambios de stock, carrito se ajusta automáticamente  
- [ ] Backend descuenta stock correctamente vía webhook
- [ ] Segundo usuario NO puede continuar si stock se agotó

---

## 🐛 Debugging

### Ver Logs en Backend
```bash
# En back-auth (terminal 1):
# Busca "[Stock Service]" para ver descuentos
# Busca "Webhook MP" para ver procesos de pago
```

### Ver Logs en Frontend
```javascript
// Consola del navegador (F12)
// Busca validateStock() logs
// Busca updateStockFromBackend() logs
```

### Verificar Stock en Strapi
```bash
http://127.0.0.1:1337/admin
# Content Manager > Productos > Selecciona uno
# Revisa el campo "stock"
```

---

## 💡 Esperado vs Actual

| Acción | Esperado | Actual |
|--------|----------|--------|
| Ver producto sin stock en Home | Imagen gris + overlay | 🔍 A testear |
| Agregar a carrito | Se guarda stock | 🔍 A testear |
| Cargar carrito | Se refrescan stocks | 🔍 A testear |
| Otro usuario compra | Se ve actualizado | 🔍 A testear |
| Validar antes de checkout | Bloquea si no hay stock | 🔍 A testear |
| Webhook de pago | Descuenta stock | 🔍 A testear |

---

## 📝 Notas Importantes

1. **localStorage es por navegador/pestaña**: Cada usuario simulado tiene su propio carrito aislado
2. **Stock real está en Strapi**: updateStockFromBackend() siempre obtiene de `http://localhost:1337/api/productos/{id}`
3. **Webhook es asincrónico**: El descuento en Strapi puede tardar 1-2 segundos, no es inmediato
4. **ProductCard se actualiza en Home**: Al navegar a Home, ver si ProductCard refleja stock = 0
