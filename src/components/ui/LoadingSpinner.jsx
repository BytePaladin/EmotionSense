import { CircularProgress, Box, Typography } from '@mui/material';

export default function LoadingSpinner({ size = 'md', className = '' }) {
  let spinnerSize = 32;
  if (size === 'sm') spinnerSize = 20;
  if (size === 'lg') spinnerSize = 48;

  return (
    <Box className={className} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress size={spinnerSize} />
    </Box>
  );
}

export function PageLoader() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Box sx={{ textAlign: 'center' }}>
        <LoadingSpinner size="lg" />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    </Box>
  );
}
