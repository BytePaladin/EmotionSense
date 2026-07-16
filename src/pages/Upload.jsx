import UploadArea from '../features/upload/UploadArea';
import { Box, Typography } from '@mui/material';

export default function Upload() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h5" component="h2" fontWeight="bold" color="text.primary">Upload Media</Typography>
        <Typography variant="body2" color="text.secondary">Upload images or videos for advanced emotional analysis.</Typography>
      </Box>
      <UploadArea />
    </Box>
  );
}
