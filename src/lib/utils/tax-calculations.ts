export type EmployeeTaxBreakdown = {
  gross: number;
  pension: number;
  kerenHishtalmut: number;
  bituahLeumi: number;
  totalDeductions: number;
  net: number;
};

export type FreelanceTaxBreakdown = {
  gross: number;
  pensionTarget: number;
  kerenHishtalmut: number;
  bituahLeumi: number;
  incomeTaxBuffer: number;
  totalAllocations: number;
  remainingNet: number;
};

export type TaxBreakdown = {
  employee: EmployeeTaxBreakdown;
  freelance: FreelanceTaxBreakdown;
};

const EMPLOYEE_PENSION_RATE = 0.07;
const EMPLOYEE_KEREN_HISHTALMUT_RATE = 0.025;
const EMPLOYEE_BITUAH_LEUMI_RATE = 0.035;

const FREELANCE_PENSION_TARGET_RATE = 0.1;
const FREELANCE_KEREN_HISHTALMUT_RATE = 0.045;
const FREELANCE_BITUAH_LEUMI_RATE = 0.1;
const FREELANCE_INCOME_TAX_BUFFER_RATE = 0.055;

export function calculateTaxBreakdown(
  totalEmployeeGross: number,
  totalFreelanceGross: number
): TaxBreakdown {
  const pension = totalEmployeeGross * EMPLOYEE_PENSION_RATE;
  const kerenHishtalmut = totalEmployeeGross * EMPLOYEE_KEREN_HISHTALMUT_RATE;
  const bituahLeumi = totalEmployeeGross * EMPLOYEE_BITUAH_LEUMI_RATE;
  const employeeTotalDeductions = pension + kerenHishtalmut + bituahLeumi;

  const employee: EmployeeTaxBreakdown = {
    gross: totalEmployeeGross,
    pension,
    kerenHishtalmut,
    bituahLeumi,
    totalDeductions: employeeTotalDeductions,
    net: totalEmployeeGross - employeeTotalDeductions,
  };

  const pensionTarget = totalFreelanceGross * FREELANCE_PENSION_TARGET_RATE;
  const freelanceKerenHishtalmut =
    totalFreelanceGross * FREELANCE_KEREN_HISHTALMUT_RATE;
  const freelanceBituahLeumi = totalFreelanceGross * FREELANCE_BITUAH_LEUMI_RATE;
  const incomeTaxBuffer = totalFreelanceGross * FREELANCE_INCOME_TAX_BUFFER_RATE;
  const freelanceTotalAllocations =
    pensionTarget + freelanceKerenHishtalmut + freelanceBituahLeumi + incomeTaxBuffer;

  const freelance: FreelanceTaxBreakdown = {
    gross: totalFreelanceGross,
    pensionTarget,
    kerenHishtalmut: freelanceKerenHishtalmut,
    bituahLeumi: freelanceBituahLeumi,
    incomeTaxBuffer,
    totalAllocations: freelanceTotalAllocations,
    remainingNet: totalFreelanceGross - freelanceTotalAllocations,
  };

  return { employee, freelance };
}
