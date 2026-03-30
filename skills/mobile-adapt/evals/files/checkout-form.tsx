export default function CheckoutForm() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <form className="space-y-8">
        {/* Shipping info — two column layout */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">First Name</label>
              <input type="text" className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-medium">Last Name</label>
              <input type="text" className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Street Address</label>
              <input type="text" className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-medium">City</label>
              <input type="text" className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-medium">ZIP Code</label>
              <input type="number" className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <input type="text" className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="(555) 123-4567" />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input type="email" className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
          </div>
        </section>

        {/* Payment info — two column layout */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Payment</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium">Card Number</label>
              <input type="text" className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="1234 5678 9012 3456" />
            </div>
            <div>
              <label className="text-sm font-medium">Expiry Date</label>
              <input type="text" placeholder="MM/YY" className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-medium">CVV</label>
              <input type="number" className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="123" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Tip Amount</label>
              <input type="number" step="0.01" className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="0.00" />
            </div>
          </div>
        </section>

        {/* Order summary */}
        <section className="bg-gray-50 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span>Subtotal</span>
              <span className="tabular-nums">$149.99</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>Shipping</span>
              <span className="tabular-nums">$9.99</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>Tax</span>
              <span className="tabular-nums">$12.80</span>
            </div>
            <div className="flex justify-between py-2 font-bold text-lg">
              <span>Total</span>
              <span className="tabular-nums">$172.78</span>
            </div>
          </div>
        </section>

        {/* Fixed bottom submit — hidden by keyboard on iOS */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-lg font-medium text-lg"
          >
            Pay $172.78
          </button>
        </div>
      </form>
    </div>
  );
}
