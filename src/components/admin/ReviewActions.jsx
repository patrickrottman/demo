import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { updateApplication } from '../../utils/storage';

const ReviewActions = ({ application, onUpdate }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [actionType, setActionType] = useState(null);

  const handleOpenDialog = (type) => {
    setActionType(type);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setActionType(null);
  };

  const handleConfirm = () => {
    const updates = {
      status: actionType,
      [`${actionType}At`]: new Date().toISOString(),
    };

    updateApplication(application.id, updates);
    handleCloseDialog();
    onUpdate();
  };

  if (application.status !== 'pending') {
    return (
      <Box sx={{ p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
        <Box sx={{ textAlign: 'center' }}>
          {application.status === 'approved' ? (
            <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
          ) : (
            <CancelIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
          )}
          <DialogContentText>
            This application has been {application.status}.
          </DialogContentText>
          <DialogContentText variant="caption">
            {application[`${application.status}At`] &&
              `on ${new Date(application[`${application.status}At`]).toLocaleDateString()}`}
          </DialogContentText>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<CheckCircleIcon />}
          fullWidth
          onClick={() => handleOpenDialog('approved')}
        >
          Approve
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={<CancelIcon />}
          fullWidth
          onClick={() => handleOpenDialog('rejected')}
        >
          Reject
        </Button>
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {actionType === 'approved' ? 'Approve Application' : 'Reject Application'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {actionType === 'approved' ? 'approve' : 'reject'} this
            application for {application.firstName} {application.lastName}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            color={actionType === 'approved' ? 'success' : 'error'}
            variant="contained"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewActions;
