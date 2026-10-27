// Limites de multimedia por diseño (fotos + video), compartidos entre el
// servidor (Server Actions) y los componentes de cliente del formulario.
export const MAX_DESIGN_IMAGES = 5;
export const MAX_VIDEO_MB = 50;
export const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;
export const MEDIA_BUCKET = "design-images";

// Los videos se suben a design-images/videos/<uuid>.<ext>. Solo se aceptan
// paths con esa forma al guardar el diseño, para que nadie pueda apuntar
// el video a otro archivo del bucket.
export const VIDEO_PATH_RE = /^videos\/[0-9a-f-]{36}\.(mp4|mov|webm|m4v)$/i;
