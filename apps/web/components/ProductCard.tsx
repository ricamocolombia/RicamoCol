import Image from "next/image";
import Link from "next/link";
import { currencyFormatter, GARMENT_LABELS, TECHNIQUE_LABELS } from "../lib/format";

export interface ProductCardData {
  slug: string;
  name: string;
  imageUrl: string | null;
  priceCop: number;
  garmentType: string;
  technique: string;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/catalogo/${product.slug}`}
      className="group block cursor-pointer"
    >
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-ricamo-bone">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-ricamo-black/15"
              aria-hidden="true"
            >
              <path d="M8 3 6 6H4a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2l-2-3H8Z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        )}
        <span className="absolute top-3 left-3 inline-block rounded-full bg-white/90 backdrop-blur px-3 py-1 text-xs font-semibold text-ricamo-black">
          {TECHNIQUE_LABELS[product.technique] ?? product.technique}
        </span>
      </div>
      <div className="mt-3">
        <p className="font-semibold text-sm leading-snug group-hover:text-ricamo-red transition-colors">
          {product.name}
        </p>
        <p className="text-xs text-ricamo-black/50 mt-0.5">
          {GARMENT_LABELS[product.garmentType] ?? product.garmentType}
        </p>
        <p className="text-sm font-bold mt-1">
          {currencyFormatter.format(product.priceCop)}
        </p>
      </div>
    </Link>
  );
}
