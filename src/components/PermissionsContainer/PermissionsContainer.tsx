import { ReactNode } from 'react';
import { Permission, SubscriptionPermissions } from '@/types/permission';
import { useSubscriptionPermissions } from '@/hooks/useSubscriptionPermissions';

interface PermissionsContainerProps {
  permission: keyof SubscriptionPermissions;
  type?: keyof Permission;
  children: ReactNode;
}

export const PermissionsContainer = ({ permission, type = 'view', children }: PermissionsContainerProps) => {
  const { isAllowedForPermission } = useSubscriptionPermissions();
  if (isAllowedForPermission(permission, type)) {
    return children;
  }
};
