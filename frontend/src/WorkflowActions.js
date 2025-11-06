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

const REGISTERED_USERS = [
  { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', name: 'FDA Regulatory Authority', role: 1 },
  { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', name: 'Ingredient Supplier Co.', role: 2 },
  { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', name: 'PharmaTech Manufacturing', role: 3 },
  { address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', name: 'RePackage Solutions Inc.', role: 4 },
  { address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', name: 'Global Distribution Network', role: 5 },
  { address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', name: 'City Central Pharmacy', role: 6 }
];

function WorkflowActions({ currentUser, onActionComplete, triggerAction, onActionTriggered }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

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

        const targetUsers = REGISTERED_USERS.filter(u => u.role === targetRole);

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
              <InputLabel>Select Recipient</InputLabel>
              <Select
                value={formData.manufacturer || formData.repackager || formData.distributor || formData.pharmacy || ''}
                onChange={(e) => {
                  const key = actionType.replace('transfer', '').toLowerCase();
                  setFormData({ ...formData, [key]: e.target.value });
                }}
                label="Select Recipient"
              >
                {targetUsers.map(user => (
                  <MenuItem key={user.address} value={user.address}>
                    {user.name}
                  </MenuItem>
                ))}
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
