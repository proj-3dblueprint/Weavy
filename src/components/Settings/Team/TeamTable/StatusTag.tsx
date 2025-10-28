import { useMemo } from 'react';
import { color } from '@/colors';
import { Tag } from '@/UI/Tag/Tag';
import { TeamMemberStatus } from '@/enums/team-member-status.enum';

interface StatusTagProps {
  status: TeamMemberStatus;
}

export const StatusTag = ({ status }: StatusTagProps) => {
  const bgColor = useMemo(() => {
    switch (status) {
      case TeamMemberStatus.ACTIVE:
        return color.Active_Tag_BG;
      case TeamMemberStatus.INVITED:
        return color.Yellow64;
    }
  }, [status]);

  const textColor = useMemo(() => {
    switch (status) {
      case TeamMemberStatus.ACTIVE:
        return color.Active_Tag_Text;
      case TeamMemberStatus.INVITED:
        return color.Invited_Tag_Text;
    }
  }, [status]);

  return <Tag text={status} bgColor={bgColor} textColor={textColor} minWidth={60} variant="large" />;
};
