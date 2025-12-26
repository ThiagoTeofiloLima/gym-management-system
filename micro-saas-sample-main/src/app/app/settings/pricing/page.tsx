'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  DashboardPage,
  DashboardPageHeader,
  DashboardPageHeaderTitle,
  DashboardPageMain,
} from "@/components/dashboard/page";
import { DEFAULT_PLAN_PRICING, PlanPricing, getCurrentPlanPricing } from '@/services/plan-pricing';

export default function PricingSettingsPage() {
  const [planPricing, setPlanPricing] = useState<PlanPricing>(DEFAULT_PLAN_PRICING);
  const [isLoading, setIsLoading] = useState(true);

  // Load current plan pricing
  useEffect(() => {
    try {
      const currentPricing = getCurrentPlanPricing();
      setPlanPricing(currentPricing);
    } catch (error) {
      console.error('Error loading plan pricing:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (planType: keyof PlanPricing, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPlanPricing(prev => ({
      ...prev,
      [planType]: numValue
    }));
  };

  const handleSave = () => {
    // In a real application, this would save to a database or API
    alert('Plan pricing updated successfully!');
    console.log('New plan pricing:', planPricing);
  };

  if (isLoading) {
    return (
      <DashboardPage>
        <DashboardPageHeader>
          <DashboardPageHeaderTitle>Configurações de Preços</DashboardPageHeaderTitle>
        </DashboardPageHeader>
        <DashboardPageMain>
          <p>Carregando...</p>
        </DashboardPageMain>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage>
      <DashboardPageHeader>
        <DashboardPageHeaderTitle>Configurações de Preços</DashboardPageHeaderTitle>
      </DashboardPageHeader>

      <DashboardPageMain>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Preços dos Planos</CardTitle>
            <CardDescription>Configure os preços para cada tipo de plano</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="mensal" className="text-base">Mensal</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">R$</span>
                  <Input
                    id="mensal"
                    type="number"
                    value={planPricing.mensal}
                    onChange={(e) => handleInputChange('mensal', e.target.value)}
                    className="w-32 text-right"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="trimestral" className="text-base">Trimestral</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">R$</span>
                  <Input
                    id="trimestral"
                    type="number"
                    value={planPricing.trimestral}
                    onChange={(e) => handleInputChange('trimestral', e.target.value)}
                    className="w-32 text-right"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="anual" className="text-base">Anual</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">R$</span>
                  <Input
                    id="anual"
                    type="number"
                    value={planPricing.anual}
                    onChange={(e) => handleInputChange('anual', e.target.value)}
                    className="w-32 text-right"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={handleSave}>
                Salvar Preços
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardPageMain>
    </DashboardPage>
  );
}