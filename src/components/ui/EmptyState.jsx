import { Box, Typography } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import Button from './Button';

export default function EmptyState({ icon: Icon = InboxIcon, title = 'No data found', message = 'Get started by creating your first item.', actionLabel, onAction }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, px: 2, textAlign: 'center' }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon sx={{ fontSize: 40, color: 'text.secondary' }} />
      </Box>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mb: 3 }}>
        {message}
      </Typography>
      {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </Box>
  );
}
