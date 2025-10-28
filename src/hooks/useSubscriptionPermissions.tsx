import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { User, WorkspaceRole } from '@/types/auth.types';
import { Permission, SubscriptionPermissions } from '@/types/permission';
import { SubscriptionType } from '@/types/shared';
import { CreditsContext } from '@/services/CreditsContext';

interface PermissionsContextType {
  creditsPermissions: Permission;
  planPermissions: Permission;
  seatsPermissions: Permission;
  managePaymentsPermissions: Permission;
  modelBlockingPermissions: Permission;
  isAllowedForPermission: (permission: keyof SubscriptionPermissions, action: keyof Permission) => boolean;
  isActionAllowed: (allowedFor: SubscriptionType[]) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType>({
  creditsPermissions: { view: false, action: false },
  planPermissions: { view: false, action: false },
  seatsPermissions: { view: false, action: false },
  managePaymentsPermissions: { view: false, action: false },
  modelBlockingPermissions: { view: false, action: false },
  isAllowedForPermission: () => false,
  isActionAllowed: () => false,
});

interface SubscriptionPermissionsProviderProps {
  user: User | null;
  children: ReactNode;
}

export const SubscriptionPermissionsProvider: React.FC<SubscriptionPermissionsProviderProps> = ({ user, children }) => {
  const { shouldShowCreditsToMembers } = useContext(CreditsContext);

  const [creditsPermissions, setCreditsPermissions] = useState<Permission>({ view: false, action: false });
  const [planPermissions, setPlanPermissions] = useState<Permission>({ view: false, action: false });
  const [seatsPermissions, setSeatsPermissions] = useState<Permission>({ view: false, action: false });
  const [modelBlockingPermissions, setModelBlockingPermissions] = useState<Permission>({
    view: false,
    action: false,
  });
  const [managePaymentsPermissions, setManagePaymentsPermissions] = useState<Permission>({
    view: false,
    action: false,
  });

  const initCreditsPermissions = useCallback(() => {
    if (!user?.activeWorkspace) {
      return;
    }

    const { role, subscription } = user.activeWorkspace;
    if (!subscription) {
      return setCreditsPermissions({
        view: shouldShowCreditsToMembers || role === WorkspaceRole.Admin,
        action: role === WorkspaceRole.Admin,
      });
    }
    const { type: subType } = subscription;
    if (!subType) {
      return;
    }

    let res = { view: false, action: false };
    if (subType === SubscriptionType.Free || subType === SubscriptionType.Starter || subType === SubscriptionType.Pro) {
      res = { view: true, action: true };
    } else if (subType === SubscriptionType.Team || subType === SubscriptionType.Enterprise) {
      res = { view: shouldShowCreditsToMembers || role === WorkspaceRole.Admin, action: role === WorkspaceRole.Admin };
    }

    setCreditsPermissions(res);
  }, [user?.activeWorkspace, shouldShowCreditsToMembers]);

  const initPlanPermissions = useCallback(() => {
    if (!user?.activeWorkspace) {
      return;
    }

    const { role, subscription } = user.activeWorkspace;
    if (!subscription) {
      return;
    }
    const { type: subType } = subscription;
    if (!subType) {
      return;
    }

    let res = { view: false, action: false };

    if (subType === SubscriptionType.Enterprise) {
      res = { view: true, action: false };
    } else {
      res = { view: true, action: role === WorkspaceRole.Admin };
    }

    setPlanPermissions(res);
  }, [user?.activeWorkspace]);

  const initSeatsPermissions = useCallback(() => {
    if (!user?.activeWorkspace) {
      return;
    }

    const { role, subscription } = user.activeWorkspace;
    if (!subscription) {
      return;
    }
    const { type: subType } = subscription;
    if (!subType) {
      return;
    }

    let res = { view: false, action: false };
    if (subType === SubscriptionType.Free || subType === SubscriptionType.Starter || subType === SubscriptionType.Pro) {
      res = { view: false, action: true };
    } else if (subType === SubscriptionType.Team || subType === SubscriptionType.Enterprise) {
      res = { view: true, action: subType === SubscriptionType.Team && role === WorkspaceRole.Admin };
    }

    setSeatsPermissions(res);
  }, [user?.activeWorkspace]);

  const initManagePaymentsPermissions = useCallback(() => {
    if (!user?.activeWorkspace) {
      return;
    }

    const { role, subscription } = user.activeWorkspace;
    if (!subscription) {
      return;
    }
    const { type: subType } = subscription;
    if (!subType) {
      return;
    }

    let res = { view: false, action: false };
    if (subType === SubscriptionType.Starter || subType === SubscriptionType.Pro || subType === SubscriptionType.Team) {
      res = { view: true, action: role === WorkspaceRole.Admin };
    }
    setManagePaymentsPermissions(res);
  }, [user?.activeWorkspace]);

  const initModelBlockingPermissions = useCallback(() => {
    if (!user?.activeWorkspace) {
      return;
    }
    const { subscription } = user.activeWorkspace;
    if (!subscription) {
      return;
    }
    const { type: subType } = subscription;
    if (!subType) {
      return;
    }

    setModelBlockingPermissions({
      view: subType === SubscriptionType.Enterprise && !!user.activeWorkspace.isModelBlockingEnabled,
      action: subType === SubscriptionType.Enterprise && !!user.activeWorkspace.isModelBlockingEnabled,
    });
  }, [user?.activeWorkspace]);

  useEffect(() => {
    initCreditsPermissions();
    initPlanPermissions();
    initSeatsPermissions();
    initManagePaymentsPermissions();
    initModelBlockingPermissions();
  }, [
    initCreditsPermissions,
    initPlanPermissions,
    initSeatsPermissions,
    initManagePaymentsPermissions,
    user,
    initModelBlockingPermissions,
  ]);

  /**
   * This function checks if a permission is allowed for the current subscription type
   * @param permission - the permission to check
   * @param action - the action to check
   * @returns true if the permission is allowed for the current subscription type
   */
  const isAllowedForPermission = (permission: keyof SubscriptionPermissions, action: keyof Permission): boolean => {
    switch (permission) {
      case 'credits':
        return creditsPermissions[action];
      case 'plan':
        return planPermissions[action];
      case 'seats':
        return seatsPermissions[action];
      case 'managePayments':
        return managePaymentsPermissions[action];
      case 'modelBlocking':
        return modelBlockingPermissions[action];
      default:
        return false;
    }
  };

  /**
   * This function checks if an arbitrary action is allowed for the current subscription type
   * Use this for any arbitrary action that is not covered by built in permissions
   * @param allowedFor - list of subscription types that are allowed to access the action
   */
  const isActionAllowed = (allowedFor: SubscriptionType[]): boolean => {
    if (!user?.activeWorkspace?.subscription?.type) {
      return false;
    }
    return allowedFor.includes(user?.activeWorkspace?.subscription?.type);
  };

  const value = {
    creditsPermissions,
    planPermissions,
    seatsPermissions,
    managePaymentsPermissions,
    modelBlockingPermissions,
    isAllowedForPermission,
    isActionAllowed,
  };

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
};

export const useSubscriptionPermissions = (): PermissionsContextType => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('useSubscriptionPermissions must be used within a SubscriptionPermissionsProvider');
  }
  return context;
};
