// Plan pricing service
export interface PlanPricing {
  mensal: number;
  trimestral: number;
  anual: number;
}

// Default plan prices
export const DEFAULT_PLAN_PRICING: PlanPricing = {
  mensal: 100,
  trimestral: 250,
  anual: 900,
};

// Get current plan pricing (in a real app, this would come from a database)
export function getCurrentPlanPricing(): PlanPricing {
  // In a real application, this would fetch from a database or API
  // For now, we'll use the default values
  return DEFAULT_PLAN_PRICING;
}

// Get the price for a specific plan type
export function getPlanPrice(planType: string): number {
  const pricing = getCurrentPlanPricing();
  
  switch (planType.toLowerCase()) {
    case 'mensal':
      return pricing.mensal;
    case 'trimestral':
      return pricing.trimestral;
    case 'anual':
      return pricing.anual;
    default:
      return 0; // Default to 0 if plan type is not recognized
  }
}

// Calculate total revenue based on members and their plans
export function calculateRevenueFromMembers(members: any[]): number {
  return members.reduce((total, member) => {
    // Only include revenue from members with active plans
    const planStatus = getPaymentStatus(member.paymentDate, member.plan);
    if (planStatus.label !== "Inativo" && planStatus.label !== "Vencido") {
      return total + getPlanPrice(member.plan);
    }
    return total; // Don't add revenue for inactive or expired members
  }, 0);
}

// Get the plan status based on renewal date
export function getPlanStatus(planRenewalDate: string) {
  // Parse dates to avoid timezone issues
  const today = new Date();
  const [renewalYear, renewalMonth, renewalDay] = planRenewalDate.split('-').map(Number);
  const renewalDate = new Date(renewalYear, renewalMonth - 1, renewalDay); // month is 0-indexed in JS Date

  const diffTime = renewalDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < -7) {
    // Mais de 7 dias atrasado - membro inativo
    return {
      label: "Inativo",
      variant: "destructive"
    };
  } else if (diffDays < 0) {
    // Menos de 7 dias atrasado - vencido
    return {
      label: "Vencido",
      variant: "secondary"
    };
  } else if (diffDays <= 7) {
    // A vencer em até 7 dias - aviso
    return {
      label: `Vence em ${diffDays} dia(s)`,
      variant: "default"
    };
  } else {
    // Mais de 7 dias para vencer - normal
    return {
      label: "Ativo",
      variant: "default"
    };
  }
}

// Get the payment status based on payment date and plan
export function getPaymentStatus(paymentDate: string, plan: string) {
  // Parse dates to avoid timezone issues
  const today = new Date();
  const [paymentYear, paymentMonth, paymentDay] = paymentDate.split('-').map(Number);
  const paymentDateObj = new Date(paymentYear, paymentMonth - 1, paymentDay); // month is 0-indexed in JS Date

  // Calculate when the plan should renew based on the payment date and plan type
  let renewalYear = paymentYear;
  let renewalMonth = paymentMonth - 1; // month is 0-indexed in JS Date
  let renewalDay = paymentDay;

  switch (plan.toLowerCase()) {
    case 'mensal':
      renewalMonth += 1;
      break;
    case 'trimestral':
      renewalMonth += 3;
      break;
    case 'anual':
      renewalYear += 1;
      break;
    default:
      renewalMonth += 1; // Default to monthly
  }

  // Handle month overflow
  const renewalDate = new Date(renewalYear, renewalMonth, renewalDay);

  const diffTime = renewalDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < -7) {
    // Mais de 7 dias atrasado - membro inativo
    return {
      label: "Inativo",
      variant: "destructive"
    };
  } else if (diffDays < 0) {
    // Menos de 7 dias atrasado - vencido
    return {
      label: "Vencido",
      variant: "secondary"
    };
  } else if (diffDays <= 7) {
    // A vencer em até 7 dias - aviso
    return {
      label: `Vence em ${diffDays} dia(s)`,
      variant: "default"
    };
  } else {
    // Mais de 7 dias para vencer - normal
    return {
      label: "Ativo",
      variant: "default"
    };
  }
}

// Get plan pricing breakdown by plan type
export function getPlanPricingBreakdown(members: any[]): Record<string, { count: number; total: number; activeCount: number }> {
  const breakdown: Record<string, { count: number; total: number; activeCount: number }> = {
    Mensal: { count: 0, total: 0, activeCount: 0 },
    Trimestral: { count: 0, total: 0, activeCount: 0 },
    Anual: { count: 0, total: 0, activeCount: 0 },
  };

  members.forEach(member => {
    const planType = member.plan;
    if (breakdown[planType]) {
      breakdown[planType].count += 1;

      // Only count as active and add to revenue if the plan is not expired or inactive
      const planStatus = getPaymentStatus(member.paymentDate, member.plan);
      if (planStatus.label !== "Inativo" && planStatus.label !== "Vencido") {
        breakdown[planType].activeCount += 1;
        breakdown[planType].total += getPlanPrice(planType);
      }
    }
  });

  return breakdown;
}

// Generate financial records based on member payment dates
export function generateFinancialRecordsFromMembers(members: any[]): any[] {
  const financialRecords: any[] = [];

  members.forEach(member => {
    // Check if member has required fields
    if (!member.plan || !member.paymentDate || !member.name || !member.id) {
      console.warn('Member missing required fields for financial record generation:', member);
      return; // Skip this member if required fields are missing
    }

    // Create a financial record for each member's payment
    const planPrice = getPlanPrice(member.plan);

    // Create a financial record based on the actual payment date
    financialRecords.push({
      id: `payment-${member.id}-${member.paymentDate}`,
      date: member.paymentDate,
      description: `Mensalidade - ${member.name}`,
      type: 'Receita',
      amount: planPrice,
      category: member.plan === 'Anual' ? 'Mensalidades Anuais' :
               member.plan === 'Trimestral' ? 'Mensalidades Trimestrais' : 'Mensalidades',
      userId: member.userId || 'user-1' // Default to user-1 if not specified
    });
  });

  return financialRecords;
}