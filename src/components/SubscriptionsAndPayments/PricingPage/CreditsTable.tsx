import React, { useEffect, useState } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

type CreditsTableData = { name: string; free: number; starter: number; professional: number; team: number };
const creditsTableData: CreditsTableData[] = [
  { name: 'Flux Fast', free: 375, starter: 3750, professional: 10000, team: 11250 },
  { name: 'Flux dev LoRA', free: 38, starter: 375, professional: 1000, team: 1125 },
  { name: 'Flux Kontext', free: 50, starter: 500, professional: 1333, team: 1500 },
  { name: 'Minimax Image 01', free: 150, starter: 1500, professional: 4000, team: 4500 },
  { name: 'Ideogram V3', free: 38, starter: 375, professional: 1000, team: 1125 },
  { name: 'GPT Image 1 Edit', free: 19, starter: 188, professional: 500, team: 563 },
  { name: 'Runway Gen-4 Image (references)', free: 25, starter: 250, professional: 667, team: 750 },
  { name: 'Mystic', free: 13, starter: 125, professional: 333, team: 375 },
  { name: 'Topaz Image Upscale', free: 8, starter: 79, professional: 211, team: 237 },
  { name: 'Magnific Upscale', free: 13, starter: 125, professional: 333, team: 375 },
  { name: 'Imagen 4', free: 25, starter: 250, professional: 667, team: 750 },
  { name: 'Seedance V1.0', free: 8, starter: 83, professional: 222, team: 250 },
  { name: 'Runway Gen-4 Turbo', free: 5, starter: 50, professional: 133, team: 150 },
  { name: 'Kling 2.1 standard', free: 6, starter: 60, professional: 160, team: 180 },
  { name: 'Minimax Hailuo 02', free: 5, starter: 47, professional: 125, team: 141 },
  { name: 'Topaz video', free: 13, starter: 125, professional: 333, team: 375 },
  { name: 'Wan VACE', free: 6, starter: 63, professional: 167, team: 188 },
  { name: 'Runway Act Two', free: 3, starter: 30, professional: 80, team: 90 },
  { name: 'Trellis 3D', free: 75, starter: 750, professional: 2000, team: 2250 },
  { name: 'Veo 3 fast', free: 1, starter: 13, professional: 33, team: 38 },
  { name: 'Veo 3', free: 0, starter: 5, professional: 13, team: 14 },
  { name: 'Rodin 3D', free: 3, starter: 31, professional: 83, team: 94 },
  { name: 'Hunyuan 3D', free: 8, starter: 83, professional: 222, team: 250 },
];

const StyledTable = styled(Table)({ backgroundColor: 'transparent' });

const StyledTableHead = styled(TableHead)({ backgroundColor: 'transparent' });

const StyledTableBody = styled(TableBody)({ backgroundColor: 'transparent' });

const StyledHeaderTableCell = styled(TableCell)({
  color: 'white',
  borderBottom: 'none',
  backgroundColor: 'transparent',
  textAlign: 'center',
  fontWeight: '600',
  fontFamily: 'DM Sans',
  fontSize: '14px',
});
const StyledCreditsTableCell = styled(TableCell)({
  borderBottom: 'none',
  backgroundColor: 'transparent',
  textAlign: 'center',
  fontWeight: '400',
  fontFamily: 'DM Sans',
  fontSize: '14px',
  color: 'rgba(255, 255, 255, 0.8)',
});
const StyledServiceTableCell = styled(TableCell)({
  borderBottom: 'none',
  backgroundColor: 'transparent',
  textAlign: 'left',
  fontWeight: '400',
  fontFamily: 'DM Sans',
  fontSize: '14px',
  color: 'rgba(255, 255, 255, 0.8)',
  paddingLeft: '0px',
});

function CreditsTable({ maxWidth }) {
  const [data, setData] = useState<CreditsTableData[]>([]);

  useEffect(() => {
    setData(creditsTableData);
  }, []);

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <TableContainer
        component={Paper}
        sx={{ backgroundColor: 'transparent', boxShadow: 'none', maxWidth: maxWidth, backgroundImage: 'none' }}
      >
        <StyledTable>
          <StyledTableHead>
            <TableRow>
              <StyledHeaderTableCell></StyledHeaderTableCell>
              <StyledHeaderTableCell align="right">Free</StyledHeaderTableCell>
              <StyledHeaderTableCell align="right">Starter</StyledHeaderTableCell>
              <StyledHeaderTableCell align="right">Professional</StyledHeaderTableCell>
              <StyledHeaderTableCell align="right">Team</StyledHeaderTableCell>
            </TableRow>
          </StyledTableHead>
          <StyledTableBody>
            {data.map((row) => (
              <TableRow key={row.name}>
                <StyledServiceTableCell component="th" scope="row">
                  {row.name}
                </StyledServiceTableCell>
                <StyledCreditsTableCell align="right">{row.free}</StyledCreditsTableCell>
                <StyledCreditsTableCell align="right">{row.starter}</StyledCreditsTableCell>
                <StyledCreditsTableCell align="right">{row.professional}</StyledCreditsTableCell>
                <StyledCreditsTableCell align="right">{row.team}</StyledCreditsTableCell>
              </TableRow>
            ))}
          </StyledTableBody>
        </StyledTable>
      </TableContainer>
    </Box>
  );
}

export default CreditsTable;
