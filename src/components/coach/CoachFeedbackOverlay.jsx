import React from 'react';
import { Box, Typography, Chip, LinearProgress, Stack } from '@mui/material';
import {
  EmojiEmotions as SmileIcon,
  SelfImprovement as CalmIcon,
  Warning as TensionIcon,
  Visibility as FocusIcon,
  RecordVoiceOver as CoachIcon
} from '@mui/icons-material';

export default function CoachFeedbackOverlay({ feedback, metrics, isVisible = true }) {
  if (!isVisible || !feedback) return null;

  const getTipDetails = (type) => {
    switch (type) {
      case 'smile':
        return {
          icon: <SmileIcon sx={{ fontSize: 18 }} />,
          bg: 'rgba(16, 185, 129, 0.9)',
          text: '#ffffff',
          title: 'Warmth & Engagement'
        };
      case 'tension':
        return {
          icon: <TensionIcon sx={{ fontSize: 18 }} />,
          bg: 'rgba(239, 68, 68, 0.9)',
          text: '#ffffff',
          title: 'Facial Tension Alert'
        };
      case 'calm':
        return {
          icon: <CalmIcon sx={{ fontSize: 18 }} />,
          bg: 'rgba(99, 102, 241, 0.9)',
          text: '#ffffff',
          title: 'Composure & Poise'
        };
      case 'focus':
      default:
        return {
          icon: <FocusIcon sx={{ fontSize: 18 }} />,
          bg: 'rgba(59, 130, 246, 0.9)',
          text: '#ffffff',
          title: 'Eye Contact & Presence'
        };
    }
  };

  const tip = getTipDetails(feedback.type);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        pointerEvents: 'none',
        zIndex: 10
      }}
    >
      {/* Top Banner: Coach Tip */}
      <Box
        sx={{
          bgcolor: 'rgba(17, 24, 39, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 2.5,
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          transition: 'all 0.3s ease'
        }}
      >
        <Box
          sx={{
            px: 1.2,
            py: 0.6,
            borderRadius: 2,
            bgcolor: tip.bg,
            color: tip.text,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            fontWeight: 'bold',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {tip.icon}
          <span>{tip.title}</span>
        </Box>
        <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 500, flex: 1, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
          {feedback.message}
        </Typography>
      </Box>

      {/* Live Mini Gauges */}
      {metrics && (
        <Box
          sx={{
            alignSelf: 'flex-start',
            bgcolor: 'rgba(17, 24, 39, 0.75)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            px: 2,
            py: 1,
            display: 'flex',
            gap: 2.5,
            alignItems: 'center'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <CoachIcon sx={{ fontSize: 16, color: '#818cf8' }} />
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>
              Live Coach HUD
            </Typography>
          </Stack>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.7rem' }}>
              Composure:
            </Typography>
            <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 'bold' }}>
              {metrics.composureScore || 90}%
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.7rem' }}>
              Warmth:
            </Typography>
            <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 'bold' }}>
              {metrics.warmthScore || 85}%
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
