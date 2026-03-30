export default function CheckoutForm() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 pb-28">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <form className="space-y-8">
        {/* Shipping info — single column on mobile, two column on larger screens */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">First Name</label>
              <input
                type="text"
                autoComplete="given-name"
                className="w-full mt-1 px-3 py-3 border rounded-lg text-base"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Last Name</label>
              <input
                type="text"
                autoComplete="family-name"
                className="w-full mt-1 px-3 py-3 border rounded-lg text-base"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Street Address</label>
              <input
                type="text"
                autoComplete="street-address"
                className="w-full mt-1 px-3 py-3 border rounded-lg text-base"
              />
            </div>
            <div>
              <label className="text-sm font-medium">City</label>
              <input
                type="text"
                autoComplete="address-level2"
                className="w-full mt-1 px-3 py-3 border rounded-lg text-base"
              />
            </div>
            <div>
              <label className="text-sm font-medium">ZIP Code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="postal-code"
                className="w-full mt-1 px-3 py-3 border rounded-lg text-base"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className="w-full mt-1 px-3 py-3 border rounded-lg text-base"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                className="w-full mt-1 px-3 py-3 border rounded-lg text-base"
              />
            </div>
          </div>
        </section>

        {/* Payment info — single column on mobile, two column on larger screens */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Payment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Card Number</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                className="w-full mt-1 px-3 py-3 border rounded-lg text-base"
                placeholder="1234 5678 9012 3456"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Expiry Date</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                className="w-full mt-1 px-3 py-3 border rounded-lg text-base"
              />
            </div>
            <div>
              <label className="text-sm font-medium">CVV</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-csc"
                className="w-full mt-1 px-3 py-3 border rounded-lg text-base"
                placeholder="123"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Tip Amount</label>
              <input
                type="text"
                inputMode="decimal"
                className="w-full mt-1 px-3 py-3 border rounded-lg text-base"
                placeholder="0.00"
              />
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

        {/* Submit button — inline in document flow so keyboard never covers it */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-black text-white py-4 rounded-lg font-medium text-lg"
          >
            Pay $172.78
          </button>
        </div>
      </form>
    </div>
  );
}
