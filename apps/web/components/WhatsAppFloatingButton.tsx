import { buildWhatsAppLink } from "../lib/whatsapp";

// Boton flotante fijo en todas las paginas -- el color verde de WhatsApp se
// mantiene a proposito (no los colores de marca) porque es el reconocible
// universalmente como "abrir un chat de WhatsApp", incluso dentro de un
// sitio con otra identidad visual.
export function WhatsAppFloatingButton() {
  const href = buildWhatsAppLink("Hola, quiero saber más sobre Ricamo");

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 flex items-center justify-center hover:bg-[#1EBE5A] hover:scale-105 transition-[background-color,transform] duration-200 cursor-pointer"
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.33 4.96L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.9-4.45 9.9-9.92 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0 0 12.04 2Zm0 1.67c2.19 0 4.25.85 5.8 2.4a8.18 8.18 0 0 1 2.4 5.84c0 4.55-3.7 8.25-8.25 8.25a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.13.82.84-3.05-.2-.32a8.17 8.17 0 0 1-1.26-4.36c0-4.55 3.71-8.25 8.29-8.25Zm-4.6 4.35c-.17 0-.44.06-.67.32-.23.26-.87.85-.87 2.08s.9 2.42 1.02 2.58c.13.17 1.75 2.8 4.31 3.82 2.13.85 2.56.68 3.03.64.46-.04 1.49-.6 1.7-1.19.21-.58.21-1.08.15-1.19-.06-.1-.23-.17-.48-.29-.25-.13-1.49-.73-1.72-.82-.23-.08-.4-.13-.57.13-.17.26-.65.82-.8.98-.15.17-.29.19-.55.06-.25-.13-1.06-.39-2.02-1.25-.75-.66-1.25-1.48-1.4-1.73-.15-.26-.02-.4.11-.52.11-.11.25-.29.38-.44.13-.15.17-.26.25-.42.08-.17.04-.32-.02-.44-.06-.13-.55-1.36-.78-1.86-.2-.46-.41-.42-.57-.43h-.29Z" />
      </svg>
    </a>
  );
}
