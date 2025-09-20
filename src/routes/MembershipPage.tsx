import React from 'react';
import { Section } from '../components/ui/section';
import PricingSection from '../components/PricingSection';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { plans } from '../data/plans';

const faqs = [
  {
    question: 'What is USALI and why is it important for hotel underwriting?',
    answer: 'USALI (Uniform System of Accounts for the Lodging Industry) is the global standard for hotel financial reporting. Our platform uses industry standard reporting, which is recognized by banks, investors and operators. This makes it easier to get financing and ensures your analysis is easily understood.'
  },
  {
    question: 'What if i dont know how to underwrite my hotel deal?',
    answer: 'Our platform is built by industry experts with 15+ years of experience in hotel investment, sales and operations across Europe and Asia. We are always one request away from helping you review your assumptions, guide you through next steps or brainstorm possible solutions together. We also have a wider pool of industry experts for industry specifics - from IT to real estate development to pre-opening and operations.'
  },
  {
    question: 'Can I export my underwriting models to Excel or PDF?',
    answer: 'We have base functionality to export PDFs, but are still working on extractable excel files. In case if you need an excel financial model following your underwriting - please reach out to us via support@hotelfoundry.app and we will be able to help. '
  },
  {
    question: 'Do you offer consultancy and tempaltes for investor or lender presentations?',
    answer: 'Consultancy is available through the platform - you can fill out your request, select the level of experience you are looking for and we will send you the proposal as well as the consultant profile. We are also working on the database of investor and lender presentations.'
  },
  {
    question: 'Is there a free trial available?',
    answer: 'We offer a limited-time Beta-tester membership at €99 lifetime for early adopters. This gives you full access to test the platform. For ongoing use, we recommend the Starter plan at €99/month.'
  },
  {
    question: 'What markets do you have expertise in?',
    answer: 'Our primary focus and experience is in Europe, but we have also worked across Asia and have a wide network of industry experts across the board. We will do our best to help you deal wherever it is.'
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
              href="mailto:support@hotelfoundry.com"
              className="inline-block bg-white text-slate-900 hover:bg-white/90 px-6 py-3 rounded-md font-medium transition-colors"
            >
              Contact Enterprise Sales
            </a>
            <a 
              href="mailto:support@hotelfoundry.com"
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