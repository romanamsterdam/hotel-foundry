import React from 'react';
import { Section } from '../components/ui/section';
import PricingSection from '../components/PricingSection';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { plans } from '../data/plans';

const faqs = [
  {
    question: 'What is USALI and why is it important for hotel underwriting?',
    answer: 'USALI (Uniform System of Accounts for the Lodging Industry) is the global standard for hotel financial reporting. Our platform generates USALI-compliant P&L statements with proper departmental (rooms, F&B) and undistributed (marketing, maintenance) cost allocations, plus FF&E reserves. This ensures your analysis meets investor and lender expectations.'
  },
  {
    question: 'How accurate are the benchmark data for European leisure markets?',
    answer: 'Our benchmarks are sourced from actual hotel performance data across the Balearics and similar markets. We track ADR, occupancy, RevPAR, and operational costs for comparable 15-40 room properties. Data is updated quarterly and includes seasonal variations typical of leisure destinations.'
  },
  {
    question: 'Can I export my underwriting models to Excel or PDF?',
    answer: 'Yes, all plans include export functionality. You can generate board-ready PDF presentations and export underlying Excel models for further customization. The Pro plan includes additional template formats for due diligence and investor presentations.'
  },
  {
    question: 'What are consultancy credits and how do they work?',
    answer: 'Consultancy credits give you access to our team of hotel investment specialists for one-on-one guidance. Each credit covers a 30-minute consultation on specific deals, market analysis, or underwriting questions. Pro plan members receive 10 credits monthly.'
  },
  {
    question: 'Is there a free trial available?',
    answer: 'We offer a limited-time Beta-tester membership at €99 lifetime for early adopters. This gives you full access to test the platform. For ongoing use, we recommend the Starter plan at €99/month.'
  },
  {
    question: 'What markets will you cover beyond the Balearics?',
    answer: 'We\'re expanding to cover Portuguese Algarve, Italian coastal markets (Sicily, Puglia), and French Riviera by Q2 2025. Our roadmap includes mainland Spain coastal markets and Greek islands by end of 2025.'
  }
];

export default function MembershipPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Section className="bg-slate-50 py-12">
        <div className="text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Membership & Pricing
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Choose the right plan for your hotel investment needs. From platform access to full consultancy support, 
            we have a solution for every stage of your investment journey.
          </p>
        </div>
      </Section>

      {/* Pricing */}
      <Section>
        <PricingSection plans={plans} showComparison={true} />
      </Section>

      {/* FAQ Section */}
      <Section className="bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-600">
              Get answers to common questions about our platform and services.
            </p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-slate-200 rounded-lg bg-white px-6">
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="font-semibold text-slate-900">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-slate-600 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* Contact Section */}
      <Section className="bg-slate-900 text-white">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">
            Need a custom solution?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            For institutional investors or large hotel portfolios, we offer custom enterprise solutions 
            with dedicated support and tailored features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:enterprise@hotelfoundry.com"
              className="inline-block bg-white text-slate-900 hover:bg-white/90 px-6 py-3 rounded-md font-medium transition-colors"
            >
              Contact Enterprise Sales
            </a>
            <a 
              href="mailto:hello@hotelfoundry.com"
              className="inline-block border border-white text-white hover:bg-white hover:text-slate-900 px-6 py-3 rounded-md font-medium transition-colors"
            >
              General Inquiries
            </a>
          </div>
        </div>
      </Section>
    </div>
  );
}