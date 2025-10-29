import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getApplications } from '../../utils/storage';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AssignmentIcon from '@mui/icons-material/Assignment';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const applications = getApplications();

    setStats({
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      approved: applications.filter(app => app.status === 'approved').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
    });

    // Get 5 most recent applications
    const sorted = [...applications].sort(
      (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
    );
    setRecentApplications(sorted.slice(0, 5));
  }, []);

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        '&:hover': onClick ? { transform: 'translateY(-4px)' } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h3">{value}</Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 60,
              borderRadius: 2,
              backgroundColor: `${color}.lighter`,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning.main';
      case 'approved':
        return 'success.main';
      case 'rejected':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Overview of teacher credential applications
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Applications"
            value={stats.total}
            icon={<AssignmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            color="primary"
            onClick={() => navigate('/admin/applications')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Review"
            value={stats.pending}
            icon={<PendingIcon sx={{ fontSize: 40, color: 'warning.main' }} />}
            color="warning"
            onClick={() => navigate('/admin/applications?status=pending')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Approved"
            value={stats.approved}
            icon={<CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />}
            color="success"
            onClick={() => navigate('/admin/applications?status=approved')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon={<CancelIcon sx={{ fontSize: 40, color: 'error.main' }} />}
            color="error"
            onClick={() => navigate('/admin/applications?status=rejected')}
          />
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Applications
        </Typography>
        {recentApplications.length === 0 ? (
          <Typography color="text.secondary">No applications yet</Typography>
        ) : (
          <Box>
            {recentApplications.map((app) => (
              <Box
                key={app.id}
                sx={{
                  py: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'action.hover' },
                  '&:last-child': { borderBottom: 'none' },
                }}
                onClick={() => navigate(`/admin/applications/${app.id}`)}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1">
                      {app.firstName} {app.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {app.desiredAccreditation} • {formatDate(app.submittedAt)}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      backgroundColor: getStatusColor(app.status).replace('main', 'lighter'),
                      color: getStatusColor(app.status),
                      fontWeight: 'medium',
                      textTransform: 'capitalize',
                    }}
                  >
                    {app.status}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Dashboard;
