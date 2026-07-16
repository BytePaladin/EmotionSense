import { useState } from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function Input({ label, error, icon: Icon, type = 'text', className = '', ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <TextField
      label={label}
      type={inputType}
      error={Boolean(error)}
      helperText={error}
      fullWidth
      className={className}
      InputProps={{
        startAdornment: Icon ? (
          <InputAdornment position="start">
            <Icon fontSize="small" />
          </InputAdornment>
        ) : null,
        endAdornment: isPassword ? (
          <InputAdornment position="end">
            <IconButton
              onClick={() => setShowPassword(!showPassword)}
              edge="end"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
      {...props}
    />
  );
}
