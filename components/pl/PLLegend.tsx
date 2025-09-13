interface PLLegendProps {
  showRatios: boolean;
}

export default function PLLegend({ showRatios }: PLLegendProps) {
  if (!showRatios) return null;

  return (
    <div className="w-full rounded-lg bg-slate-50 border border-slate-200 p-4">
      <h4 className="font-semibold text-slate-900 mb-2">Ratio Legend</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
        <div>
          <span className="font-medium">% of TR:</span> Percentage of Total Revenue
        </div>
        <div>
          <span className="font-medium">/POR:</span> Per Occupied Room Night
        </div>
        <div>
          <span className="font-medium">/PR:</span> Per Room (key)
        </div>
      </div>
      <div className="mt-4 text-xs text-slate-500 border-t border-slate-200 pt-3">
        <strong>Note:</strong> POR divides by Rooms Sold; PR divides by number of rooms (keys) in operation. 
        Ratios help compare performance across different hotel sizes and markets.
      </div>
    </div>
  );
}