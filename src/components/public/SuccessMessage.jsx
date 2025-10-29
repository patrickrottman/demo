import { Box, Paper, Typography, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate, useParams } from 'react-router-dom';

const SuccessMessage = () => {
  const navigate = useNavigate();
  const { id: applicationId } = useParams();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          textAlign: 'center',
        }}
      >
        <CheckCircleIcon
          sx={{
            fontSize: 80,
            color: 'success.main',
            mb: 2,
          }}
        />
        <Typography variant="h4" gutterBottom>
          Application Submitted Successfully!
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Thank you for submitting your credentials for advanced accreditation review.
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Your application ID is: <strong>{applicationId}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Please save this ID for your records. You will be contacted via email regarding
          the status of your application.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Submit Another Application
        </Button>
      </Paper>
    </Box>
  );
};

export default SuccessMessage;
