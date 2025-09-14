import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Quote } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Section } from '../components/ui/section';
import { Card, CardContent } from '../components/ui/card';
import HeroInvestmentPanel from '../components/HeroInvestmentPanel';
import FeatureCards from '../components/FeatureCards';
import PricingSection from '../components/PricingSection';
import PropertyCarousel from '../components/PropertyCarousel';
import { selectors } from '../lib/templatesStore';
import { PropertyTemplate } from '../types/property';
import { plans } from '../data/plans';
import { testimonials } from '../data/testimonials';

export default function LandingPage() {
  const properties: PropertyTemplate[] = selectors.forGallery();
  const featuredProperties = properties.slice(0, 6);

  return (
    <div className="min-h-screen [background:var(--page-gradient)]">
      {/* Hero Section */}
      <HeroInvestmentPanel />

      {/* Features Section */}
      <Section className="bg-gradient-to-b from-white/95 to-white">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            Professional underwriting tools
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
            Built specifically for boutique hotel investments with institutional-grade analysis and reporting.
          </p>
        </div>
        <FeatureCards />
      </Section>

      {/* Property Gallery Preview */}
      <Section className="bg-gradient-to-b from-slate-50 to-white py-16">
        <PropertyCarousel properties={featuredProperties} />
        <div className="text-center mt-8">
          <Link to="/properties">
            <Button variant="outline" className="flex items-center space-x-2 mx-auto transform hover:scale-105 transition-all duration-300">
              <span>See all properties</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Section>

      {/* Pricing Section */}
      <Section className="bg-white">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            Choose your plan
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
            From beta access to full consultancy support—find the right plan for your investment needs.
          </p>
        </div>
        <PricingSection plans={plans} />
        <div className="text-center mt-8">
          <Link to="/membership">
            <Button variant="outline" className="flex items-center space-x-2 mx-auto transform hover:scale-105 transition-all duration-300">
              <span>View detailed comparison</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Section>

      {/* Testimonials Section */}
      <Section className="bg-gradient-to-b from-slate-50 to-white">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            Trusted by hotel investors
          </h2>
          <p className="text-xl text-slate-600 font-medium">
            See what industry professionals say about Hotel Foundry.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="bg-card-gradient backdrop-blur-sm border-white/50 shadow-card">
              <CardContent className="p-8">
                <Quote className="h-8 w-8 text-brand-400 mb-4" />
                <p className="text-slate-700 leading-relaxed mb-6 font-medium">
                  "{testimonial.quote}"
                </p>
                <div className="border-t border-navy-200 pt-4">
                  <p className="font-bold text-slate-900">{testimonial.author}</p>
                  <p className="text-sm text-slate-600 font-medium">{testimonial.role}</p>
                  {testimonial.company && (
                    <p className="text-sm text-slate-500">{testimonial.company}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="bg-electric-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 via-transparent to-accent-500/20"></div>
        <div className="text-center">
          <h2 className="text-4xl lg:text-5xl font-black mb-6 tracking-tight relative z-10">
            Ready to underwrite with confidence?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto font-medium leading-relaxed relative z-10">
            Join the platform that's transforming hotel investment analysis across European leisure markets.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
            <Link to="/membership">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 font-bold px-8">
                Get Started Today
              </Button>
            </Link>
            <Link to="/properties">
              <Button size="lg" variant="outline" className="border-2 border-white/40 bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-slate-900 hover:border-white hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold px-8">
                Browse Properties
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
