// import { UserRoles } from '@/enums/user-roles.enum';

export enum SubscriptionType {
  Free = 'free',
  Starter = 'starter',
  Pro = 'pro',
  Team = 'team',
  Enterprise = 'enterprise',
}
export enum BillingCycle {
  Monthly = 'monthly',
  Yearly = 'yearly',
}

export type Subscription = {
  type: SubscriptionType;
  name: string;
  seatsLimit: number;
  credits: number;
  startsAt: Date;
  expiresAt: Date;
};
