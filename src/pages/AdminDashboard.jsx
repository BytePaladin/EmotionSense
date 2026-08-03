import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  People as PeopleIcon,
  Psychology as BrainIcon,
  TrendingUp as TrendingUpIcon,
  Storage as StorageIcon,
  Videocam as VideocamIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  WarningAmber as WarningIcon,
  Search as SearchIcon,
  History as HistoryIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import api from '../api/axios';
import toast from 'react-hot-toast';
import FormatDistributionChart from '../components/charts/FormatDistributionChart';
import EmotionConfidenceChart from '../components/charts/EmotionConfidenceChart';
import { EMOTION_COLORS } from '../utils/emotionColors';

export default function AdminDashboard() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Analytics Data
  const [stats, setStats] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  // Dialog States
  const [deleteUserDialog, setDeleteUserDialog] = useState({ open: false, user: null, loading: false });
  const [purgeActivityDialog, setPurgeActivityDialog] = useState({ open: false, input: '', loading: false });
  const [resetPlatformDialog, setResetPlatformDialog] = useState({ open: false, input: '', loading: false });

  // Format bytes helper
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format GMT+6 (Asia/Dhaka)
  const formatDhakaTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const fetchAdminData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [statsRes, activityRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/activity?limit=50'),
        api.get(`/admin/users${userSearch ? `?search=${encodeURIComponent(userSearch)}` : ''}`)
      ]);

      setStats(statsRes.data.data);
      setActivityLogs(activityRes.data.data.activities || []);
      setUsers(usersRes.data.data.users || []);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load administrative analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userSearch]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Option 1: Delete Specific User & Data
  const handleDeleteUser = async () => {
    if (!deleteUserDialog.user) return;
    setDeleteUserDialog(prev => ({ ...prev, loading: true }));
    try {
      await api.delete(`/admin/users/${deleteUserDialog.user.id}`);
      toast.success(`User ${deleteUserDialog.user.email} and all associated data deleted`);
      setDeleteUserDialog({ open: false, user: null, loading: false });
      fetchAdminData(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete user');
      setDeleteUserDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // Option 2: Erase All Analysis & Detection Data
  const handlePurgeActivity = async () => {
    if (purgeActivityDialog.input !== 'PURGE_ACTIVITY') {
      toast.error("Please type 'PURGE_ACTIVITY' to confirm");
      return;
    }
    setPurgeActivityDialog(prev => ({ ...prev, loading: true }));
    try {
      const res = await api.post('/admin/purge-activity', { confirmation: 'PURGE_ACTIVITY' });
      toast.success(res.data.message || 'All activity data purged');
      setPurgeActivityDialog({ open: false, input: '', loading: false });
      fetchAdminData(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to purge activity data');
      setPurgeActivityDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // Option 3: Full Platform Reset
  const handleResetPlatform = async () => {
    if (resetPlatformDialog.input !== 'RESET_ALL_DATA') {
      toast.error("Please type 'RESET_ALL_DATA' to confirm");
      return;
    }
    setResetPlatformDialog(prev => ({ ...prev, loading: true }));
    try {
      const res = await api.post('/admin/reset-platform', { confirmation: 'RESET_ALL_DATA' });
      toast.success(res.data.message || 'Platform reset complete');
      setResetPlatformDialog({ open: false, input: '', loading: false });
      fetchAdminData(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reset platform');
      setResetPlatformDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!activityLogs || activityLogs.length === 0) {
      toast.error('No activity logs available to export');
      return;
    }

    const headers = ['Session ID', 'User Name', 'User Email', 'File Name', 'Format', 'Size (Bytes)', 'Dominant Emotion', 'Avg Confidence (%)', 'Total Detections', 'Timestamp (GMT+6)'];
    const rows = activityLogs.map(log => [
      `"${log.id}"`,
      `"${log.full_name || 'Guest/User'}"`,
      `"${log.email || 'N/A'}"`,
      `"${log.file_name || 'N/A'}"`,
      `"${log.file_type || 'N/A'}"`,
      log.file_size || 0,
      `"${log.dominant_emotion || 'N/A'}"`,
      log.average_confidence || 0,
      log.total_detections || 0,
      `"${formatDhakaTime(log.upload_time)}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `emotionsense_admin_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Admin audit report downloaded');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress color="error" size={48} />
        <Typography variant="body1" color="text.secondary">Loading administrative telemetry...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Top Banner & Control Bar */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h4" fontWeight="bold">
              System Telemetry & Controls
            </Typography>
            <Chip
              label="Live Database"
              size="small"
              color="success"
              icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Real-time multi-tenant monitoring, AI inference confidence metrics, and database lifecycle management.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            onClick={() => fetchAdminData(true)}
            disabled={refreshing}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            size="small"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* KPI Stat Cards Grid */}
      <Grid container spacing={2.5}>
        {/* Total Registered Users */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 1, borderColor: 'divider' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                  Total Users
                </Typography>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.main', color: 'white', display: 'flex' }}>
                  <PeopleIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {stats?.total_users ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats?.active_users ?? 0} active ({stats?.total_users > 0 ? Math.round((stats.active_users / stats.total_users) * 100) : 0}%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Most Detected Format */}
        <Grid item xs={12} sm={6} md={4} lg={2.5}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 1, borderColor: 'divider' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                  Top Format
                </Typography>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#6366f1', color: 'white', display: 'flex' }}>
                  <VideocamIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight="bold" noWrap>
                {stats?.popular_format || 'None'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats?.total_uploads ?? 0} total sessions/files
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Overall Model Confidence */}
        <Grid item xs={12} sm={6} md={4} lg={2.5}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 1, borderColor: 'divider' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                  Model Confidence
                </Typography>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#10b981', color: 'white', display: 'flex' }}>
                  <TrendingUpIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats?.overall_confidence ? `${stats.overall_confidence}%` : '0%'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Overall platform average
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Facial Detections */}
        <Grid item xs={12} sm={6} md={4} lg={2.5}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 1, borderColor: 'divider' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                  Frames Analyzed
                </Typography>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#f59e0b', color: 'white', display: 'flex' }}>
                  <BrainIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {stats?.total_detections ? stats.total_detections.toLocaleString() : 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total emotion inference records
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Media Bandwidth / Storage */}
        <Grid item xs={12} sm={6} md={4} lg={2.5}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 1, borderColor: 'divider' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                  Media Storage
                </Typography>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#8b5cf6', color: 'white', display: 'flex' }}>
                  <StorageIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {formatBytes(stats?.total_storage_bytes)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total upload payload volume
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analytics Visualizations Section */}
      <Grid container spacing={3}>
        {/* Detection Format Breakdown */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3.5, p: 1, border: 1, borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Detection Format Share
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Distribution of camera vs image vs video uploads
                  </Typography>
                </Box>
              </Box>
              <FormatDistributionChart formats={stats?.format_distribution} />
            </CardContent>
          </Card>
        </Grid>

        {/* AI Emotion Confidence Breakdown */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3.5, p: 1, border: 1, borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    AI Emotion Confidence Breakdown
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Average model confidence percentage across all 7 emotions
                  </Typography>
                </Box>
              </Box>
              <EmotionConfidenceChart emotionConfidence={stats?.emotion_confidence} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Platform Dominant Emotion Distribution Pills */}
      {stats?.dominant_distribution && (
        <Card sx={{ borderRadius: 3.5, p: 2, border: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
            Platform Dominant Emotion Prevalence
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {Object.entries(stats.dominant_distribution).map(([emotion, count]) => {
              const cfg = EMOTION_COLORS[emotion] || { bg: '#64748b', light: 'rgba(100,116,139,0.15)', label: emotion, emoji: '😐' };
              return (
                <Box
                  key={emotion}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: 2.5,
                    bgcolor: cfg.light,
                    border: `1px solid ${cfg.bg}40`
                  }}
                >
                  <Typography sx={{ fontSize: '1.2rem' }}>{cfg.emoji}</Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: cfg.bg }}>
                    {cfg.label}:
                  </Typography>
                  <Chip
                    label={`${count} sessions`}
                    size="small"
                    sx={{ height: 22, fontWeight: 700, bgcolor: cfg.bg, color: 'white', fontSize: '0.7rem' }}
                  />
                </Box>
              );
            })}
          </Box>
        </Card>
      )}

      {/* Main Tabbed Management: User Management vs Live Activity Feed vs Danger Zone */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          textColor="inherit"
          indicatorColor="error"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              minHeight: 48
            }
          }}
        >
          <Tab icon={<PeopleIcon sx={{ fontSize: 20 }} />} iconPosition="start" label={`User Accounts (${users.length})`} />
          <Tab icon={<HistoryIcon sx={{ fontSize: 20 }} />} iconPosition="start" label={`Live Activity Feed (${activityLogs.length})`} />
          <Tab icon={<WarningIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Danger Zone & Purge" />
        </Tabs>
      </Box>

      {/* TAB 0: User Management Table */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search users by name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              sx={{ width: { xs: '100%', sm: 320 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                )
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Showing {users.length} registered accounts
            </Typography>
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: 3, border: 1, borderColor: 'divider', boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Joined (GMT+6)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Uploads / Sessions</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Total Frames</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Avg Confidence</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No users found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => {
                    const isAdmin = u.role === 'admin';
                    return (
                      <TableRow key={u.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="600">
                              {u.full_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {u.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {isAdmin ? (
                            <Chip
                              label="Admin"
                              size="small"
                              color="error"
                              icon={<ShieldIcon sx={{ fontSize: '14px !important' }} />}
                              sx={{ fontWeight: 700, height: 24 }}
                            />
                          ) : (
                            <Chip
                              label="User"
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 600, height: 24 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDhakaTime(u.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={u.total_uploads || 0} size="small" sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="600">
                            {u.total_detections ? u.total_detections.toLocaleString() : 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            fontWeight="600"
                            color={u.average_confidence > 70 ? 'success.main' : 'text.primary'}
                          >
                            {u.average_confidence ? `${u.average_confidence}%` : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {isAdmin ? (
                            <Typography variant="caption" color="text.disabled">
                              Protected
                            </Typography>
                          ) : (
                            <Tooltip title="Delete user & all their associated detection records">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteUserDialog({ open: true, user: u, loading: false })}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 1: Live Activity Feed Table */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TableContainer component={Paper} sx={{ borderRadius: 3, border: 1, borderColor: 'divider', boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Time (GMT+6)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>File / Session</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Format</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Dominant Emotion</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Confidence</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Frames</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activityLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No recent detection sessions logged</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  activityLogs.map((log) => {
                    const emoColor = EMOTION_COLORS[log.dominant_emotion?.toLowerCase()] || { bg: '#64748b', emoji: '😐' };
                    return (
                      <TableRow key={log.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="500">
                            {formatDhakaTime(log.upload_time)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="600">
                              {log.full_name || 'User'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {log.email || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                            {log.file_name || 'Untitled'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatBytes(log.file_size)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              log.file_type === 'live_camera' || log.file_name?.includes('live')
                                ? 'Live Camera'
                                : log.file_type?.includes('video')
                                ? 'Video'
                                : 'Image'
                            }
                            size="small"
                            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          {log.dominant_emotion ? (
                            <Chip
                              label={`${emoColor.emoji || ''} ${log.dominant_emotion}`}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                bgcolor: `${emoColor.bg}25`,
                                color: emoColor.bg,
                                border: `1px solid ${emoColor.bg}40`
                              }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">N/A</Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="600" color="success.main">
                            {log.average_confidence ? `${log.average_confidence}%` : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="600">
                            {log.total_detections || 0}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 2: Danger Zone & Deletion Options */}
      {activeTab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Caution: Irreversible Database Actions
            </Typography>
            These actions permanently erase analytical data and records from the live database. Ensure you have exported any needed CSV summaries before proceeding.
          </Alert>

          <Grid container spacing={3}>
            {/* Option 2: Erase All Analysis & Detection Data Only */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3.5, p: 1, border: 1, borderColor: 'warning.light', height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'warning.main', color: 'white', display: 'flex' }}>
                        <StorageIcon />
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          Option 2: Erase All Analysis Data
                        </Typography>
                        <Chip label="Preserves User Logins" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Deletes all uploaded files, video/image frames, facial detection results, and emotion statistics across the entire system. All registered user accounts and logins remain intact.
                    </Typography>
                  </Box>

                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<DeleteIcon />}
                    onClick={() => setPurgeActivityDialog({ open: true, input: '', loading: false })}
                    sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700, mt: 2 }}
                  >
                    Wipe Analysis History Only
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Option 3: Full Platform Reset */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3.5, p: 1, border: 1, borderColor: 'error.main', height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'error.main', color: 'white', display: 'flex' }}>
                        <WarningIcon />
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" color="error.main">
                          Option 3: Full Platform Reset
                        </Typography>
                        <Chip label="Total Factory Reset" size="small" color="error" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Completely clears all non-admin user accounts, all upload records, all detection frames, and all statistical summaries. Reinitializes the platform to a pristine state.
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<WarningIcon />}
                    onClick={() => setResetPlatformDialog({ open: true, input: '', loading: false })}
                    sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700, mt: 2, boxShadow: '0 4px 14px rgba(220,38,38,0.35)' }}
                  >
                    Execute Full Database Reset
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* DIALOG 1: Option 1 (Delete Single User) */}
      <Dialog
        open={deleteUserDialog.open}
        onClose={() => !deleteUserDialog.loading && setDeleteUserDialog({ open: false, user: null, loading: false })}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Delete User Account?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to permanently delete <strong>{deleteUserDialog.user?.full_name}</strong> ({deleteUserDialog.user?.email})?
          </DialogContentText>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            This will cascade-delete all {deleteUserDialog.user?.total_uploads || 0} files/sessions and {deleteUserDialog.user?.total_detections || 0} emotion detection frames associated with this account.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setDeleteUserDialog({ open: false, user: null, loading: false })}
            disabled={deleteUserDialog.loading}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteUser}
            color="error"
            variant="contained"
            disabled={deleteUserDialog.loading}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            {deleteUserDialog.loading ? <CircularProgress size={20} color="inherit" /> : 'Delete User & Data'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG 2: Option 2 (Purge Activity Data) */}
      <Dialog
        open={purgeActivityDialog.open}
        onClose={() => !purgeActivityDialog.loading && setPurgeActivityDialog({ open: false, input: '', loading: false })}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: 'warning.main' }}>
          Confirm Analysis Data Wipe
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This action will erase all uploaded media, live session records, frame detections, and emotion analytics across all users. Registered user accounts will be kept.
          </DialogContentText>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
            Type <span style={{ color: '#d97706' }}>PURGE_ACTIVITY</span> below to confirm:
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={purgeActivityDialog.input}
            onChange={(e) => setPurgeActivityDialog(prev => ({ ...prev, input: e.target.value }))}
            placeholder="PURGE_ACTIVITY"
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setPurgeActivityDialog({ open: false, input: '', loading: false })}
            disabled={purgeActivityDialog.loading}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePurgeActivity}
            color="warning"
            variant="contained"
            disabled={purgeActivityDialog.input !== 'PURGE_ACTIVITY' || purgeActivityDialog.loading}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            {purgeActivityDialog.loading ? <CircularProgress size={20} color="inherit" /> : 'Confirm Wipe'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG 3: Option 3 (Full Platform Reset) */}
      <Dialog
        open={resetPlatformDialog.open}
        onClose={() => !resetPlatformDialog.loading && setResetPlatformDialog({ open: false, input: '', loading: false })}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>
          ⚠️ Critical: Full Platform Reset
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            You are about to delete <strong>all non-admin user accounts</strong>, all media files, all facial frame analyses, and all database analytics.
          </DialogContentText>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
            Type <span style={{ color: '#dc2626' }}>RESET_ALL_DATA</span> below to confirm:
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={resetPlatformDialog.input}
            onChange={(e) => setResetPlatformDialog(prev => ({ ...prev, input: e.target.value }))}
            placeholder="RESET_ALL_DATA"
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setResetPlatformDialog({ open: false, input: '', loading: false })}
            disabled={resetPlatformDialog.loading}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResetPlatform}
            color="error"
            variant="contained"
            disabled={resetPlatformDialog.input !== 'RESET_ALL_DATA' || resetPlatformDialog.loading}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            {resetPlatformDialog.loading ? <CircularProgress size={20} color="inherit" /> : 'Execute Full Reset'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
