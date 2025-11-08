import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Paper, Typography, Box, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import {
  Add, Send, CheckCircle, Cancel, LocalShipping, Inventory
} from '@mui/icons-material';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function WorkflowActions({ currentUser, onActionComplete, triggerAction, onActionTriggered }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState([]);

  // Fetch registered users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_BASE}/auth/users`);
        if (response.data.success) {
          setRegisteredUsers(response.data.users);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  // Handle external action triggers (from notifications)
  useEffect(() => {
    if (triggerAction) {
      handleAction(triggerAction.type, triggerAction.batchId);
      if (onActionTriggered) onActionTriggered();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerAction]);

  const handleAction = (type, prefillBatchId = null) => {
    setActionType(type);
    setFormData({ batchId: prefillBatchId || '' });
    setDialogOpen(true);
  };

  const executeAction = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      let payload = { ...formData, privateKey: currentUser.privateKey };

      switch (actionType) {
        case 'createBatch':
          endpoint = '/drugs/create';
          break;
        case 'requestFDA':
          endpoint = '/fda/request';
          break;
        case 'approveFDA':
          endpoint = '/fda/approve';
          break;
        case 'rejectFDA':
          endpoint = '/fda/reject';
          // Backend expects 'reason' not 'remarks'
          if (payload.remarks) {
            payload.reason = payload.remarks;
            delete payload.remarks;
          }
          break;
        case 'transferManufacturer':
          endpoint = '/drugs/transfer/manufacturer';
          break;
        case 'manufacture':
          endpoint = '/drugs/manufacture';
          break;
        case 'transferRepackager':
          endpoint = '/drugs/transfer/repackager';
          break;
        case 'transferDistributor':
          endpoint = '/drugs/transfer/distributor';
          break;
        case 'transferPharmacy':
          endpoint = '/drugs/transfer/pharmacy';
          break;
        default:
          throw new Error('Unknown action');
      }

      await axios.post(`${API_BASE}${endpoint}`, payload);
      alert('Action completed successfully!');
      setDialogOpen(false);
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Error executing action:', error);
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  const renderActions = () => {
    const actions = [];

    // Patient role - No actions, only viewing
    if (currentUser.role === 0) {
      return (
        <Alert severity="info" icon={<Inventory />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            👤 Patient View - Read Only Access
          </Typography>
          <Typography variant="body2">
            As a patient, you can track and verify drug authenticity using the "Track Batch" tab.
            Enter your batch ID to view complete supply chain history, IoT monitoring data, and verify drug safety.
          </Typography>
        </Alert>
      );
    }

    switch (currentUser.role) {
      case 1: // FDA
        actions.push(
          <Button
            key="approve"
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={() => handleAction('approveFDA')}
          >
            Approve Drug
          </Button>,
          <Button
            key="reject"
            variant="contained"
            color="error"
            startIcon={<Cancel />}
            onClick={() => handleAction('rejectFDA')}
          >
            Reject Drug
          </Button>
        );
        break;

      case 2: // Ingredient Supplier
        actions.push(
          <Button
            key="create"
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleAction('createBatch')}
          >
            Create Drug Batch
          </Button>,
          <Button
            key="transfer"
            variant="contained"
            startIcon={<Send />}
            onClick={() => handleAction('transferManufacturer')}
          >
            Transfer to Manufacturer
          </Button>,
          <Button
            key="requestFDA"
            variant="contained"
            color="warning"
            startIcon={<Send />}
            onClick={() => handleAction('requestFDA')}
          >
            Request FDA Approval
          </Button>
        );
        break;

      case 3: // Manufacturer
        actions.push(
          <Button
            key="manufacture"
            variant="contained"
            startIcon={<Inventory />}
            onClick={() => handleAction('manufacture')}
          >
            Manufacture Drug
          </Button>,
          <Button
            key="transfer"
            variant="contained"
            startIcon={<Send />}
            onClick={() => handleAction('transferRepackager')}
          >
            Transfer to Repackager
          </Button>
        );
        break;

      case 4: // Repackager
        actions.push(
          <Button
            key="transfer"
            variant="contained"
            startIcon={<Send />}
            onClick={() => handleAction('transferDistributor')}
          >
            Transfer to Distributor
          </Button>
        );
        break;

      case 5: // Distributor
        actions.push(
          <Button
            key="transfer"
            variant="contained"
            startIcon={<LocalShipping />}
            onClick={() => handleAction('transferPharmacy')}
          >
            Transfer to Pharmacy
          </Button>
        );
        break;

      case 6: // Pharmacy
        actions.push(
          <Alert severity="info">
            Pharmacy is the final destination. You can view and track received batches.
          </Alert>
        );
        break;

      default:
        return null;
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {actions}
      </Box>
    );
  };

  const renderDialogContent = () => {
    switch (actionType) {
      case 'createBatch':
        return (
          <>
            <TextField
              label="Batch ID"
              fullWidth
              margin="normal"
              value={formData.batchId || ''}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              placeholder="e.g., BATCH001"
            />
            <TextField
              label="Drug Name"
              fullWidth
              margin="normal"
              value={formData.drugName || ''}
              onChange={(e) => setFormData({ ...formData, drugName: e.target.value })}
              placeholder="e.g., Aspirin 500mg"
            />
          </>
        );

      case 'transferManufacturer':
      case 'transferRepackager':
      case 'transferDistributor':
      case 'transferPharmacy':
        const targetRole = {
          transferManufacturer: 3,
          transferRepackager: 4,
          transferDistributor: 5,
          transferPharmacy: 6
        }[actionType];

        const targetUsers = registeredUsers.filter(u => u.role === targetRole);

        const roleNames = {
          3: 'Manufacturer',
          4: 'Repackager',
          5: 'Distributor',
          6: 'Pharmacy'
        };

        return (
          <>
            <TextField
              label="Batch ID"
              fullWidth
              margin="normal"
              value={formData.batchId || ''}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Select {roleNames[targetRole]}</InputLabel>
              <Select
                value={formData.manufacturer || formData.repackager || formData.distributor || formData.pharmacy || ''}
                onChange={(e) => {
                  const key = actionType.replace('transfer', '').toLowerCase();
                  setFormData({ ...formData, [key]: e.target.value });
                }}
                label={`Select ${roleNames[targetRole]}`}
              >
                {targetUsers.length > 0 ? (
                  targetUsers.map(user => (
                    <MenuItem key={user.address} value={user.address}>
                      {user.name} ({user.email})
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No {roleNames[targetRole]} registered</MenuItem>
                )}
              </Select>
            </FormControl>
            <TextField
              label="Location"
              fullWidth
              margin="normal"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Warehouse A, City"
            />
          </>
        );

      case 'approveFDA':
      case 'rejectFDA':
        return (
          <>
            <TextField
              label="Batch ID"
              fullWidth
              margin="normal"
              value={formData.batchId || ''}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
            />
            <TextField
              label="Remarks"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              value={formData.remarks || ''}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Enter approval/rejection remarks..."
            />
          </>
        );

      case 'requestFDA':
      case 'manufacture':
        return (
          <TextField
            label="Batch ID"
            fullWidth
            margin="normal"
            value={formData.batchId || ''}
            onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
          />
        );

      default:
        return null;
    }
  };

  const getDialogTitle = () => {
    const titles = {
      createBatch: 'Create New Drug Batch',
      requestFDA: 'Request FDA Approval',
      approveFDA: 'Approve Drug Batch',
      rejectFDA: 'Reject Drug Batch',
      transferManufacturer: 'Transfer to Manufacturer',
      manufacture: 'Manufacture Drug',
      transferRepackager: 'Transfer to Repackager',
      transferDistributor: 'Transfer to Distributor',
      transferPharmacy: 'Transfer to Pharmacy'
    };
    return titles[actionType] || 'Action';
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Available Actions
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Logged in as: <strong>{currentUser.name}</strong>
      </Alert>
      {renderActions()}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        <DialogContent>
          {renderDialogContent()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={executeAction} variant="contained" disabled={loading}>
            {loading ? 'Processing...' : 'Execute'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default WorkflowActions;
