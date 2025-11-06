import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Paper, Typography, Box, List, ListItem, ListItemText, ListItemIcon,
  Chip, Alert, CircularProgress, Divider, IconButton
} from '@mui/material';
import {
  PlayArrow, CheckCircle, Warning, Info, ArrowForward
} from '@mui/icons-material';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function PendingActions({ currentUser, onActionClick }) {
  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadPendingActions();
      const interval = setInterval(loadPendingActions, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadPendingActions = async () => {
    try {
      setLoading(true);
      
      // Get all unique batch IDs from recent transactions
      const txRes = await axios.get(`${API_BASE}/transactions`);
      const transactions = txRes.data.transactions || [];
      
      // Get unique batch IDs
      const batchIds = [...new Set(transactions.map(tx => tx.batchId))];
      
      const pending = [];

      // Patients don't have pending actions
      if (currentUser.role === 0) {
        return; // Exit early for patients
      }

      // Check each batch's current status
      for (const batchId of batchIds) {
        try {
          const drugRes = await axios.get(`${API_BASE}/drugs/${batchId}`);
          const drug = drugRes.data.drug;
          
          // Determine what action is needed based on current status and role
          let actionNeeded = null;

          switch (currentUser.role) {
            case 1: // FDA - Special case: FDA doesn't own batches, they approve them
              if (drug.status === 2) { // FDA_PENDING
                actionNeeded = {
                  batchId: drug.batchId,
                  action: 'Approve or Reject',
                  description: 'FDA approval required',
                  priority: 'high',
                  icon: <Warning color="error" />,
                  actionType: 'approveFDA'
                };
              }
              break;

            case 2: // Ingredient Supplier
              if (drug.currentOwner.toLowerCase() === currentUser.address.toLowerCase()) {
                if (drug.status === 1) { // INGREDIENTS_SUPPLIED
                  actionNeeded = {
                    batchId: drug.batchId,
                    action: 'Transfer to Manufacturer',
                    description: 'Batch created, ready to transfer',
                    priority: 'medium',
                    icon: <PlayArrow color="primary" />,
                    actionType: 'transferManufacturer'
                  };
                }
              }
              break;

            case 3: // Manufacturer
              if (drug.currentOwner.toLowerCase() === currentUser.address.toLowerCase()) {
                if (drug.status === 2) { // FDA_PENDING (waiting for approval)
                  actionNeeded = {
                    batchId: drug.batchId,
                    action: 'Waiting for FDA Approval',
                    description: 'Batch transferred, awaiting FDA approval',
                    priority: 'low',
                    icon: <Info color="info" />,
                    actionType: null // No action to take
                  };
                }
                if (drug.status === 3) { // FDA_APPROVED
                  actionNeeded = {
                    batchId: drug.batchId,
                    action: 'Manufacture Drug',
                    description: 'FDA approved, ready for manufacturing',
                    priority: 'high',
                    icon: <PlayArrow color="success" />,
                    actionType: 'manufacture'
                  };
                }
                if (drug.status === 5) { // MANUFACTURED
                  actionNeeded = {
                    batchId: drug.batchId,
                    action: 'Transfer to Repackager',
                    description: 'Manufacturing complete',
                    priority: 'medium',
                    icon: <PlayArrow color="primary" />,
                    actionType: 'transferRepackager'
                  };
                }
              }
              break;

            case 4: // Repackager
              if (drug.currentOwner.toLowerCase() === currentUser.address.toLowerCase()) {
                if (drug.status === 5) { // Just received MANUFACTURED batch
                  actionNeeded = {
                    batchId: drug.batchId,
                    action: 'Repackage Drug',
                    description: 'Batch received, ready for repackaging',
                    priority: 'medium',
                    icon: <PlayArrow color="primary" />,
                    actionType: 'repackage'
                  };
                }
                if (drug.status === 6) { // REPACKAGED
                  actionNeeded = {
                    batchId: drug.batchId,
                    action: 'Transfer to Distributor',
                    description: 'Repackaging complete',
                    priority: 'medium',
                    icon: <PlayArrow color="primary" />,
                    actionType: 'transferDistributor'
                  };
                }
              }
              break;

            case 5: // Distributor
              if (drug.currentOwner.toLowerCase() === currentUser.address.toLowerCase()) {
                if (drug.status === 6) { // Just received from Repackager
                  actionNeeded = {
                    batchId: drug.batchId,
                    action: 'Process Distribution',
                    description: 'Batch received, ready to distribute',
                    priority: 'medium',
                    icon: <PlayArrow color="primary" />,
                    actionType: 'distribute'
                  };
                }
                if (drug.status === 7) { // DISTRIBUTED
                  actionNeeded = {
                    batchId: drug.batchId,
                    action: 'Transfer to Pharmacy',
                    description: 'Ready for final delivery',
                    priority: 'medium',
                    icon: <PlayArrow color="primary" />,
                    actionType: 'transferPharmacy'
                  };
                }
              }
              break;

            case 6: // Pharmacy
              if (drug.currentOwner.toLowerCase() === currentUser.address.toLowerCase()) {
                if (drug.status === 7) { // Just received from Distributor
                  actionNeeded = {
                    batchId: drug.batchId,
                    action: 'Dispense to Patient',
                    description: 'Batch received, ready to dispense',
                    priority: 'high',
                    icon: <PlayArrow color="warning" />,
                    actionType: 'dispense'
                  };
                }
                if (drug.status === 8) { // DISPENSED
                  actionNeeded = {
                    batchId: drug.batchId,
                    action: 'Complete',
                    description: 'Batch dispensed successfully',
                    priority: 'low',
                    icon: <CheckCircle color="success" />,
                    actionType: null // No action needed
                  };
                }
              }
              break;
            
            default:
              // No pending actions for other roles
              break;
          }

          if (actionNeeded) {
            pending.push(actionNeeded);
          }
        } catch (err) {
          // Skip this batch if there's an error
          console.error(`Error loading batch ${batchId}:`, err);
        }
      }

      setPendingItems(pending);
      setLoading(false);
    } catch (error) {
      console.error('Error loading pending actions:', error);
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ mt: 1 }}>Loading pending actions...</Typography>
      </Paper>
    );
  }

  if (pendingItems.length === 0) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Info color="info" />
          <Typography variant="h6">No Pending Actions</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          You're all caught up! No batches require your attention at the moment.
        </Typography>
      </Paper>
    );
  }

  const handleActionClick = (item) => {
    if (!item.actionType) return; // No action for informational items
    
    // Trigger the action in parent component (App.js)
    if (onActionClick) {
      onActionClick({
        type: item.actionType,
        batchId: item.batchId
      });
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        ⚡ Pending Actions ({pendingItems.length})
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        These batches require your immediate attention:
      </Typography>
      <Divider sx={{ my: 2 }} />
      <List>
        {pendingItems.map((item, index) => (
          <ListItem
            key={index}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              mb: 1,
              bgcolor: item.priority === 'high' ? '#ffebee' : 'background.paper',
              cursor: item.actionType ? 'pointer' : 'default',
              '&:hover': item.actionType ? {
                bgcolor: item.priority === 'high' ? '#ffcdd2' : '#f5f5f5',
                transform: 'translateX(4px)',
                transition: 'all 0.2s'
              } : {}
            }}
            onClick={() => handleActionClick(item)}
            secondaryAction={
              item.actionType && (
                <IconButton edge="end" color="primary">
                  <ArrowForward />
                </IconButton>
              )
            }
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {item.batchId}
                  </Typography>
                  <Chip
                    label={item.priority.toUpperCase()}
                    size="small"
                    color={getPriorityColor(item.priority)}
                  />
                </Box>
              }
              secondary={
                <>
                  <Typography variant="body2" color="text.primary">
                    <strong>Action:</strong> {item.action}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </>
              }
            />
          </ListItem>
        ))}
      </List>
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          💡 Use the <strong>"Available Actions"</strong> buttons above to process these batches.
        </Typography>
      </Alert>
    </Paper>
  );
}

export default PendingActions;
