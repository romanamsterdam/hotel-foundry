import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Skeleton } from '../../components/ui/skeleton';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/toast';
import { PropertyTemplate, RoomBreakdownItem, Facility } from '../../types/property';
import { getAll, getById, upsert, remove } from '../../lib/templatesStore';
import { toCountryCode } from '../../lib/geo/country';
import SafeImage from '../../components/SafeImage';
import RoomMixEditor from '../../components/property/RoomMixEditor';
import FacilitiesEditor from '../../components/property/FacilitiesEditor';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const propertyTypes = ['Boutique Hotel', 'Resort', 'City Hotel', 'Hostel', 'Other'];
const currencies = ['EUR', 'USD', 'PHP', 'GBP', 'Other'];

export default function AdminSamplePropertiesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<PropertyTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<PropertyTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRoomEditor, setShowRoomEditor] = useState(false);
  const [showFacilitiesEditor, setShowFacilitiesEditor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load templates
  useEffect(() => {
    setLoading(true);
    try {
      const allTemplates = getAll();
      setTemplates(allTemplates);
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load selected template
  useEffect(() => {
    if (selectedId === 'new') {
      const newTemplate: PropertyTemplate = {
        id: crypto.randomUUID(),
        slug: '',
        dealName: '',
        city: '',
        country: '',
        fullAddress: '',
        photoUrl: '',
        propertyType: 'Boutique Hotel',
        featured: false,
        stars: 4,
        currency: 'EUR',
        gfaSqm: 0,
        purchasePrice: 0,
        roomsTotal: 0,
        roomBreakdown: [{ type: 'Standard', count: 0 }],
        facilities: [],
        showInTemplates: true,
        showInGallery: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setEditingTemplate(newTemplate);
    } else if (selectedId) {
      const template = getById(selectedId);
      setEditingTemplate(template || null);
    } else {
      setEditingTemplate(null);
    }
  }, [selectedId]);

  const handleFieldChange = (field: keyof PropertyTemplate, value: any) => {
    if (!editingTemplate) return;
    
    setEditingTemplate({
      ...editingTemplate,
      [field]: value
    });
  };

  const handleRoomBreakdownSave = (roomTypes: Array<{ id: string; name: string; count: number }>) => {
    if (!editingTemplate) return;
    
    const roomBreakdown: RoomBreakdownItem[] = roomTypes.map(rt => ({
      type: rt.name,
      count: rt.count
    }));
    
    const roomsTotal = roomBreakdown.reduce((sum, room) => sum + room.count, 0);
    
    setEditingTemplate({
      ...editingTemplate,
      roomBreakdown,
      roomsTotal
    });
    
    setShowRoomEditor(false);
    toast.success('Room breakdown updated');
  };

  const handleFacilitiesSave = (facilities: Facility[]) => {
    if (!editingTemplate) return;
    
    setEditingTemplate({
      ...editingTemplate,
      facilities
    });
    
    setShowFacilitiesEditor(false);
    toast.success('Facilities updated');
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    
    // Validation
    if (!editingTemplate.dealName.trim()) {
      toast.error('Deal name is required');
      return;
    }
    if (!editingTemplate.city.trim()) {
      toast.error('City is required');
      return;
    }
    if (!editingTemplate.country.trim()) {
      toast.error('Country is required');
      return;
    }
    if (editingTemplate.roomsTotal <= 0) {
      toast.error('Must have at least 1 room');
      return;
    }

    setSaving(true);
    
    try {
      const savedTemplate = upsert(editingTemplate);
      
      // Update local state
      setTemplates(getAll());
      setEditingTemplate(savedTemplate);
      
      toast.success('Template saved successfully');
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTemplate || selectedId === 'new') return;
    
    try {
      remove(editingTemplate.id);
      setTemplates(getAll());
      setSelectedId(null);
      setEditingTemplate(null);
      setShowDeleteConfirm(false);
      toast.success('Template deleted');
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleCancel = () => {
    if (selectedId === 'new') {
      setSelectedId(null);
      setEditingTemplate(null);
    } else if (selectedId) {
      // Reload from store
      const original = getById(selectedId);
      setEditingTemplate(original || null);
    }
  };

  // Convert room breakdown to room types format for editor
  const getRoomTypesForEditor = () => {
    if (!editingTemplate) return [];
    
    return editingTemplate.roomBreakdown.map((room, index) => ({
      id: `room-${index}`,
      name: room.type,
      count: room.count,
      baseAdr: undefined,
      baseOcc: undefined
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Templates List */}
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Property Templates</CardTitle>
          <Button size="sm" onClick={() => setSelectedId('new')}>
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-2/3" />
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {templates.map((template) => (
                <button
                  key={template.id}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedId === template.id
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                  onClick={() => setSelectedId(template.id)}
                >
                  <div className="flex items-start space-x-3">
                    <SafeImage
                      src={template.photoUrl}
                      fallbackText={template.dealName}
                      className="w-12 h-12 rounded-lg flex-shrink-0"
                      alt={template.dealName}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-slate-900 truncate">{template.dealName}</span>
                        {template.featured && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-slate-600 truncate">
                        {template.city}, {template.country}
                      </div>
                      <div className="text-xs text-slate-500">
                        {template.roomsTotal} rooms • {template.facilities.length} facilities
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              
              {templates.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No templates found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right Column - Edit Form */}
      <div className="lg:col-span-2">
        {!selectedId ? (
          <Card>
            <CardHeader>
              <CardTitle>Select a template to edit or create a new one</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Choose a property template from the list to edit its details, or click "New" to create a new template.
              </p>
            </CardContent>
          </Card>
        ) : !editingTemplate ? (
          <Card>
            <CardHeader>
              <CardTitle>Loading template...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedId === 'new' ? 'Create New Template' : 'Edit Template'}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {selectedId !== 'new' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Deal Name *
                  </label>
                  <Input
                    value={editingTemplate.dealName}
                    onChange={(e) => handleFieldChange('dealName', e.target.value)}
                    placeholder="Enter deal name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Property Type *
                  </label>
                  <Select 
                    value={editingTemplate.propertyType} 
                    onValueChange={(value) => handleFieldChange('propertyType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    City *
                  </label>
                  <Input
                    value={editingTemplate.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Country *
                  </label>
                  <Input
                    value={editingTemplate.country}
                    onChange={(e) => handleFieldChange('country', e.target.value)}
                    placeholder="Enter country"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Address
                </label>
                <Input
                  value={editingTemplate.fullAddress || ''}
                  onChange={(e) => handleFieldChange('fullAddress', e.target.value)}
                  placeholder="Enter full address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Photo URL
                </label>
                <Input
                  value={editingTemplate.photoUrl || ''}
                  onChange={(e) => handleFieldChange('photoUrl', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Star Rating *
                  </label>
                  <Select 
                    value={editingTemplate.stars.toString()} 
                    onValueChange={(value) => handleFieldChange('stars', Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <SelectItem key={star} value={star.toString()}>
                          {star} Star{star !== 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Currency *
                  </label>
                  <Select 
                    value={editingTemplate.currency} 
                    onValueChange={(value) => handleFieldChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingTemplate.featured}
                    onCheckedChange={(checked) => handleFieldChange('featured', checked)}
                  />
                  <label className="text-sm font-medium text-slate-700">
                    Featured
                  </label>
                </div>
              </div>

              {/* Financial Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    GFA (sqm)
                  </label>
                  <Input
                    type="number"
                    value={editingTemplate.gfaSqm || ''}
                    onChange={(e) => handleFieldChange('gfaSqm', Number(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Purchase Price
                  </label>
                  <Input
                    type="number"
                    value={editingTemplate.purchasePrice || ''}
                    onChange={(e) => handleFieldChange('purchasePrice', Number(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              {/* Rooms Section */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Room Breakdown
                    </label>
                    <div className="text-lg font-semibold text-slate-900">
                      {editingTemplate.roomsTotal} rooms total
                    </div>
                    <div className="text-xs text-slate-500">
                      {editingTemplate.roomBreakdown.map(r => `${r.count} ${r.type}`).join(' • ')}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRoomEditor(true)}
                    className="flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Rooms</span>
                  </Button>
                </div>
              </div>

              {/* Facilities Section */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Facilities
                    </label>
                    {editingTemplate.facilities.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">
                        No facilities selected yet.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {editingTemplate.facilities.map((facility) => (
                          <Badge
                            key={facility}
                            variant="secondary"
                            className="bg-slate-100 text-slate-700"
                          >
                            {facility}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFacilitiesEditor(true)}
                    className="flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Facilities</span>
                  </Button>
                </div>
              </div>

              {/* Visibility Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={editingTemplate.showInTemplates}
                    onCheckedChange={(checked) => handleFieldChange('showInTemplates', checked)}
                  />
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Show in Property Templates
                    </label>
                    <p className="text-xs text-slate-500">
                      Available in Create Deal template selection
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={editingTemplate.showInGallery}
                    onCheckedChange={(checked) => handleFieldChange('showInGallery', checked)}
                  />
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Show in Property Gallery
                    </label>
                    <p className="text-xs text-slate-500">
                      Visible on public property gallery page
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-brand-600 hover:bg-brand-700 text-white flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Template</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Room Mix Editor Modal */}
      <RoomMixEditor
        isOpen={showRoomEditor}
        onClose={() => setShowRoomEditor(false)}
        roomTypes={getRoomTypesForEditor()}
        onSave={handleRoomBreakdownSave}
      />

      {/* Facilities Editor Modal */}
      <FacilitiesEditor
        isOpen={showFacilitiesEditor}
        onClose={() => setShowFacilitiesEditor(false)}
        facilities={editingTemplate?.facilities || []}
        onSave={handleFacilitiesSave}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Template"
        message="Are you sure you want to delete this property template? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </div>
  );
}