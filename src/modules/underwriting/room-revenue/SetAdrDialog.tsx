import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';

type SetAdrDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onApply: (adr: number, applyTo: 'all' | 'low' | 'high') => void;
  currentAdr?: number;
};

export default function SetAdrDialog({ isOpen, onClose, onApply, currentAdr = 140 }: SetAdrDialogProps) {
  const [adr, setAdr] = useState<number>(currentAdr);
  const [applyTo, setApplyTo] = useState<'all' | 'low' | 'high'>('all');
  const [errors, setErrors] = useState<string>('');

  const handleApply = () => {
    // Validation
    if (!adr || adr <= 0) {
      setErrors('ADR must be greater than 0');
      return;
    }
    if (adr > 10000) {
      setErrors('ADR seems unusually high (max €10,000)');
      return;
    }

    setErrors('');
    onApply(adr, applyTo);
    onClose();
  };

  const handleClose = () => {
    setErrors('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Set Base ADR</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ADR (Average Daily Rate)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
              <input
                type="number"
                value={adr || ''}
                onChange={(e) => setAdr(Number(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                placeholder="140"
                min="0"
                step="0.5"
              />
            </div>
            {errors && <p className="mt-1 text-sm text-red-600">{errors}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Apply to
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="applyTo"
                  value="all"
                  checked={applyTo === 'all'}
                  onChange={(e) => setApplyTo(e.target.value as 'all')}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900">All months</span>
                  <p className="text-xs text-slate-500">Set the same ADR for every month</p>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="applyTo"
                  value="low"
                  checked={applyTo === 'low'}
                  onChange={(e) => setApplyTo(e.target.value as 'low')}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900">Low months only</span>
                  <p className="text-xs text-slate-500">Occupancy ≤ 60% (typically off-season)</p>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="applyTo"
                  value="high"
                  checked={applyTo === 'high'}
                  onChange={(e) => setApplyTo(e.target.value as 'high')}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900">High months only</span>
                  <p className="text-xs text-slate-500">Occupancy ≥ 80% (typically peak season)</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleApply} className="bg-brand-600 hover:bg-brand-700 text-white">
            Apply ADR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}