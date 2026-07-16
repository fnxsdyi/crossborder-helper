import { ArrowLeft } from 'lucide-react'

export function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to TaxFlow
        </a>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-400 mb-10">Last updated: July 5, 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using TaxFlow ("the Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Description of Service</h2>
            <p>
              TaxFlow is an invoice generation and tax compliance tool designed for cross-border freelancers
              and digital nomads. The Service is provided "as is" and "as available" without warranties of any kind.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Account Registration</h2>
            <p className="mb-3">To use the Service, you must create an account. You are responsible for:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Maintaining the security of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Service Continuity</h2>
            <p className="mb-4">
              TaxFlow is offered on a subscription basis (monthly and annual plans).
              We are committed to maintaining service continuity and transparency.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mb-2 mt-6">4.1 Cancellation</h3>
            <p className="mb-4">
              You may cancel your subscription at any time. Cancellation takes effect at the end of the
              current billing period. No partial refunds for the remaining days of a monthly billing cycle.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mb-2 mt-6">4.2 Annual Plan Refunds</h3>
            <p className="mb-4">
              If you cancel an annual plan, you may request a prorated refund for the unused full months
              remaining in your billing cycle.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mb-2 mt-6">4.3 Service Discontinuation</h3>
            <p className="mb-3">
              If we decide to discontinue TaxFlow, we will provide at least 60 days' advance notice via
              email and in-product announcement. During this period:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>You may continue using the service until the shutdown date.</li>
              <li>Annual subscribers will receive a prorated refund for unused months.</li>
              <li>We will provide an export tool or migration path for your data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Payment Terms</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Free Plan:</strong> Available at no cost with usage limits.</li>
              <li><strong>Pro Monthly ($9/month):</strong> Billed monthly, cancel anytime.</li>
              <li><strong>Pro Annual ($90/year):</strong> Billed annually, cancel anytime with prorated refund.</li>
              <li>All payments are processed through PayPal. We do not store payment card information.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Intellectual Property</h2>
            <p>
              The Service, including its design, code, and content, is owned by FlowingPulse and protected
              by intellectual property laws. You retain ownership of any data you input into the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Data and Privacy</h2>
            <p>
              Your use of the Service is also governed by our{' '}
              <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">Privacy Policy</a>, which
              describes how we collect, use, and protect your data. By using the Service, you consent to
              the data practices described therein.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, TaxFlow and FlowingPulse shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, or any loss of profits or
              revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other
              intangible losses resulting from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Service Availability</h2>
            <p>
              We strive to maintain high availability but do not guarantee uninterrupted service. We may
              perform maintenance, updates, or modifications that temporarily affect availability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the Service at our sole discretion,
              without notice, for conduct that we believe violates these Terms or is harmful to other users,
              us, or third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws. Any disputes
              arising from these terms or the service shall be resolved through good-faith negotiation first,
              then binding arbitration if necessary.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">12. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. Material changes will be communicated via email or a
              notice on the Service. Continued use after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">13. Contact</h2>
            <p>
              For questions about these Terms, contact us at{' '}
              <a href="mailto:support@tax.flowingpulse.com" className="text-blue-600 hover:underline">
                support@tax.flowingpulse.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
