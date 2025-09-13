import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { useToast } from '../../../components/ui/toast';
import { useBenchmarksStore } from '../store';
import { PayrollBenchmark } from '../types';

const countries = ['PT', 'ES', 'IT', 'FR', 'GR', 'HR', 'DE', 'NL', 'GB'];
const roles = [
  'Receptionist', 'Front Office Manager', 'Housekeeper', 'Housekeeping Supervisor',
  'Waiter', 'Bartender', 'Chef de Partie', 'Sous Chef', 'Executive Chef',
  'Spa Therapist', 'Maintenance Technician', 'Hotel Manager', 'Assistant Manager',
  'Sales Manager', 'Marketing Coordinator'
];

export default function PayrollTable() {
  const { toast } = useToast();
  const currentSetId = useBenchmarksStore(s => s.currentSetId);
  const payroll = useBenchmarksStore(s => s.payroll);
  const upsertPayroll = useBenchmarksStore(s => s.upsertPayroll);
  const deletePayroll = useBenchmarksStore(s => s.deletePayroll);

  const [editingItem, setEditingItem] = useState<PayrollBenchmark | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleAdd = () => {
    if (!currentSetId) return;
    
    const newItem: PayrollBenchmark = {
      id: crypto.randomUUID(),
      setId: currentSetId,
      country: 'PT',
      role: 'Receptionist',
      seniority: 'mid',
      monthlyGrossLow: null,
      monthlyGrossMed: null,
      monthlyGrossHigh: null,
      currency: 'EUR',
      includesBenefits: false
    };
    
    setEditingItem(newItem);
    setShowDialog(true);
  };

  const handleEdit = (item: PayrollBenchmark) => {
    setEditingItem({ ...item });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!editingItem) return;
    
    if (!editingItem.country.trim() || !editingItem.role.trim()) {
      toast.error('Country and role are required');
      return;
    }
    
    upsertPayroll(editingItem);
    setShowDialog(false);
    setEditingItem(null);
    toast.success('Payroll benchmark saved');
  };

  const handleDelete = (item: PayrollBenchmark) => {
    if (!confirm(`Delete "${item.role} (${item.country})"? This cannot be undone.`)) return;
    
    deletePayroll(item.id);
    toast.success('Payroll benchmark deleted');
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '—';
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'EUR', 
      maximumFractionDigits: 0 
    }).format(value);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Payroll Benchmarks</h3>
          <Button onClick={handleAdd} size="sm" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Role</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Country</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Role</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Seniority</th>
                <th className="text-right py-3 px-4 font-medium text-slate-700">Low</th>
                <th className="text-right py-3 px-4 font-medium text-slate-700">Medium</th>
                <th className="text-right py-3 px-4 font-medium text-slate-700">High</th>
                <th className="text-center py-3 px-4 font-medium text-slate-700">Inc. Benefits</th>
                <th className="text-center py-3 px-4 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payroll.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-900">{item.country}</td>
                  <td className="py-3 px-4 text-slate-900">{item.role}</td>
                  <td className="py-3 px-4 text-slate-600 capitalize">{item.seniority || '—'}</td>
                  <td className="py-3 px-4 text-right text-slate-900">{formatCurrency(item.monthlyGrossLow)}</td>
                  <td className="py-3 px-4 text-right text-slate-900">{formatCurrency(item.monthlyGrossMed)}</td>
                  <td className="py-3 px-4 text-right text-slate-900">{formatCurrency(item.monthlyGrossHigh)}</td>
                  <td className="py-3 px-4 text-center">
                    {item.includesBenefits ? '✓' : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {payroll.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <p>No payroll benchmarks yet. Add your first role to get started.</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem?.role ? 'Edit Payroll Benchmark' : 'Add Payroll Benchmark'}
            </DialogTitle>
          </DialogHeader>
          
          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Country *
                  </label>
                  <Select 
                    value={editingItem.country} 
                    onValueChange={(value) => setEditingItem({ ...editingItem, country: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Role *
                  </label>
                  <Select 
                    value={editingItem.role} 
                    onValueChange={(value) => setEditingItem({ ...editingItem, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Seniority
                  </label>
                  <Select 
                    value={editingItem.seniority || ''} 
                    onValueChange={(value) => setEditingItem({ ...editingItem, seniority: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select seniority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior">Junior</SelectItem>
                      <SelectItem value="mid">Mid</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Monthly Gross (Low)
                  </label>
                  <Input
                    type="number"
                    value={editingItem.monthlyGrossLow || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, monthlyGrossLow: Number(e.target.value) || null })}
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Monthly Gross (Medium)
                  </label>
                  <Input
                    type="number"
                    value={editingItem.monthlyGrossMed || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, monthlyGrossMed: Number(e.target.value) || null })}
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Monthly Gross (High)
                  </label>
                  <Input
                    type="number"
                    value={editingItem.monthlyGrossHigh || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, monthlyGrossHigh: Number(e.target.value) || null })}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Currency
                  </label>
                  <Select 
                    value={editingItem.currency} 
                    onValueChange={(value) => setEditingItem({ ...editingItem, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-3 pt-6">
                  <Switch
                    checked={editingItem.includesBenefits || false}
                    onCheckedChange={(checked) => setEditingItem({ ...editingItem, includesBenefits: checked })}
                  />
                  <label className="text-sm font-medium text-slate-700">
                    Includes Benefits
                  </label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Benchmark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}