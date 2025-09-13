import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Building2, MapPin, ExternalLink } from "lucide-react";
import { listDeals } from "../../lib/dealStore";
import { useAuth } from "../../auth/useAuth";

const intro = `Here we distill our experience into a standard process that takes you from an initial idea to a successfully operating hotel. We'll keep uploading templates, adding new steps, and improving guidance over time. Start by linking a project you've created in Underwriting, or explore the roadmap without tying it to a deal.`;

export default function UserRoadmapLanding() {
  const nav = useNavigate();
  const { user } = useAuth();
  const deals = listDeals(); // Get deals from existing store
  
  const hasDeals = Array.isArray(deals) && deals.length > 0;
  const [selectedId, setSelectedId] = useState<string>("");

  const options = useMemo(
    () => (hasDeals ? deals.map((d) => ({ id: d.id, name: d.name })) : []),
    [hasDeals, deals]
  );

  return (
    <div className="container mx-auto px-4 max-w-4xl py-8">
        <div className="text-center mb-12">
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            {intro}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Link a Project Card */}
          <Card className="border-slate-200 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Link a Project</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasDeals ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Choose your project
                    </label>
                    <select
                      value={selectedId}
                      onChange={(e) => setSelectedId(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    >
                      <option value="" disabled>Select a project…</option>
                      {options.map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Show selected project details */}
                  {selectedId && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      {(() => {
                        const selectedDeal = deals.find(d => d.id === selectedId);
                        if (!selectedDeal) return null;
                        
                        return (
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <MapPin className="h-4 w-4" />
                            <span>{selectedDeal.location}</span>
                            <span>•</span>
                            <span>{selectedDeal.roomTypes?.reduce((sum, rt) => sum + rt.rooms, 0) || 0} rooms</span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  
                  <Button 
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white" 
                    disabled={!selectedId}
                    onClick={() => nav(`/roadmap/${selectedId}`)}
                  >
                    Open Roadmap for this Project
                  </Button>
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-600 mb-4">
                    You don't have any projects yet. Create one in{" "}
                    <span className="font-semibold text-brand-600">Underwriting</span>, then return here to link it.
                  </p>
                  {user && (
                    <Button 
                      variant="outline" 
                      onClick={() => nav("/underwriting")}
                      className="flex items-center space-x-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Go to Underwriting</span>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Explore Card */}
          <Card className="border-slate-200 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Just Explore</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Browse the roadmap structure and example steps without connecting to a specific project. 
                Perfect for understanding the hotel development process.
              </p>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500 space-y-1">
                  <div>• View all development phases</div>
                  <div>• See example timelines and milestones</div>
                  <div>• Understand the hotel opening process</div>
                </div>
              </div>
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={() => nav("/roadmap/explore")}
              >
                Explore Without Project
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">What's in the Roadmap?</h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-slate-600">
              <div>
                <div className="font-medium text-slate-900 mb-1">6 Development Phases</div>
                <div>From ideation to pre-opening, covering every major milestone</div>
              </div>
              <div>
                <div className="font-medium text-slate-900 mb-1">Detailed Steps</div>
                <div>Specific tasks, timelines, and deliverables for each phase</div>
              </div>
              <div>
                <div className="font-medium text-slate-900 mb-1">Expert Guidance</div>
                <div>Best practices from successful hotel development projects</div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}