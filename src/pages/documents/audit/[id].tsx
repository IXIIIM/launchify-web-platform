import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Button,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  History as HistoryIcon, 
  Person as PersonIcon, 
  Edit as EditIcon, 
  Check as CheckIcon, 
  Close as CloseIcon, 
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useDocuments } from '../../../hooks/useDocuments';
import { useSignatures } from '../../../hooks/useSignatures';
import { AuditEvent } from '../../../types/signature';

const DocumentAudit: React.FC = () => {
  const params = useParams<Record<string, string>>();
  const id = params.id;
  const navigate = useNavigate();
  const { getDocumentById } = useDocuments();
  const { getAuditTrail, downloadSignedDocument } = useSignatures({
    onSuccess: (message) => console.log(message),
    onError: (error) => console.error(error)
  });
  
  const [document, setDocument] = useState<any>(null);
  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const documentData = await getDocumentById(id);
        setDocument(documentData);
        
        const auditData = await getAuditTrail(id);
        setAuditTrail(auditData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching document audit data:', err);
        setError('Failed to load document audit information. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, getDocumentById, getAuditTrail]);

  const handleDownload = async () => {
    if (!id) return;
    
    try {
      await downloadSignedDocument(id);
    } catch (err) {
      console.error('Error downloading signed document:', err);
      setError('Failed to download the signed document. Please try again.');
    }
  };

  const handleBack = () => {
    navigate(`/documents/${id}`);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <EditIcon color="primary" />;
      case 'viewed':
        return <VisibilityIcon color="action" />;
      case 'edited':
        return <EditIcon color="secondary" />;
      case 'signed':
        return <CheckIcon color="success" />;
      case 'declined':
        return <CloseIcon color="error" />;
      case 'sent':
        return <PersonIcon color="info" />;
      case 'canceled':
        return <CloseIcon color="warning" />;
      case 'reminded':
        return <HistoryIcon color="info" />;
      default:
        return <HistoryIcon />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'created':
        return 'Document Created';
      case 'viewed':
        return 'Document Viewed';
      case 'edited':
        return 'Document Edited';
      case 'signed':
        return 'Document Signed';
      case 'declined':
        return 'Signature Declined';
      case 'sent':
        return 'Signature Request Sent';
      case 'canceled':
        return 'Signature Request Canceled';
      case 'reminded':
        return 'Reminder Sent';
      default:
        return 'Unknown Event';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Box mt={2}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />} 
            onClick={handleBack}
          >
            Back to Document
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBack}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          Document Audit Trail
        </Typography>
      </Box>
      
      {document && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Document Information
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex">
              <Typography variant="body1" fontWeight="bold" sx={{ minWidth: 120 }}>
                Title:
              </Typography>
              <Typography variant="body1">
                {document.title}
              </Typography>
            </Box>
            <Box display="flex">
              <Typography variant="body1" fontWeight="bold" sx={{ minWidth: 120 }}>
                Document ID:
              </Typography>
              <Typography variant="body1">
                {document.id}
              </Typography>
            </Box>
            <Box display="flex">
              <Typography variant="body1" fontWeight="bold" sx={{ minWidth: 120 }}>
                Status:
              </Typography>
              <Chip 
                label={document.status} 
                color={
                  document.status === 'signed' ? 'success' : 
                  document.status === 'pending' ? 'warning' : 
                  document.status === 'draft' ? 'default' : 'primary'
                }
                size="small"
              />
            </Box>
            <Box display="flex">
              <Typography variant="body1" fontWeight="bold" sx={{ minWidth: 120 }}>
                Created:
              </Typography>
              <Typography variant="body1">
                {document.createdAt ? format(new Date(document.createdAt), 'PPpp') : 'N/A'}
              </Typography>
            </Box>
          </Box>
          
          {document.status === 'signed' && (
            <Box mt={2}>
              <Button 
                variant="contained" 
                startIcon={<DownloadIcon />} 
                onClick={handleDownload}
              >
                Download Signed Document
              </Button>
            </Box>
          )}
        </Paper>
      )}
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Audit History
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {auditTrail.length === 0 ? (
          <Typography variant="body1" color="text.secondary" align="center" py={4}>
            No audit events found for this document.
          </Typography>
        ) : (
          <List>
            {auditTrail.map((event) => (
              <React.Fragment key={event.id}>
                <ListItem alignItems="flex-start">
                  <ListItemIcon>
                    {getEventIcon(event.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1">
                          {getEventLabel(event.type)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(event.timestamp), 'PPpp')}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box mt={1}>
                        <Typography variant="body2" component="span">
                          {`${event.user.name} (${event.user.email})`}
                        </Typography>
                        {event.details && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {event.details}
                          </Typography>
                        )}
                        {event.ipAddress && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
                            IP: {event.ipAddress}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default DocumentAudit; 