import React from 'react';

const tiers = [
  {
    name: 'Basic',
    id: 'tier-basic',
    href: '#',
    priceMonthly: '$49',
    description: 'Perfect for small schools and startups.',
    features: [
      'Up to 500 students',
      'Basic student & staff management',
      'Fee collection & reporting',
      'Mobile app access',
      'Email support',
    ],
    featured: false,
  },
  {
    name: 'Professional',
    id: 'tier-professional',
    href: '#',
    priceMonthly: '$99',
    description: 'Best for growing schools with comprehensive needs.',
    features: [
      'Up to 2000 students',
      'Advanced analytics & reporting',
      'Parent portal access',
      'Custom integration APIs',
      'Priority phone support',
      'Data backup & security',
    ],
    featured: true,
  },
  {
    name: 'Enterprise',
    id: 'tier-enterprise',
    href: '#',
    priceMonthly: 'Custom',
    description: 'Tailored solutions for large institutions.',
    features: [
      'Unlimited students',
      'White-label solutions',
      'Dedicated account manager',
      'On-premise deployment option',
      '24/7 premium support',
      'Custom feature development',
    ],
    featured: false,
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function PricingPage({ onContinue }) {
  return (
    <div className="bg-white dark:bg-slate-900 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-slate-100 sm:text-5xl">
            Simple, transparent pricing
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600 dark:text-slate-400">
          Choose the plan that's right for your school. All plans include a 30-day free trial. No setup fees, no hidden costs.
        </p>
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {tiers.map((tier, tierIdx) => (
            <div
              key={tier.id}
              className={classNames(
                tier.featured ? 'bg-gray-900 shadow-2xl' : 'bg-white ring-1 ring-gray-200',
                'dark:bg-slate-800 dark:ring-slate-700',
                tier.featured ? 'text-white' : 'text-gray-900 dark:text-slate-100',
                'p-8 sm:p-10 rounded-3xl'
              )}
            >
              <h3
                id={tier.id}
                className={classNames(
                  tier.featured ? 'text-white' : 'text-gray-900 dark:text-slate-100',
                  'text-lg font-semibold leading-8'
                )}
              >
                {tier.name}
              </h3>
              <p className={classNames(
                tier.featured ? 'text-gray-300' : 'text-gray-600 dark:text-slate-400',
                'mt-4 text-sm leading-6'
              )}>
                {tier.description}
              </p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className={classNames(
                  tier.featured ? 'text-white' : 'text-gray-900 dark:text-slate-100',
                  'text-4xl font-bold tracking-tight'
                )}>
                  {tier.priceMonthly}
                </span>
                <span className={classNames(
                  tier.featured ? 'text-gray-300' : 'text-gray-600 dark:text-slate-400',
                  'text-sm font-semibold leading-6'
                )}>
                  {tier.priceMonthly === 'Custom' ? '' : '/month'}
                </span>
              </p>
              <button
                href={tier.href}
                aria-describedby={tier.id}
                onClick={onContinue}
                className={classNames(
                  tier.featured
                    ? 'bg-white text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline-white'
                    : 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus-visible:outline-blue-600',
                  'mt-6 block rounded-md px-6 py-2.5 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-full'
                )}
              >
                {tier.featured ? 'Continue' : 'Get started'}
              </button>
              <ul
                role="list"
                className={classNames(
                  tier.featured ? 'text-gray-300' : 'text-gray-600 dark:text-slate-400',
                  'mt-8 space-y-3 text-sm leading-6 sm:mt-10'
                )}
              >
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <svg
                      className={classNames(
                        tier.featured ? 'text-white' : 'text-blue-600',
                        'h-6 w-5 flex-none'
                      )}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.5 17a4.5 4.5 0 01-1.44-8.765 4.5 4.5 0 018.302-3.046 3.5 3.5 0 014.504 4.272A4 4 0 0115 17H5.5zm3.75-2.75a.75.75 0 001.5 0V9.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0l-3.25 3.5a.75.75 0 101.1 1.02l1.95-2.1v4.59z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
