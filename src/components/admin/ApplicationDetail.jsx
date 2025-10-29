import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { getApplicationById } from '../../utils/storage';
import ReviewActions from './ReviewActions';
import CommentSection from './CommentSection';

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadApplication = () => {
    const app = getApplicationById(id);
    setApplication(app);
    setLoading(false);
  };

  useEffect(() => {
    loadApplication();
  }, [id]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (!application) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Application not found
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/applications')}>
          Back to Applications
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/admin/applications')}
        sx={{ mb: 2 }}
      >
        Back to Applications
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Application Details
        </Typography>
        <Chip
          label={application.status}
          color={getStatusColor(application.status)}
          sx={{ textTransform: 'capitalize' }}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Personal Information */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Name"
                  secondary={`${application.firstName} ${application.lastName}`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText primary="Email" secondary={application.email} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText primary="Phone" secondary={application.phone} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SchoolIcon />
                </ListItemIcon>
                <ListItemText primary="Current School" secondary={application.currentSchool} />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Professional Details */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Professional Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              <ListItem>
                <ListItemIcon>
                  <WorkIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Years of Experience"
                  secondary={`${application.yearsExperience} years`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Current Certification"
                  secondary={application.currentCertification}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Desired Accreditation"
                  secondary={application.desiredAccreditation}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Submitted"
                  secondary={formatDate(application.submittedAt)}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Education Background */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Education Background
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
              {application.education}
            </Typography>

            {application.additionalCertifications && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Additional Certifications
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {application.additionalCertifications}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>

        {/* Teaching Philosophy */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Teaching Philosophy
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {application.teachingPhilosophy}
            </Typography>
          </Paper>
        </Grid>

        {/* Documents */}
        {application.documents && application.documents.length > 0 && (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Uploaded Documents
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                {application.documents.map((doc, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <InsertDriveFileIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.name}
                      secondary={`${(doc.size / 1024).toFixed(2)} KB`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}

        {/* Review Actions */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Review Decision
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ReviewActions application={application} onUpdate={loadApplication} />
          </Paper>
        </Grid>

        {/* Comments Section */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <CommentSection application={application} onUpdate={loadApplication} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ApplicationDetail;
