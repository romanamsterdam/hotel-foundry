import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertTriangle, Eye, EyeOff, Check } from 'lucide-react';
import { useToast } from '../ui/toast';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
}

const clientTypes = [
  { value: 'individual', label: 'Individual Investor' },
  { value: 'family_office', label: 'Family Office' },
  { value: 'fund', label: 'Investment Fund' },
  { value: 'developer', label: 'Hotel Developer' },
  { value: 'operator', label: 'Hotel Operator' },
  { value: 'advisor', label: 'Investment Advisor' },
  { value: 'other', label: 'Other' }
];

export default function SignUpModal({ isOpen, onClose, planId, planName }: SignUpModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    clientType: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    agreeToMarketing: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.clientType) {
      newErrors.clientType = 'Please select your client type';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms & Conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // TODO: Replace with Supabase auth
      // const { data, error } = await supabase.auth.signUp({
      //   email: formData.email,
      //   password: formData.password,
      //   options: {
      //     data: {
      //       full_name: formData.name,
      //       client_type: formData.clientType,
      //       selected_plan: planId,
      //       marketing_consent: formData.agreeToMarketing
      //     }
      //   }
      // });

      // Mock successful registration
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Account created successfully! Welcome to Hotel Foundry.');
      
      // TODO: Redirect to dashboard or onboarding flow
      // navigate('/dashboard');
      
      onClose();
    } catch (error) {
      toast.error('Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        email: '',
        clientType: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
        agreeToMarketing: false
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Join Hotel Foundry</DialogTitle>
          <p className="text-sm text-slate-600">
            Get started with the <span className="font-semibold text-coral-600">{planName}</span> plan
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                errors.name ? 'border-red-500' : 'border-slate-300'
              }`}
              placeholder="Enter your full name"
              disabled={isSubmitting}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                errors.email ? 'border-red-500' : 'border-slate-300'
              }`}
              placeholder="your.email@example.com"
              disabled={isSubmitting}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Client Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type of Client *
            </label>
            <Select 
              value={formData.clientType} 
              onValueChange={(value) => handleFieldChange('clientType', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger className={errors.clientType ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select your client type" />
              </SelectTrigger>
              <SelectContent>
                {clientTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.clientType && <p className="mt-1 text-sm text-red-600">{errors.clientType}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                  errors.password ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Create a secure password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            <p className="mt-1 text-xs text-slate-500">Minimum 8 characters</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Confirm your password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                disabled={isSubmitting}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>

          {/* Terms & Conditions */}
          <div className="space-y-3">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) => handleFieldChange('agreeToTerms', e.target.checked)}
                className="mt-1 text-brand-600 focus:ring-brand-500 rounded"
                disabled={isSubmitting}
              />
              <div className="text-sm">
                <span className="text-slate-700">
                  I agree to the{' '}
                  <a 
                    href="/legal/terms" 
                    target="_blank" 
                    className="text-brand-600 hover:text-brand-700 underline"
                  >
                    Terms & Conditions
                  </a>
                  {' '}and{' '}
                  <a 
                    href="/legal/privacy" 
                    target="_blank" 
                    className="text-brand-600 hover:text-brand-700 underline"
                  >
                    Privacy Policy
                  </a>
                  {' '}*
                </span>
              </div>
            </label>
            {errors.agreeToTerms && <p className="text-sm text-red-600">{errors.agreeToTerms}</p>}

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreeToMarketing}
                onChange={(e) => handleFieldChange('agreeToMarketing', e.target.checked)}
                className="mt-1 text-brand-600 focus:ring-brand-500 rounded"
                disabled={isSubmitting}
              />
              <div className="text-sm text-slate-700">
                I'd like to receive updates about new features and hotel investment insights (optional)
              </div>
            </label>
          </div>

          {/* Disclaimer */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-medium mb-1">Important Disclaimer</p>
                <p>
                  Hotel Foundry provides analysis tools for educational purposes. All projections are estimates 
                  and may not reflect actual performance. Hotel investments involve significant risks. 
                  Always consult qualified professionals before making investment decisions.
                </p>
              </div>
            </div>
          </div>
        </form>

        <DialogFooter className="flex-col space-y-3">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.agreeToTerms}
            className="w-full bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-400 hover:to-coral-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Account...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Create Account & Get {planName}
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full"
          >
            Cancel
          </Button>
          
          <p className="text-xs text-slate-500 text-center">
            Already have an account?{' '}
            <button 
              type="button"
              className="text-brand-600 hover:text-brand-700 underline"
              onClick={() => {
                // TODO: Switch to login modal
                toast.info('Login functionality coming soon');
              }}
            >
              Sign in here
            </button>
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}