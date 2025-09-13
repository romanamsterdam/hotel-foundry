import React from 'react';
import { Section } from '../components/ui/section';

export default function LegalPrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Section>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-slate max-w-none">
            <p className="text-xl text-slate-600 leading-relaxed mb-8">
              Last updated: January 2025
            </p>
            
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Introduction</h2>
                <p className="text-slate-700 leading-relaxed">
                  Hotel Foundry ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our hotel underwriting platform and services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Information We Collect</h2>
                <p className="text-slate-700 leading-relaxed mb-4">
                  We collect information you provide directly to us, such as:
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-700">
                  <li>Account registration information (name, email, company details)</li>
                  <li>Subscription and billing information</li>
                  <li>Property analysis data and underwriting models you create</li>
                  <li>Communications with our support team</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">How We Use Your Information</h2>
                <p className="text-slate-700 leading-relaxed mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-700">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Respond to your comments, questions, and requests</li>
                  <li>Send technical notices, updates, security alerts, and support messages</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Data Security</h2>
                <p className="text-slate-700 leading-relaxed">
                  We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Your underwriting models and financial data are encrypted both in transit and at rest.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Contact Us</h2>
                <p className="text-slate-700 leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at{' '}
                  <a href="mailto:privacy@hotelfoundry.com" className="text-slate-900 font-medium hover:underline">
                    privacy@hotelfoundry.com
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}