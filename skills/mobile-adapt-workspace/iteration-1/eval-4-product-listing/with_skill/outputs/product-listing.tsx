import { useState } from "react";
import { Heart, SlidersHorizontal, X } from "lucide-react";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
};

const products: Product[] = [
  { id: "p1", name: "Classic Running Shoe", price: 129.99, image: "/img/shoe-1.jpg", category: "Shoes", inStock: true },
  { id: "p2", name: "Wool Blend Overcoat", price: 249.00, image: "/img/coat-1.jpg", category: "Clothing", inStock: true },
  { id: "p3", name: "Leather Crossbody Bag", price: 89.50, image: "/img/bag-1.jpg", category: "Accessories", inStock: false },
  { id: "p4", name: "Slim Fit Chinos", price: 64.99, image: "/img/pants-1.jpg", category: "Clothing", inStock: true },
  { id: "p5", name: "Canvas Sneakers", price: 54.99, image: "/img/shoe-2.jpg", category: "Shoes", inStock: true },
  { id: "p6", name: "Quilted Vest", price: 119.00, image: "/img/vest-1.jpg", category: "Clothing", inStock: true },
  { id: "p7", name: "Aviator Sunglasses", price: 34.99, image: "/img/sun-1.jpg", category: "Accessories", inStock: true },
  { id: "p8", name: "Trail Hiking Boot", price: 189.99, image: "/img/boot-1.jpg", category: "Shoes", inStock: true },
];

const categories = ["Shoes", "Clothing", "Accessories", "Sale"];

export default function ProductListing() {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    // Use min-h-[100dvh] so the layout accounts for collapsing Safari toolbar
    <div className="flex min-h-[100dvh]">
      {/*
        DESKTOP: persistent sidebar
        MOBILE: hidden; accessible via the filter sheet triggered below
      */}
      <aside
        className={[
          // Always shown on md+ (desktop sidebar)
          "md:block md:w-60 md:border-r md:p-4 md:space-y-6 md:shrink-0 md:relative md:inset-auto md:z-auto md:bg-transparent",
          // On mobile: full-screen overlay sheet, slide up from bottom
          "fixed inset-0 z-40 bg-white overflow-y-auto p-6 space-y-6",
          filtersOpen ? "block" : "hidden",
        ].join(" ")}
        aria-label="Product filters"
      >
        {/* Mobile sheet header — close button with 44x44 tap target */}
        <div className="flex items-center justify-between md:hidden">
          <h2 className="font-semibold text-lg">Filters</h2>
          <button
            onClick={() => setFiltersOpen(false)}
            className="p-2.5 -mr-2 rounded-full hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop sidebar header */}
        <h2 className="hidden md:block font-semibold text-lg">Filters</h2>

        <div>
          <h3 className="text-sm font-medium mb-2">Category</h3>
          {categories.map((cat) => (
            // Each filter row is at least 44px tall for touch (Apple HIG / WCAG 2.5.5)
            <label
              key={cat}
              className="flex items-center gap-3 text-sm py-2.5 cursor-pointer min-h-[44px]"
            >
              {/*
                Checkbox enlarged to 20x20 with a visible touch area via padding.
                The label itself provides the full 44px tap target.
              */}
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-gray-300 shrink-0"
              />
              {cat}
            </label>
          ))}
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Price Range</h3>
          {/*
            Use type="text" + inputMode="decimal" instead of type="number".
            type="number" shows spinner arrows (UX antipattern for currency on mobile)
            and the value formatting can differ across browsers.
            inputMode="decimal" shows the numeric decimal keyboard on iOS/Android.
            enterKeyHint="next" lets users advance without dismissing the keyboard.
            font-size 16px on inputs prevents iOS Safari auto-zoom (inputs below
            16px trigger a viewport zoom that breaks the layout).
          */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              inputMode="decimal"
              enterKeyHint="next"
              placeholder="Min"
              className="flex-1 px-3 py-2.5 border rounded text-base min-h-[44px]"
              // font-size: 16px is intentional — prevents iOS auto-zoom
              style={{ fontSize: "16px" }}
            />
            <span className="text-gray-400 shrink-0">–</span>
            <input
              type="text"
              inputMode="decimal"
              enterKeyHint="done"
              placeholder="Max"
              className="flex-1 px-3 py-2.5 border rounded text-base min-h-[44px]"
              style={{ fontSize: "16px" }}
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Availability</h3>
          <label className="flex items-center gap-3 text-sm cursor-pointer min-h-[44px] py-2.5">
            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 shrink-0" />
            In stock only
          </label>
        </div>

        {/*
          Apply Filters CTA — full-width, 44px+ tall.
          On mobile it sits at the bottom of the sheet and scrolls with the content
          so it stays reachable without fighting position:fixed + keyboard issues
          (WebKit bug #202120: sticky/fixed bottom doesn't pin when keyboard is open).
        */}
        <button
          className="w-full py-3 bg-black text-white rounded text-sm font-medium
                     hover:bg-gray-800 active:bg-gray-900 min-h-[44px]"
          onClick={() => setFiltersOpen(false)}
        >
          Apply Filters
        </button>
      </aside>

      {/* Backdrop for mobile filter sheet */}
      {filtersOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setFiltersOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Product grid area */}
      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h1 className="text-2xl font-bold">All Products</h1>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{products.length} items</span>

            {/*
              Mobile-only "Filters" trigger button.
              Replaces the always-visible sidebar on phones.
              44x44 tap target via px-3 py-2.5 + icon + text.
            */}
            <button
              className="md:hidden flex items-center gap-1.5 px-3 py-2.5 border rounded-lg
                         text-sm font-medium min-h-[44px] min-w-[44px] active:bg-gray-50"
              onClick={() => setFiltersOpen(true)}
              aria-label="Open filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/*
          Grid: 4 columns on desktop → 2 columns on phones.
          2-column layout on a 390px screen gives ~185px per card —
          enough for a product image, name, price, and a real "Add to Cart" button.
          A 4-column grid at 390px gives ~90px cards that are unusable.
        */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {products.map((p) => (
            <div key={p.id} className="group relative border rounded-xl overflow-hidden">
              {/* Product image */}
              <div className="aspect-square bg-gray-100 relative">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />

                {/*
                  DESKTOP: hover overlay with Quick View + Add to Cart.
                  Hidden on touch devices (opacity-0, only shown on group-hover).
                  Touch devices get the always-visible card actions below instead.
                  This preserves the desktop hover experience without relying on it for mobile.
                */}
                <div
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100
                             transition-opacity hidden md:flex items-center justify-center gap-3"
                  aria-hidden="true"
                >
                  <button className="bg-white text-black rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-100">
                    Quick View
                  </button>
                  <button className="bg-white text-black rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-100">
                    Add to Cart
                  </button>
                </div>

                {/*
                  Wishlist button.
                  DESKTOP: hover-only (opacity-0 group-hover:opacity-100).
                  MOBILE: always visible (opacity-100) since there is no hover state on touch.
                  min-w/h ensures 44x44 tap target (Apple HIG, WCAG 2.5.5 AAA).
                  The original design used p-1.5 (~27px) — too small to reliably tap.
                */}
                <button
                  className="absolute top-2 right-2 p-2 bg-white/90 rounded-full
                             min-w-[44px] min-h-[44px] flex items-center justify-center
                             md:opacity-0 md:group-hover:opacity-100 md:transition-opacity
                             hover:bg-white active:scale-95"
                  aria-label={`Add ${p.name} to wishlist`}
                >
                  <Heart className="w-4 h-4" />
                </button>

                {/* Out of stock badge — always visible, no changes needed */}
                {!p.inStock && (
                  <div className="absolute bottom-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    Out of Stock
                  </div>
                )}
              </div>

              {/* Product info + mobile CTA */}
              <div className="p-3">
                {/*
                  Name: allow wrapping on mobile so long names don't get cut off.
                  truncate is preserved on md+ where card widths are fixed by the 4-col grid.
                  On the 2-col mobile grid each card is wider relative to text length,
                  but product names can still be long — clamp to 2 lines as a middle ground.
                */}
                <p className="text-sm font-medium line-clamp-2 md:truncate leading-snug">
                  {p.name}
                </p>
                <p className="text-sm text-gray-700 mt-1 tabular-nums">${p.price.toFixed(2)}</p>

                {/*
                  MOBILE-ONLY "Add to Cart" button — always visible below product info.
                  This is the fix for the core complaint: customers on phones can't add to cart
                  because the only Add to Cart path was locked behind hover.

                  Full-width, 44px tall, disabled + muted when out of stock.
                  Hidden on desktop (md:hidden) since desktop uses the hover overlay.

                  active:scale-[0.98] gives tactile press feedback on touch without
                  requiring a hover state.
                */}
                <button
                  disabled={!p.inStock}
                  className="md:hidden mt-2.5 w-full py-2.5 rounded-lg text-sm font-medium
                             min-h-[44px] transition-colors
                             bg-black text-white hover:bg-gray-800 active:bg-gray-900
                             active:scale-[0.98]
                             disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  aria-label={p.inStock ? `Add ${p.name} to cart` : `${p.name} is out of stock`}
                >
                  {p.inStock ? "Add to Cart" : "Out of Stock"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
