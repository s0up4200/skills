import { Heart } from "lucide-react";

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
  return (
    <div className="flex min-h-screen">
      {/* Sidebar filters — always visible */}
      <aside className="w-60 border-r p-4 space-y-6 shrink-0">
        <h2 className="font-semibold text-lg">Filters</h2>

        <div>
          <h3 className="text-sm font-medium mb-2">Category</h3>
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
              <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300" />
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
              className="w-20 px-2 py-1 border rounded text-sm"
            />
            <span className="text-gray-400 self-center">-</span>
            <input
              type="number"
              placeholder="Max"
              className="w-20 px-2 py-1 border rounded text-sm"
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Availability</h3>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300" />
            In stock only
          </label>
        </div>

        <button className="w-full py-1.5 bg-black text-white rounded text-sm hover:bg-gray-800">
          Apply Filters
        </button>
      </aside>

      {/* Product grid */}
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">All Products</h1>
          <span className="text-sm text-gray-500">{products.length} items</span>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {products.map((p) => (
            <div key={p.id} className="group relative border rounded-xl overflow-hidden">
              {/* Product image */}
              <div className="aspect-square bg-gray-100 relative">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />

                {/* Hover overlay with actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button className="bg-white text-black rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-100">
                    Quick View
                  </button>
                  <button className="bg-white text-black rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-100">
                    Add to Cart
                  </button>
                </div>

                {/* Wishlist heart — hover only */}
                <button className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                  <Heart className="w-4 h-4" />
                </button>

                {/* Out of stock badge */}
                {!p.inStock && (
                  <div className="absolute bottom-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    Out of Stock
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className="p-3">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">${p.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
