# Ricamo — Contexto del negocio

## Qué es
Ricamo es una marca de bordados y estampados personalizados en camisetas y buzos, liderada por **Maria Jose Ruiz**, quien también es influencer y usa su imagen personal como el principal motor de ventas.

## Cómo opera hoy (antes de la plataforma)
1. Maria Jose publica en redes sociales (su marca personal vende).
2. El cliente escribe por WhatsApp para cerrar el pedido.
3. Si es personalizado: el cliente envía el detalle de lo que quiere.
4. Maria Jose diseña y envía el diseño al cliente para aprobación.
5. Una vez aprobado, envía el diseño a la **maquiladora** (empresa externa que imprime/borda).
6. La maquiladora estampa/borda sobre camisetas o buzos que Ricamo suministra o compra a proveedores de prendas en blanco.
7. Ricamo no tiene producción propia: todo el proceso físico (impresión, bordado, prendas en blanco) es tercerizado.

## Modelo de negocio de la plataforma
- **Ecommerce**: catálogo de productos con pago en línea + flujo de personalizados que termina en WhatsApp (cotizador web → resumen prellenado → WhatsApp). Ver [[Decisiones]].
- **App admin**: gestión integral (ventas, compras, inventario, cuentas por cobrar/pagar, bancos, proveedores, domiciliarios, banco de diseños).
- **Integración**: las ventas del ecommerce se registran automáticamente en la app; los diseños nuevos cargados en la app se pueden publicar al ecommerce con un clic.

## Identidad de marca
- Logo recibido el 2026-08-27: isotipo de carita feliz dibujada a mano + wordmark "Ricamo", tagline **"Lo creas, lo llevas"**. Dos versiones (fondo negro/logo amarillo y fondo amarillo/logo negro). Colores tomados a ojo: amarillo `#F5C518`, negro `#0A0A0A` (ver `packages/ui/src/tokens.ts` en el repo de código). Rojo sigue siendo un acento no confirmado.
- Maria Jose Ruiz es la cara de la marca — la web debe darle protagonismo como marca personal (bio, redes, historia).

## Instagram (@ricamo_col) — referencia de marca y catálogo real
Visto el 2026-08-27: https://www.instagram.com/ricamo_col/
- 27,9 mil seguidores, 454 publicaciones — cuenta con tracción real, no un negocio nuevo sin validar.
- Bio: "RICAMO | Camisetas personalizadas" — categoría "Tienda de ropa". Bullets: "Bordamos y estampamos tus ideas", "Camisetas, hoodies y personalizados", "Medellín | Envíos a toda Colombia 🇨🇴".
- **Ubicación: Medellín, con envíos a toda Colombia** — dato útil para logística/domiciliarios vs. envíos nacionales en la app admin.
- "Hoodies" en el lenguaje de Instagram = "buzo" en el modelo de datos (`garment_type` ya cubre `camiseta`/`buzo`, consistente).
- Numero de WhatsApp visible en un reel: **3216245987** (formato local, sin indicativo — asumir +57). Es el mismo canal de "Mensaje" del perfil (`wa.me/message/JQUBLUWFW4PSO1`). Candidato a `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- Línea de producto visible en el feed, útil para pensar el catálogo/tags de diseño:
  - **Camisetas de pareja personalizadas** ("Camiseta parejas", diseño estilo sello postal con fecha y elementos de la relación) — línea de producto específica que vale la pena modelar como categoría/tag, no solo "personalizado genérico".
  - **Orgullo regional / viajes**: camisetas con mapas estilo "Correos de Colombia" (ej. Chocó), colecciones de ciudad (Medellín, Corozal - Sucre) con íconos y lugares locales, flora y fauna colombiana ilustrada.
  - **Humor / pop cultura**: gráficos tipo meme con personajes ilustrados y frases (ej. "ME VALE MONDÁ").
  - Prendas predominantemente **oversized, en tonos crudo/beige y blanco**, con ilustración fina de línea (no estampado grande tipo poster).
  - También publica contenido no comercial (coyuntura/opinión, ej. incendios forestales) — la cuenta mezcla marca personal + causa social, no es solo catálogo.
- Estética visual del feed: bloques amarillos con texto en fuente script/serif negra para anuncios de producto — coherente con la paleta amarillo/negro ya tomada del logo.

## Pendiente de recibir del usuario
- Confirmar si el WhatsApp real del negocio es 3216245987 (+57) o si prefieren otro número.
- Archivos reales del logo (PNG/SVG) — ver `apps/web/public/brand/LEEME.md` en el repo de código; hex exacto si existe manual de marca.
- Definir pasarela de pago para Colombia (Wompi / MercadoPago / PayU).
- Dominio del sitio.
- Acceso completo a Instagram (login o export) si se quiere sincronizar contenido/catálogo real más allá de lo visible públicamente.

---
Ver también: [[Decisiones]], [[../02 Pendientes/Backlog|Backlog de pendientes]]
