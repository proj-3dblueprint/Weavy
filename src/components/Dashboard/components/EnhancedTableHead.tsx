import { TableHead, TableRow, TableCell, TableSortLabel, Typography } from '@mui/material';
import { color } from '@/colors';
import type { EnhancedTableHeadProps, HeadCell, AllowedRecipeKeys } from '../types/listView.types';

export function EnhancedTableHead({ order, orderBy, onRequestSort, isWorkspaceFiles }: EnhancedTableHeadProps) {
  const createSortHandler = (property: AllowedRecipeKeys) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };

  const headCells: HeadCell[] = [
    {
      id: 'name',
      numeric: false,
      disablePadding: true,
      label: 'Name',
    },
    ...(isWorkspaceFiles
      ? [
          {
            id: 'ownerName' as AllowedRecipeKeys,
            numeric: false,
            disablePadding: false,
            label: 'Owned by',
          },
        ]
      : []),
    {
      id: 'files' as AllowedRecipeKeys,
      numeric: true,
      disablePadding: false,
      label: 'Files',
    },
    {
      id: 'updatedAt',
      numeric: true,
      disablePadding: false,
      label: 'Last modified',
    },
    {
      id: 'createdAt',
      numeric: true,
      disablePadding: false,
      label: 'Created at',
    },
  ];

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.id === 'name' ? 'left' : 'center'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
              sx={{
                justifyContent: headCell.id === 'name' ? 'flex-start' : 'center',
              }}
            >
              <Typography variant="label-sm-rg" color={color.White80_T}>
                {headCell.label}
              </Typography>
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}
