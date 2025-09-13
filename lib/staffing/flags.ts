import { RequiredStaffing } from './types';
import { THRESHOLDS } from './benchmarks';

export type StaffingStatus = 'ok' | 'tight' | 'understaffed' | 'overstaffed' | 'critical';

export function assessStaffingGap(gapFTE: number): StaffingStatus {
  if (gapFTE >= THRESHOLDS.gapCriticalFTE) return 'critical';
  if (gapFTE >= THRESHOLDS.gapWarningFTE) return 'understaffed';
  if (gapFTE <= THRESHOLDS.overstaffAmberFTE) return 'overstaffed';
  return 'ok';
}

export function getStatusColor(status: StaffingStatus): string {
  switch (status) {
    case 'ok': return 'text-green-600 bg-green-50 border-green-200';
    case 'tight': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'understaffed': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'overstaffed': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

export function getStatusIcon(status: StaffingStatus): string {
  switch (status) {
    case 'ok': return '✅';
    case 'tight': return '⚠️';
    case 'understaffed': return '🔶';
    case 'overstaffed': return '🔵';
    case 'critical': return '⛔';
    default: return '❓';
  }
}

export function getStatusLabel(status: StaffingStatus): string {
  switch (status) {
    case 'ok': return 'OK';
    case 'tight': return 'Tight';
    case 'understaffed': return 'Understaffed';
    case 'overstaffed': return 'Overstaffed';
    case 'critical': return 'Critical';
    default: return 'Unknown';
  }
}

export function getSuggestedAction(staffing: RequiredStaffing): string {
  const gap = staffing.gapFTE;
  
  if (gap >= 0.5) {
    return `Hire +${gap.toFixed(1)} FTE or add part-time coverage`;
  } else if (gap >= 0.2) {
    return `Add +${gap.toFixed(1)} FTE or extend existing hours`;
  } else if (gap <= -0.5) {
    return `Consider reducing ${(-gap).toFixed(1)} FTE or expanding service`;
  } else if (gap <= -0.3) {
    return `Slight overstaffing of ${(-gap).toFixed(1)} FTE`;
  } else {
    return 'Staffing levels appropriate';
  }
}

export function getHardRuleFlags(staffing: RequiredStaffing[]): Array<{
  type: 'error' | 'warning';
  message: string;
  dept: string;
}> {
  const flags = [];
  
  // Check 24/7 coverage impossibility
  const frontOffice = staffing.find(s => s.dept === 'frontOffice');
  if (frontOffice && frontOffice.gapFTE >= 1.0) {
    flags.push({
      type: 'error' as const,
      message: 'Impossible to cover 24/7 shifts with current staffing',
      dept: 'frontOffice'
    });
  }
  
  // Check F&B service with no staff
  const fbService = staffing.find(s => s.dept === 'fbService');
  const kitchen = staffing.find(s => s.dept === 'kitchen');
  
  if (fbService && fbService.requiredFTE > 0 && fbService.providedFTE === 0) {
    flags.push({
      type: 'error' as const,
      message: 'Active F&B service periods but no service staff assigned',
      dept: 'fbService'
    });
  }
  
  if (kitchen && kitchen.requiredFTE > 0 && kitchen.providedFTE === 0) {
    flags.push({
      type: 'error' as const,
      message: 'Active F&B service periods but no kitchen staff assigned',
      dept: 'kitchen'
    });
  }
  
  // Check housekeeping productivity outliers
  const housekeeping = staffing.find(s => s.dept === 'housekeeping');
  if (housekeeping && housekeeping.providedFTE > 0) {
    // Calculate actual rooms per FTE based on provided staffing
    const roomsPerFTE = housekeeping.providedFTE > 0 ? 
      (housekeeping.requiredFTE * 15) / housekeeping.providedFTE : 0; // 15 rooms baseline per required FTE
    
    if (roomsPerFTE < 10) {
      flags.push({
        type: 'warning' as const,
        message: 'Housekeeping productivity is low (< 10 rooms/FTE)',
        dept: 'housekeeping'
      });
    } else if (roomsPerFTE > 25) {
      flags.push({
        type: 'warning' as const,
        message: 'Housekeeping productivity looks unrealistically high (> 25 rooms/FTE)',
        dept: 'housekeeping'
      });
    }
  }
  
  return flags;
}