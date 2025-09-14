import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Menu, X, Building2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../auth/AuthProvider';
import { env } from '../lib/env';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const navigation = [
    { name: 'Properties', href: '/properties' },
    { name: 'Pricing', href: '/membership' },
  ];

  const isActive = (href: string) => location.pathname === href;

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };
  return (
    <nav className="bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-lg">
              <Building2 className="h-6 w-6 text-white drop-shadow-sm" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Hotel Foundry</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'text-sm font-medium transition-colors',
                  isActive(item.href) 
                    ? 'text-brand-600' 
                    : 'text-slate-700 hover:text-brand-600'
                )}
              >
                {item.name}
              </Link>
            ))}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm" className="text-slate-700 hover:text-slate-900">
                      Dashboard
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSignOut}
                    type="button"
                    className="text-slate-600 hover:text-slate-900"
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/signin">
                    <Button 
                      variant="ghost"
                      size="sm" 
                      className="text-slate-700 hover:text-slate-900"
                    >
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/membership">
                    <Button 
                      size="sm" 
                      className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
                    >
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6 text-slate-700" /> : <Menu className="h-6 w-6 text-slate-700" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-slate-200">
            <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors',
                    isActive(item.href) 
                      ? 'text-brand-600' 
                      : 'text-slate-700 hover:text-brand-600'
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {user ? (
                <div className="flex flex-col space-y-2 pt-4 border-t border-slate-200">
                  <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button
                      size="sm"
                      className="text-left justify-start bg-slate-900 hover:bg-slate-800 text-white w-full font-semibold"
                    >
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="text-left justify-start text-slate-600 hover:text-slate-900"
                  >
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2 pt-4 border-t border-slate-200">
                  <Link to="/signin" onClick={() => setIsOpen(false)}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-left justify-start text-slate-700 w-full"
                    >
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/membership" onClick={() => setIsOpen(false)}>
                    <Button type="button" size="sm" className="w-fit bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-400 hover:to-accent-400 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}