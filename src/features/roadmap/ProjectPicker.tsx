import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Building2, MapPin } from "lucide-react";
import { getProjects, setSelectedProjectId } from "../../lib/roadmapStore";

export default function ProjectPicker() {
  const nav = useNavigate();
  const projects = getProjects();

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    nav(`/roadmap/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 max-w-4xl py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Development Roadmap</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Select a project to view and manage your hotel development roadmap
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {projects.map(project => (
            <Card key={project.id} className="border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    {(project.city || project.country) && (
                      <div className="flex items-center space-x-1 text-sm text-slate-600 mt-1">
                        <MapPin className="h-4 w-4" />
                        <span>{[project.city, project.country].filter(Boolean).join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleProjectSelect(project.id)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                >
                  Open Roadmap
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏗️</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Projects Yet</h2>
            <p className="text-slate-600">Projects will be available once you start creating hotel deals.</p>
          </div>
        )}
      </div>
    </div>
  );
}