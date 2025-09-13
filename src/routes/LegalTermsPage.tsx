import React from 'react';
import { Section } from '../components/ui/section';

export default function LegalTermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Section>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-slate max-w-none">
            <p className="text-xl text-slate-600 leading-relaxed mb-8">
              Last updated: January 2025
            </p>
            
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Acceptance of Terms</h2>
                <p className="text-slate-700 leading-relaxed">
                  By accessing and using Hotel Foundry's underwriting platform and services, you accept and agree to be bound by the terms and provision of this agreement.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Service Description</h2>
                <p className="text-slate-700 leading-relaxed">
                  Hotel Foundry provides a professional hotel underwriting platform designed for boutique property investments. Our services include USALI-compliant financial modeling, sensitivity analysis, benchmark data, and consultancy services for hotel investors and operators.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">User Responsibilities</h2>
                <p className="text-slate-700 leading-relaxed mb-4">
                  As a user of our platform, you agree to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-700">
                  <li>Provide accurate and complete information when creating your account</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Use the platform in accordance with all applicable laws and regulations</li>
                  <li>Not share your account access with unauthorized parties</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Intellectual Property</h2>
                <p className="text-slate-700 leading-relaxed">
                  All content, features, and functionality of the Hotel Foundry platform, including but not limited to text, graphics, logos, software, and data compilations, are the property of Hotel Foundry and are protected by international copyright, trademark, and other intellectual property laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Limitation of Liability</h2>
                <p className="text-slate-700 leading-relaxed">
                  Hotel Foundry provides underwriting tools and analysis for informational purposes. All investment decisions should be made based on your own due diligence and professional advice. We are not responsible for investment outcomes based on platform analysis.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Contact Information</h2>
                <p className="text-slate-700 leading-relaxed">
                  For questions about these Terms of Service, please contact us at{' '}
                  <a href="mailto:legal@hotelfoundry.com" className="text-slate-900 font-medium hover:underline">
                    legal@hotelfoundry.com
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