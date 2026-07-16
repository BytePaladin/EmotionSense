import { Button as MuiButton, CircularProgress } from '@mui/material';

export default function Button({ children, variant = 'primary', size = 'md', loading = false, disabled = false, className = '', ...props }) {
  let muiVariant = 'contained';
  let muiColor = 'primary';
  if (variant === 'secondary') {
    muiVariant = 'outlined';
    muiColor = 'inherit';
  } else if (variant === 'danger') {
    muiVariant = 'contained';
    muiColor = 'error';
  } else if (variant === 'ghost') {
    muiVariant = 'text';
    muiColor = 'inherit';
  }

  let muiSize = 'medium';
  if (size === 'sm') muiSize = 'small';
  if (size === 'lg') muiSize = 'large';

  return (
    <MuiButton
      variant={muiVariant}
      color={muiColor}
      size={muiSize}
      disabled={disabled || loading}
      className={className}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
      {...props}
    >
      {children}
    </MuiButton>
  );
}
