export interface CommissionsError {
  statusCode: number;
  message: string;
}

export interface CommissionBucket {
  schemeKey: string;
  schemeName: string;
  amountNet: number;
  goal: number | null;
  compliance: number | null;
  levelName: string | null;
  percent: number;
  commission: number;
  operationsCount: number;
}

export interface MyCommissionSummary {
  period: string;
  /** true = cifras del cierre mensual; false = proyección en vivo. */
  closed: boolean;
  isManager: boolean;
  isNewHire: boolean;
  totalCommission: number;
  buckets: CommissionBucket[];
}

export interface CommissionOperationRow {
  id: number;
  saleId: number;
  rfc: string;
  clientName: string | null;
  saleDate: string;
  operationType: string;
  segment: string | null;
  /** Base que comisiona, sin IVA (en venta regalo = precio de lista). */
  amountNet: number;
  /** Lo realmente cobrado al cliente, sin IVA. $0 en venta regalo. */
  amountCharged: number;
  status: string;
  assignmentSource: string;
  vendorCodeUsed: string | null;
}

export interface TeamMemberProgress {
  userId: string;
  name: string;
  segment: string | null;
  channel: string | null;
  isEligible: boolean;
  isNewHire: boolean;
  amountNet: number;
  goal: number | null;
  compliance: number | null;
  operationsCount: number;
}

export interface TeamCommissionSummary {
  period: string;
  teamGoal: number | null;
  eligibleCount: number;
  incorporationCount: number;
  teamAmountNet: number;
  teamCompliance: number | null;
  unassignedOperations: number;
  members: TeamMemberProgress[];
}
