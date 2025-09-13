import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { useToast } from '../../../components/ui/toast';
import { useBenchmarksStore } from '../store';
import { OpexUsaliBenchmark, LevelBand } from '../types';

const departments = [
  'Rooms', 'F&B', 'Utilities', 'Admin & General', 'Sales & Marketing', 
  'Maintenance', 'Insurance', 'Management Fees'
];

const metrics = [
  'pct_of_total_revenue',
  'pct_of_rooms_revenue', 
  'per_available_room',
  'per_occupied_room',
  'fixed_monthly'
];

export default function OpexTable() {
  const { toast } = useToast();
  const currentSetId = useBenchmarksStore(s => s.currentSetId);
  const opex = useBenchmarksStore(s => s.opex);
  const upsertOpex = useBenchmarksStore(s => s.upsertOpex);
  const deleteOpex = useBenchmarksStore(s => s.deleteOpex);

  const [editingItem, setEditingItem] = useState<OpexUsaliBenchmark | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleAdd = () => {
    if (!currentSetId) return;
    
    const newItem: OpexUsaliBenchmark = {
      id: crypto.randomUUID(),
      setId: currentSetId,
      department: 'Rooms',
      metric: 'pct_of_total_revenue',
      country: null,
      band: 'medium',
      value: 0,
      valueType: 'percent',
      currency: 'EUR'
    };
    
    setEditingItem(newItem);
    setShowDialog(true);
  };

  const handleEdit = (item: OpexUsaliBenchmark) => {
    setEditingItem({ ...item });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!editingItem) return;
    
    if (!editingItem.department.trim()) {
      toast.error('Department is required');
      return;
    }
    
    upsertOpex(editingItem);
    setShowDialog(false);
    setEditingItem(null);
    toast.success('OpEx benchmark saved');
  };

  const handleDelete = (item: OpexUsaliBenchmark) => {
    if (!confirm(`Delete "${item.department} (${item.band})"? This cannot be undone.`)) return;
    
    deleteOpex(item.id);
    toast.success('OpEx benchmark deleted');
  };

  const formatValue = (item: OpexUsaliBenchmark) => {
    if (item.valueType === 'percent') {
      return `${item.value}%`;
    } else {
      return new Intl.NumberFormat('en-GB', { 
        style: 'currency', 
        currency: item.currency || 'EUR', 
        maximumFractionDigits: 0 
      }).format(item.value);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">OpEx (USALI) Benchmarks</h3>
          <Button onClick={handleAdd} size="sm" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Benchmark</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Department</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Metric</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Country</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Band</th>
                <th className="text-right py-3 px-4 font-medium text-slate-700">Value</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Notes</th>
                <th className="text-center py-3 px-4 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {opex.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-900">{item.department}</td>
                  <td className="py-3 px-4 text-slate-600">{item.metric.replace(/_/g, ' ')}</td>
                  <td className="py-3 px-4 text-slate-600">{item.country || 'Global'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.band === 'low' ? 'bg-green-100 text-green-700' :
                      item.band === 'high' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.band}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-900">{formatValue(item)}</td>
                  <td className="py-3 px-4 text-slate-600 text-sm">{item.notes || '—'}</td>
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

        {opex.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <p>No OpEx benchmarks yet. Add your first benchmark to get started.</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem?.department ? 'Edit OpEx Benchmark' : 'Add OpEx Benchmark'}
            </DialogTitle>
          </DialogHeader>
          
          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Department *
                  </label>
                  <Select 
                    value={editingItem.department} 
                    onValueChange={(value) => setEditingItem({ ...editingItem, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Metric
                  </label>
                  <Select 
                    value={editingItem.metric} 
                    onValueChange={(value) => setEditingItem({ ...editingItem, metric: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {metrics.map((metric) => (
                        <SelectItem key={metric} value={metric}>
                          {metric.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Country
                  </label>
                  <Input
                    value={editingItem.country || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, country: e.target.value || null })}
                    placeholder="PT, ES, IT (or leave blank)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Band
                  </label>
                  <Select 
                    value={editingItem.band} 
                    onValueChange={(value) => setEditingItem({ ...editingItem, band: value as LevelBand })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Value Type
                  </label>
                  <Select 
                    value={editingItem.valueType} 
                    onValueChange={(value) => setEditingItem({ ...editingItem, valueType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentage</SelectItem>
                      <SelectItem value="absolute">Absolute Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Value
                </label>
                <Input
                  type="number"
                  value={editingItem.value || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, value: Number(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <Textarea
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  placeholder="Optional notes about this benchmark"
                  rows={2}
                />
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