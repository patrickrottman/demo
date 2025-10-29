import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { saveApplication } from '../../utils/storage';
import FileUpload from './FileUpload';

const steps = ['Personal Information', 'Professional Details', 'Documents & Submit'];

const SubmissionForm = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentSchool: '',
    yearsExperience: '',
    currentCertification: '',
    desiredAccreditation: '',
    education: '',
    additionalCertifications: '',
    teachingPhilosophy: '',
    documents: [],
  });

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    setError('');
  };

  const handleFilesChange = (files) => {
    setFormData({ ...formData, documents: files });
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
          setError('Please fill in all personal information fields');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError('Please enter a valid email address');
          return false;
        }
        break;
      case 1:
        if (
          !formData.currentSchool ||
          !formData.yearsExperience ||
          !formData.currentCertification ||
          !formData.desiredAccreditation ||
          !formData.education
        ) {
          setError('Please fill in all professional details');
          return false;
        }
        break;
      case 2:
        // Documents are optional, but teaching philosophy is required
        if (!formData.teachingPhilosophy) {
          setError('Please provide your teaching philosophy');
          return false;
        }
        break;
      default:
        return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
      setError('');
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const handleSubmit = () => {
    if (validateStep(activeStep)) {
      try {
        const newApplication = saveApplication(formData);
        navigate(`/success/${newApplication.id}`);
      } catch (err) {
        setError('Failed to submit application. Please try again.');
      }
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={handleChange('firstName')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange('lastName')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange('phone')}
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Current School"
                value={formData.currentSchool}
                onChange={handleChange('currentSchool')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Years of Experience"
                type="number"
                value={formData.yearsExperience}
                onChange={handleChange('yearsExperience')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Current Certification"
                value={formData.currentCertification}
                onChange={handleChange('currentCertification')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Desired Advanced Accreditation"
                value={formData.desiredAccreditation}
                onChange={handleChange('desiredAccreditation')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={3}
                label="Education Background"
                placeholder="List your degrees and institutions"
                value={formData.education}
                onChange={handleChange('education')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Additional Certifications (Optional)"
                placeholder="List any additional certifications or qualifications"
                value={formData.additionalCertifications}
                onChange={handleChange('additionalCertifications')}
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={6}
                label="Teaching Philosophy"
                placeholder="Describe your teaching philosophy and approach"
                value={formData.teachingPhilosophy}
                onChange={handleChange('teachingPhilosophy')}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Supporting Documents (Optional)
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Upload certificates, transcripts, or other relevant documents
              </Typography>
              <FileUpload
                files={formData.documents}
                onChange={handleFilesChange}
              />
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom align="center">
        Apply for Advanced Accreditation
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph align="center">
        Complete this form to submit your credentials for advanced accreditation review
      </Typography>

      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button variant="contained" onClick={handleSubmit}>
                Submit Application
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default SubmissionForm;
