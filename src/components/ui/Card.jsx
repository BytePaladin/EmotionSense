import { Card as MuiCard, CardContent } from '@mui/material';

export default function Card({ children, className = '', gradient = false, ...props }) {
  return (
    <MuiCard className={className} {...props}>
      <CardContent>
        {children}
      </CardContent>
    </MuiCard>
  );
}
