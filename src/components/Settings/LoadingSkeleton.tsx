import { Skeleton, Table, TableCell, TableHead, TableRow } from '@mui/material';
import { FlexCenVer, FlexColCenHor } from '@/UI/styles';

export const LoadingSkeleton = () => (
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>
          <FlexCenVer sx={{ justifyContent: 'flex-start', gap: 1 }}>
            <Skeleton variant="circular" width="32px" height="32px" />
            <FlexColCenHor>
              <Skeleton variant="text" width="200px" height="24px" />
              <Skeleton variant="text" width="200px" height="12px" />
            </FlexColCenHor>
          </FlexCenVer>
        </TableCell>
        <TableCell width="200px">
          <Skeleton variant="text" height="48px" />
        </TableCell>
        <TableCell width="100px">
          <Skeleton variant="text" height="48px" />
        </TableCell>
        <TableCell width="100px">
          <Skeleton variant="text" height="48px" />
        </TableCell>
      </TableRow>
    </TableHead>
  </Table>
);
