"use client";

export default function PricingPage() {
  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      description: "Perfect for getting started",
      features: ["10 generations per month", "Community support", "Basic features"],
      cta: "Get Started",
      highlight: false,
    },
    {
      id: "pro-monthly",
      name: "Pro",
      price: "$9.99",
      period: "/month",
      description: "For serious creators",
      features: ["Unlimited generations", "Priority support", "All features", "API access", "Advanced analytics"],
      cta: "Start Pro",
      highlight: true,
    },
    {
      id: "pro-annual",
      name: "Pro Annual",
      price: "$99.99",
      period: "/year",
      description: "Save 20% with annual billing",
      features: ["Unlimited generations", "Priority support", "All features", "API access", "Advanced analytics"],
      savings: "Save $19.81",
      cta: "Start Pro Annual",
      highlight: false,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Custom",
      description: "For teams and organizations",
      features: ["Unlimited everything", "Dedicated support", "Custom integrations", "SSO & advanced security", "SLA guarantee"],
      cta: "Contact Sales",
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <section className="text-center py-16 px-4">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Choose the perfect plan for your needs. Always flexible to upgrade or downgrade.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-lg border transition-all ${
                plan.highlight ? "border-blue-600 shadow-xl scale-105 bg-blue-50" : "border-gray-200 hover:border-gray-400 bg-white"
              } p-6 relative`}
            >
              {plan.highlight && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="text-3xl font-bold">{plan.price}</div>
                {plan.period && <div className="text-sm text-gray-600">{plan.period}</div>}
                {plan.savings && <div className="text-sm text-green-600 font-medium mt-1">{plan.savings}</div>}
              </div>

              <button
                className={`w-full py-2 rounded-lg font-medium mb-6 transition-colors ${
                  plan.highlight
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {plan.cta}
              </button>

              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start text-sm">
                    <span className="text-green-600 mr-3 font-bold">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
            <p className="text-gray-600">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-600">We accept all major credit cards (Visa, Mastercard, American Express) and PayPal.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
            <p className="text-gray-600">
              Yes, we offer a 7-day money-back guarantee if you're not satisfied. After that, unused credits can be refunded with a 5% processing fee.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">What happens to my credits if I cancel?</h3>
            <p className="text-gray-600">Unused credits remain in your account for 12 months. You can reactivate your subscription anytime.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Do you have a free trial?</h3>
            <p className="text-gray-600">Yes! Start with our Free tier and upgrade whenever you're ready. No credit card required.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
