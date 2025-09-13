import React from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

export default function DealGuard({
  status,
}: {
  status: "missingId" | "notFound";
}) {
  const navigate = useNavigate();
  
  const msg =
    status === "missingId"
      ? "No deal selected. Please go back to the dashboard and open a deal."
      : "We couldn't find this deal. It may have been removed.";
      
  return (
    <div className="w-full max-w-[95vw] mx-auto rounded-xl border border-slate-200 bg-white p-6">
      <div className="text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Deal Not Available</h2>
          <p className="text-sm text-slate-600">{msg}</p>
        </div>
        <Button 
          onClick={() => navigate('/underwriting')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Deals</span>
        </Button>
      </div>
    </div>
  );
}