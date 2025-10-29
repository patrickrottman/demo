import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { addComment } from '../../utils/storage';

const CommentSection = ({ application, onUpdate }) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      addComment(application.id, newComment);
      setNewComment('');
      onUpdate();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Comments & Feedback
      </Typography>

      {application.comments && application.comments.length > 0 ? (
        <Paper variant="outlined" sx={{ mb: 2, maxHeight: 400, overflow: 'auto' }}>
          <List>
            {application.comments.map((comment, index) => (
              <Box key={comment.id}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle2">{comment.author}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(comment.createdAt)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {comment.text}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < application.comments.length - 1 && <Divider component="li" />}
              </Box>
            ))}
          </List>
        </Paper>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No comments yet. Add the first comment below.
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Add a comment or feedback..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={submitting}
        />
      </Box>
      <Button
        variant="contained"
        endIcon={<SendIcon />}
        onClick={handleSubmitComment}
        disabled={!newComment.trim() || submitting}
        sx={{ mt: 1 }}
      >
        Add Comment
      </Button>
    </Box>
  );
};

export default CommentSection;
