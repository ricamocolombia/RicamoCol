-- Ricamo — un video por diseño (ademas de hasta 5 imagenes).
--
-- Para mostrar mas detalle de cada prenda en la web, cada diseño puede
-- tener un video corto. Se guarda como URL publica en el mismo bucket
-- design-images (carpeta videos/). El video se sube directo desde el
-- navegador del admin a Storage con una URL firmada (createSignedUploadUrl,
-- generada en una Server Action con la service_role key): un video pesa
-- mucho mas que el tope de ~4.5MB por request de Vercel, asi que no puede
-- pasar por una Server Action como las imagenes. El limite de 5 imagenes
-- se valida en las Server Actions del admin, no en SQL.

alter table designs add column video_url text;
