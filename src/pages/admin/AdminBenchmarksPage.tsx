import React, { useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useBenchmarksStore } from '../../features/benchmarks/store';
import BenchmarksTopBar from '../../features/benchmarks/components/BenchmarksTopBar';
import CapexTable from '../../features/benchmarks/components/CapexTable';
import OpexTable from '../../features/benchmarks/components/OpexTable';
import PayrollTable from '../../features/benchmarks/components/PayrollTable';

export default function AdminBenchmarksPage() {
  const currentSetId = useBenchmarksStore(s => s.currentSetId);
  const refresh = useBenchmarksStore(s => s.refresh);

  useEffect(() => {
    if (refresh) {
      refresh();
    }
  }, [currentSetId, refresh]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Benchmarks Manager</h2>
        <p className="text-sm text-slate-600">
          Manage CapEx, OpEx (USALI), and Payroll benchmarks by country and property type
        </p>
      </div>

      {/* Top Bar */}
      <BenchmarksTopBar />

      {/* Content */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <Tabs defaultValue="capex" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="capex">CapEx</TabsTrigger>
              <TabsTrigger value="opex">OpEx (USALI)</TabsTrigger>
              <TabsTrigger value="payroll">Payroll</TabsTrigger>
            </TabsList>

            <TabsContent value="capex" className="space-y-4">
              <CapexTable />
            </TabsContent>
            
            <TabsContent value="opex" className="space-y-4">
              <OpexTable />
            </TabsContent>
            
            <TabsContent value="payroll" className="space-y-4">
              <PayrollTable />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}