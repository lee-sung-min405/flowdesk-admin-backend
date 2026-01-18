export interface SafeUser {
  userSeq: number;
  tenantId: number;
  tenantName?: string | null;
  userId: string;
  userName: string;
  corpName: string;
  userEmail?: string | null;
  userTel?: string | null;
  userHp?: string | null;
  isActive: number;
  regDtm: Date;
  tokenVersion?: number;
}
