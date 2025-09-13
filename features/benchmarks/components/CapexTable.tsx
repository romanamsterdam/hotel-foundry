import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { useToast } from '../../../components/ui/toast';
import { useBenchmarksStore } from '../store';
import { CapexBenchmark } from '../types';

export default function CapexTable() {
  const { toast } = useToast();
  const currentSetId = useBenchmarksStore(s => s.currentSetId);
  const capex = useBenchmarksStore(s => s.capex);
  const upsertCapex = useBenchmarksStore(s => s.upsertCapex);
  const deleteCapex = useBenchmarksStore(s => s.deleteCapex);

  const [editingItem, setEditingItem] = useState<CapexBenchmark | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleAdd = () => {
    if (!currentSetId) return;
    
    const newItem: CapexBenchmark = {
      id: crypto.randomUUID(),
      setId: currentSetId,
      itemCode: '',
      itemName: '',
      unit: 'per_room',
      country: null,
      low: null,
      medium: null,
      high: null,
      currency: 'EUR',
      tags: []
    };
    
    setEditingItem(newItem);
    setShowDialog(true);
  };

  const handleEdit = (item: CapexBenchmark) => {
    setEditingItem({ ...item });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!editingItem) return;
    
    if (!editingItem.itemCode.trim() || !editingItem.itemName.trim()) {
      toast.error('Item code and name are required');
      return;
    }
    
    upsertCapex(editingItem);
    setShowDialog(false);
    setEditingItem(null);
    toast.success('CapEx benchmark saved');
  };

  const handleDelete = (item: CapexBenchmark) => {
    if (!confirm(`Delete "${item.itemName}"? This cannot be undone.`)) return;
    
    deleteCapex(item.id);
    toast.success('CapEx benchmark deleted');
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
          <h3 className="text-lg font-semibold text-slate-900">CapEx Benchmarks</h3>
          <Button onClick={handleAdd} size="sm" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Item</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Item Code</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Item Name</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Unit</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Country</th>
                <th className="text-right py-3 px-4 font-medium text-slate-700">Low</th>
                <th className="text-right py-3 px-4 font-medium text-slate-700">Medium</th>
                <th className="text-right py-3 px-4 font-medium text-slate-700">High</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Tags</th>
                <th className="text-center py-3 px-4 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {capex.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono text-sm text-slate-900">{item.itemCode}</td>
                  <td className="py-3 px-4 text-slate-900">{item.itemName}</td>
                  <td className="py-3 px-4 text-slate-600">{item.unit.replace('_', ' ')}</td>
                  <td className="py-3 px-4 text-slate-600">{item.country || 'Global'}</td>
                  <td className="py-3 px-4 text-right text-slate-900">{formatCurrency(item.low)}</td>
                  <td className="py-3 px-4 text-right text-slate-900">{formatCurrency(item.medium)}</td>
                  <td className="py-3 px-4 text-right text-slate-900">{formatCurrency(item.high)}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {item.tags?.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
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

        {capex.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <p>No CapEx benchmarks yet. Add your first item to get started.</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem?.itemName ? 'Edit CapEx Benchmark' : 'Add CapEx Benchmark'}
            </DialogTitle>
          </DialogHeader>
          
          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Item Code *
                  </label>
                  <Input
                    value={editingItem.itemCode}
                    onChange={(e) => setEditingItem({ ...editingItem, itemCode: e.target.value })}
                    placeholder="e.g., FF&E_GUESTROOM_STD"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Item Name *
                  </label>
                  <Input
                    value={editingItem.itemName}
                    onChange={(e) => setEditingItem({ ...editingItem, itemName: e.target.value })}
                    placeholder="e.g., FF&E – Standard Room"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Unit
                  </label>
                  <Select 
                    value={editingItem.unit} 
                    onValueChange={(value) => setEditingItem({ ...editingItem, unit: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_room">Per Room</SelectItem>
                      <SelectItem value="per_sqm">Per SqM</SelectItem>
                      <SelectItem value="per_item">Per Item</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Country
                  </label>
                  <Input
                    value={editingItem.country || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, country: e.target.value || null })}
                    placeholder="PT, ES, IT (or leave blank for global)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Currency
                  </label>
                  <Select 
                    value={editingItem.currency || 'EUR'} 
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
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Low
                  </label>
                  <Input
                    type="number"
                    value={editingItem.low || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, low: Number(e.target.value) || null })}
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Medium
                  </label>
                  <Input
                    type="number"
                    value={editingItem.medium || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, medium: Number(e.target.value) || null })}
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    High
                  </label>
                  <Input
                    type="number"
                    value={editingItem.high || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, high: Number(e.target.value) || null })}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tags (comma-separated)
                </label>
                <Input
                  value={editingItem.tags?.join(', ') || ''}
                  onChange={(e) => setEditingItem({ 
                    ...editingItem, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  })}
                  placeholder="e.g., rooms, ff&e, construction"
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