import { features } from "../data/features";
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function FeatureCards() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <Card key={feature.id} className="border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center justify-center rounded-xl bg-slate-100 p-3">
                  <Icon className="h-6 w-6 text-slate-600" aria-hidden />
                </div>
                {feature.comingSoon && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    Coming soon
                  </span>
                )}
              </div>
              <CardTitle className="text-lg">
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}