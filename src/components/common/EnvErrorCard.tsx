import React from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

interface EnvErrorCardProps {
  title?: string;
  message?: string;
  suggestions?: string[];
}

export default function EnvErrorCard({ 
  title = "Configuration Required",
  message = "Missing required environment variables for Supabase integration.",
  suggestions = [
    "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file",
    "Or switch to mock data by setting VITE_DATA_SOURCE=mock",
    "Check the .env.example file for reference"
  ]
}: EnvErrorCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-2xl w-full border-amber-200 bg-amber-50">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
            <div>
              <CardTitle className="text-xl text-amber-900">{title}</CardTitle>
              <p className="text-amber-800 mt-1">{message}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-amber-900 mb-3">To fix this:</h3>
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span className="text-amber-800 text-sm">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-amber-100 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-900 mb-2">Environment Variables Needed:</h4>
            <div className="space-y-1 font-mono text-sm text-amber-800">
              <div>VITE_SUPABASE_URL=your_supabase_url</div>
              <div>VITE_SUPABASE_ANON_KEY=your_anon_key</div>
              <div className="text-amber-600 mt-2">Or:</div>
              <div>VITE_DATA_SOURCE=mock</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              onClick={() => window.location.reload()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Reload App
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open("https://supabase.com/docs/guides/getting-started", "_blank")}
              className="flex items-center space-x-2 border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Supabase Docs</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}