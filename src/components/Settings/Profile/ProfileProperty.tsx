import { FlexCol } from '@/UI/styles';
import { Input } from '@/UI/Input/Input';

interface ProfilePropertyProps {
  label: string;
  value: string;
}

function ProfileProperty({ label, value }: ProfilePropertyProps) {
  return (
    <FlexCol
      sx={{
        width: '300px',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
      }}
    >
      <Input label={label} value={value} disabled />
    </FlexCol>
  );
}
export default ProfileProperty;
