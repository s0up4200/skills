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
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());

  function toggleWishlist(id: string) {
    setWishlisted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="min-h-screen">
      {/* Mobile filter drawer backdrop */}
      {filtersOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setFiltersOpen(false)}
        />
      )}

      {/* Filter drawer — slides in on mobile, static sidebar on desktop */}
      <aside
        className={[
          "fixed top-0 left-0 h-full w-72 bg-white border-r p-4 space-y-6 z-30 transition-transform duration-300",
          "md:static md:w-60 md:translate-x-0 md:z-auto md:block md:shrink-0",
          filtersOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between md:block">
          <h2 className="font-semibold text-lg">Filters</h2>
          <button
            className="p-2 rounded-full hover:bg-gray-100 md:hidden"
            onClick={() => setFiltersOpen(false)}
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Category</h3>
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-2 text-sm py-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
              {cat}
            </label>
          ))}
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Price Range</h3>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              className="w-full px-3 py-2 border rounded text-sm"
              inputMode="numeric"
            />
            <span className="text-gray-400 self-center">-</span>
            <input
              type="number"
              placeholder="Max"
              className="w-full px-3 py-2 border rounded text-sm"
              inputMode="numeric"
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Availability</h3>
          <label className="flex items-center gap-2 text-sm cursor-pointer py-2">
            <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
            In stock only
          </label>
        </div>

        <button className="w-full py-3 bg-black text-white rounded text-sm font-medium active:bg-gray-800">
          Apply Filters
        </button>
      </aside>

      {/* Main content area */}
      <main className="flex flex-col md:flex-row">
        {/* Hidden spacer on desktop to account for sidebar */}
        <div className="hidden md:block w-60 shrink-0" />

        <div className="flex-1 p-4 md:p-6">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h1 className="text-xl md:text-2xl font-bold">All Products</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{products.length} items</span>
              {/* Filter toggle — mobile only */}
              <button
                className="flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium md:hidden active:bg-gray-50"
                onClick={() => setFiltersOpen(true)}
                aria-label="Open filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Product grid: 2 cols on mobile, 3 on md, 4 on lg */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {products.map((p) => (
              <div key={p.id} className="group relative border rounded-xl overflow-hidden">
                {/* Product image */}
                <div className="aspect-square bg-gray-100 relative">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Wishlist button — always visible on mobile, hover-only on desktop */}
                  <button
                    className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-sm md:opacity-0 md:group-hover:opacity-100 md:transition-opacity active:scale-95"
                    onClick={() => toggleWishlist(p.id)}
                    aria-label={wishlisted.has(p.id) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart
                      className={[
                        "w-4 h-4 transition-colors",
                        wishlisted.has(p.id) ? "fill-red-500 text-red-500" : "text-gray-700",
                      ].join(" ")}
                    />
                  </button>

                  {/* Out of stock badge */}
                  {!p.inStock && (
                    <div className="absolute bottom-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      Out of Stock
                    </div>
                  )}

                  {/* Desktop hover overlay with Quick View */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-3 hidden md:flex">
                    <button className="bg-white text-black rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-100">
                      Quick View
                    </button>
                  </div>
                </div>

                {/* Product info + Add to Cart */}
                <div className="p-3 space-y-2">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-sm text-gray-500">${p.price.toFixed(2)}</p>
                  <button
                    disabled={!p.inStock}
                    className={[
                      "w-full py-2.5 rounded-lg text-sm font-medium transition-colors",
                      p.inStock
                        ? "bg-black text-white active:bg-gray-800"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed",
                    ].join(" ")}
                  >
                    {p.inStock ? "Add to Cart" : "Out of Stock"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
