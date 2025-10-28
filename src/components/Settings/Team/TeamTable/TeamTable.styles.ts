import { TableCell, TableRow } from '@mui/material';
import { styled } from '@mui/material/styles';

export const StyledTableRow = styled(TableRow)(() => ({
  height: '60px',
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

export const StyledTableCell = styled(TableCell)(() => ({
  padding: '0',
}));
