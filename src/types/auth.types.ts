import { BillingCycle, SubscriptionType } from './shared';
import type { TourKeys } from '@/components/ProductTours/tour-keys';
import type { UserTourStatus } from '@/enums/user-tour-status.enum';

export enum CreditsType {
  Monthly = 'monthly',
  Extra = 'extra',
  Rollover = 'rollover',
}

// Enum for user roles in workspace
export enum WorkspaceRole {
  Member = 'Member',
  Admin = 'Admin',
  Owner = 'Owner',
}

// Base workspace information
export interface BaseWorkspace {
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceRole;
  subscription: Subscription;
  isModelBlockingEnabled?: boolean;
}

interface Subscription {
  credits: number;
  expiresAt: Date;
  name: string;
  seatsLimit: number;
  billingCycle: BillingCycle;
  usedSeats: number;
  startsAt: Date;
  type: SubscriptionType;
  monthlyCredits: number;
  creditsPerDollar: number;
  scheduledDowngradeDate?: Date;
  scheduledDowngradePlan?: SubscriptionType;
  creditsList: { type: CreditsType; available: number; allocatedAmount: number; expiresAt: Date }[];
}

// Active workspace extends base workspace with additional properties
export interface ActiveWorkspace extends BaseWorkspace {
  preferences: {
    showCreditsToMembers: boolean;
    defaultMonthlyAllocatedCredits: number | null;
  };
  monthlyCreditsLimit?: number;
  hasCustomCreditsLimit?: boolean;
  userWorkspaceCreditsUsage: number;
}

// Tour data structure
export interface TourDetails {
  currentStep: number;
  status: UserTourStatus;
  customData: {
    context?: string;
    recipeId?: string;
  };
}

// User tours indexed by tour ID
type Tours = Record<TourKeys, TourDetails>;

// Type-safe user preferences interface
export interface UserPreferences {
  panOnScroll?: boolean;
  showFloatMenuOnRightClick?: boolean;
  requireAltKeyForSuggestions?: boolean;
}

// Type for user preference keys derived from the interface
export type UserPreferenceKey = keyof UserPreferences;

// Type for user preference values
export type UserPreferenceValue = boolean;

export interface EnrichedUserFields {
  id: string;
  activeWorkspace: ActiveWorkspace;
  createdAt: number;
  credits: number;
  name: string;
  subscriptionType: SubscriptionType;
  tours: Tours;
  workspaces: BaseWorkspace[];
  role: WorkspaceRole;
  preferences?: UserPreferences;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  accessToken?: string;
  getIdToken(forceRefresh?: boolean): Promise<string>;
}

export interface User extends AuthUser, EnrichedUserFields {}
