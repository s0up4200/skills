export default function CheckoutForm() {
  return (
    // min-h-[100dvh]: dvh tracks the visual viewport (including keyboard collapse),
    // unlike old vh which is fixed. flex-col lets the footer stick to the bottom
    // of the content, scrolling naturally in the flow instead of being fixed.
    <div className="flex flex-col min-h-[100dvh]">
      {/* Scrollable form body */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        <form id="checkout-form" className="space-y-8">
          {/* Shipping info — single column on compact phones, two columns on md+ */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                {/* Label above field — no horizontal space on 390px for side labels */}
                <label className="block text-sm font-medium mb-1" htmlFor="first-name">
                  First Name
                </label>
                <input
                  id="first-name"
                  type="text"
                  // py-3 brings tap target to ~44px (12px*2 + 20px line-height).
                  // text-base (16px) prevents iOS Safari auto-zoom on focus.
                  className="w-full px-3 py-3 text-base border rounded-lg"
                  autoComplete="given-name"
                  enterKeyHint="next"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="last-name">
                  Last Name
                </label>
                <input
                  id="last-name"
                  type="text"
                  className="w-full px-3 py-3 text-base border rounded-lg"
                  autoComplete="family-name"
                  enterKeyHint="next"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1" htmlFor="street-address">
                  Street Address
                </label>
                <input
                  id="street-address"
                  type="text"
                  className="w-full px-3 py-3 text-base border rounded-lg"
                  autoComplete="street-address"
                  enterKeyHint="next"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  className="w-full px-3 py-3 text-base border rounded-lg"
                  autoComplete="address-level2"
                  enterKeyHint="next"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="zip">
                  ZIP Code
                </label>
                {/* type="text" + inputMode="numeric": shows number pad without
                    spinner arrows. type="number" is an antipattern for postal
                    codes — it strips leading zeros (e.g. 02134 → 2134). */}
                <input
                  id="zip"
                  type="text"
                  inputMode="numeric"
                  className="w-full px-3 py-3 text-base border rounded-lg"
                  autoComplete="postal-code"
                  enterKeyHint="next"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="phone">
                  Phone
                </label>
                {/* tel keyboard on mobile: includes +, *, # which numeric does not */}
                <input
                  id="phone"
                  type="tel"
                  className="w-full px-3 py-3 text-base border rounded-lg"
                  placeholder="(555) 123-4567"
                  autoComplete="tel"
                  enterKeyHint="next"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full px-3 py-3 text-base border rounded-lg"
                  autoComplete="email"
                  // Last field in the shipping section; next moves to card number
                  enterKeyHint="next"
                />
              </div>
            </div>
          </section>

          {/* Payment — single column on compact phones */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Payment</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1" htmlFor="card-number">
                  Card Number
                </label>
                {/* inputMode="numeric" surfaces the numeric pad.
                    autocomplete="cc-number" enables browser/password-manager autofill. */}
                <input
                  id="card-number"
                  type="text"
                  inputMode="numeric"
                  className="w-full px-3 py-3 text-base border rounded-lg"
                  placeholder="1234 5678 9012 3456"
                  autoComplete="cc-number"
                  enterKeyHint="next"
                  maxLength={19}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="expiry">
                  Expiry Date
                </label>
                <input
                  id="expiry"
                  type="text"
                  inputMode="numeric"
                  placeholder="MM/YY"
                  className="w-full px-3 py-3 text-base border rounded-lg"
                  autoComplete="cc-exp"
                  enterKeyHint="next"
                  maxLength={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="cvv">
                  CVV
                </label>
                {/* type="text" + inputMode="numeric" avoids spinner arrows that
                    type="number" adds — antipattern for security codes. */}
                <input
                  id="cvv"
                  type="text"
                  inputMode="numeric"
                  className="w-full px-3 py-3 text-base border rounded-lg"
                  placeholder="123"
                  autoComplete="cc-csc"
                  enterKeyHint="next"
                  maxLength={4}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1" htmlFor="tip">
                  Tip Amount
                </label>
                {/* inputMode="decimal" shows the decimal number pad — correct for
                    currency amounts. type="number" adds spinner arrows which are
                    an antipattern for money fields. enterKeyHint="done" signals
                    this is the last field before submission. */}
                <input
                  id="tip"
                  type="text"
                  inputMode="decimal"
                  className="w-full px-3 py-3 text-base border rounded-lg"
                  placeholder="0.00"
                  autoComplete="off"
                  enterKeyHint="done"
                />
              </div>
            </div>
          </section>

          {/* Order summary */}
          <section className="bg-gray-50 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-0">
              <div className="flex justify-between py-3 border-b">
                <span>Subtotal</span>
                <span className="tabular-nums whitespace-nowrap">$149.99</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span>Shipping</span>
                <span className="tabular-nums whitespace-nowrap">$9.99</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span>Tax</span>
                <span className="tabular-nums whitespace-nowrap">$12.80</span>
              </div>
              <div className="flex justify-between py-3 font-bold text-lg">
                <span>Total</span>
                <span className="tabular-nums whitespace-nowrap">$172.78</span>
              </div>
            </div>
          </section>
        </form>
      </div>

      {/* Submit footer — inline in flow, not position:fixed.
          WebKit bug #202120: position:fixed bottom:0 elements are hidden behind
          the iOS keyboard because the Layout Viewport does not shrink (only the
          Visual Viewport does). position:sticky bottom:0 also fails during
          keyboard display per the same bug.
          Fix: let this footer sit at the natural bottom of the scrollable
          content. When the keyboard opens, the user scrolls down to reach it —
          which is also what autoscroll-to-focused-field enables naturally.
          pb-[max(1rem,env(safe-area-inset-bottom))] ensures the button clears
          the home indicator (~34px on Face ID iPhones) when viewport-fit=cover
          is set in the viewport meta tag. */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t bg-white">
        <button
          type="submit"
          form="checkout-form"
          // h-12 = 48px — comfortably exceeds the 44px Apple HIG minimum tap target.
          // w-full ensures the target fills the available width on compact screens.
          className="w-full h-12 bg-black text-white rounded-lg font-medium text-base"
        >
          Pay $172.78
        </button>
      </div>
    </div>
  );
}
