type Props = {
  title: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

export default function LabelCheck({ title, hint, checked, onChange }: Props) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
      <input 
        type="checkbox" 
        className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-500 rounded" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)} 
      />
      <div>
        <div className="text-sm font-medium text-slate-900">{title}</div>
        <div className="text-xs text-slate-600 mt-0.5">{hint}</div>
      </div>
    </label>
  );
}