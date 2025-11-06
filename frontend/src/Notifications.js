import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Badge, IconButton, Menu, MenuItem, Typography, Box, Divider, Chip
} from '@mui/material';
import { Notifications as NotificationsIcon, Circle } from '@mui/icons-material';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function Notifications({ currentUser, onNotificationClick }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 15000); // Check every 15 seconds
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadNotifications = async () => {
    try {
      // Get all transactions
      const txRes = await axios.get(`${API_BASE}/transactions`);
      const transactions = txRes.data.transactions || [];

      // Filter for notifications relevant to current user
      const userNotifications = await generateNotifications(transactions);
      
      // Get read notifications from localStorage
      const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
      
      // Mark notifications as read if they're in localStorage
      userNotifications.forEach(notif => {
        notif.read = readNotifications.includes(notif.id);
      });
      
      setNotifications(userNotifications);
      
      // Count unread
      setUnreadCount(userNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const generateNotifications = async (transactions) => {
    const notifs = [];

    // Patients don't get action notifications, only info
    if (currentUser.role === 0) {
      return []; // Patients can track batches via Track Batch tab
    }

    // Get unique batch IDs
    const batchIds = [...new Set(transactions.map(tx => tx.batchId))];

    // Check current status of each batch
    for (const batchId of batchIds) {
      try {
        const drugRes = await axios.get(`${API_BASE}/drugs/${batchId}`);
        const drug = drugRes.data.drug;
        
        // Show all batches (removed 24-hour limit)
        
        // Notifications based on user role and CURRENT status
        switch (currentUser.role) {
          case 1: // FDA
            // Notify FDA when approval is pending
            if (drug.status === 2) { // FDA_PENDING
              notifs.push({
                id: `batch-${batchId}-fda`,
                type: 'action_required',
                title: 'FDA Approval Required',
                message: `Batch ${batchId} is pending your approval`,
                batchId: batchId,
                timestamp: drug.createdAt,
                read: false
              });
            }
            break;

          case 2: // Ingredient Supplier
            // Only if they own it
            if (drug.currentOwner.toLowerCase() === currentUser.address.toLowerCase()) {
              if (drug.status === 1) { // INGREDIENTS_SUPPLIED
                notifs.push({
                  id: `batch-${batchId}-supplier`,
                  type: 'info',
                  title: 'Batch Created',
                  message: `Your batch ${batchId} has been created. Next: Transfer to Manufacturer`,
                  batchId: batchId,
                  timestamp: drug.createdAt,
                  read: false
                });
              }
            }
            break;

          case 3: // Manufacturer
            // Only if they own it
            if (drug.currentOwner.toLowerCase() === currentUser.address.toLowerCase()) {
              if (drug.status === 2) { // FDA_PENDING
                notifs.push({
                  id: `batch-${batchId}-mfg-pending`,
                  type: 'info',
                  title: 'Batch Received',
                  message: `Batch ${batchId} transferred to you. Waiting for FDA approval.`,
                  batchId: batchId,
                  timestamp: drug.createdAt,
                  read: false
                });
              }
              if (drug.status === 3) { // FDA_APPROVED
                notifs.push({
                  id: `batch-${batchId}-mfg-approved`,
                  type: 'action_required',
                  title: 'FDA Approved - Action Required',
                  message: `Batch ${batchId} is FDA approved. You can now manufacture it.`,
                  batchId: batchId,
                  timestamp: drug.createdAt,
                  read: false
                });
              }
            }
            break;

          case 4: // Repackager
            // Only if they own it
            if (drug.currentOwner.toLowerCase() === currentUser.address.toLowerCase()) {
              if (drug.status === 6) { // REPACKAGED
                notifs.push({
                  id: `batch-${batchId}-repackager`,
                  type: 'action_required',
                  title: 'Batch Ready for Repackaging',
                  message: `Batch ${batchId} transferred to you. Next: Transfer to Distributor`,
                  batchId: batchId,
                  timestamp: drug.createdAt,
                  read: false
                });
              }
            }
            break;

          case 5: // Distributor
            // Only if they own it
            if (drug.currentOwner.toLowerCase() === currentUser.address.toLowerCase()) {
              if (drug.status === 7) { // DISTRIBUTED
                notifs.push({
                  id: `batch-${batchId}-distributor`,
                  type: 'action_required',
                  title: 'Batch Ready for Distribution',
                  message: `Batch ${batchId} transferred to you. Next: Transfer to Pharmacy`,
                  batchId: batchId,
                  timestamp: drug.createdAt,
                  read: false
                });
              }
            }
            break;

          case 6: // Pharmacy
            // Only if they own it
            if (drug.currentOwner.toLowerCase() === currentUser.address.toLowerCase()) {
              if (drug.status === 8) { // DISPENSED
                notifs.push({
                  id: `batch-${batchId}-pharmacy`,
                  type: 'success',
                  title: 'Batch Received',
                  message: `Batch ${batchId} has been delivered to your pharmacy.`,
                  batchId: batchId,
                  timestamp: drug.createdAt,
                  read: false
                });
              }
            }
            break;

          default:
            // No notifications for other roles or states
            break;
        }
      } catch (error) {
        console.error(`Error loading batch ${batchId}:`, error);
      }
    }

    // Get alerts
    try {
      const alertsRes = await axios.get(`${API_BASE}/alerts`);
      const alerts = alertsRes.data.alerts || [];
      alerts.forEach(alert => {
        if (!alert.resolved) {
          notifs.push({
            id: `alert-${alert.id}`,
            type: 'warning',
            title: 'Alert Detected',
            message: alert.message,
            batchId: alert.batchId,
            timestamp: alert.timestamp,
            read: false
          });
        }
      });
    } catch (err) {
      console.error('Error loading alerts:', err);
    }

    // Sort by timestamp (newest first)
    return notifs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10); // Show max 10
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    
    // Mark all current notifications as read when opening the menu
    if (notifications.length > 0) {
      const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
      const allNotifIds = notifications.map(n => n.id);
      const updatedRead = [...new Set([...readNotifications, ...allNotifIds])];
      localStorage.setItem('readNotifications', JSON.stringify(updatedRead));
      
      // Update state to reflect read status
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notif) => {
    handleClose();
    
    // Determine which action to trigger based on notification type and user role
    let action = null;
    
    switch (currentUser.role) {
      case 1: // FDA
        if (notif.type === 'action_required' && notif.title.includes('Approval')) {
          action = { type: 'approveFDA', batchId: notif.batchId };
        }
        break;
      case 2: // Ingredient Supplier
        if (notif.message.includes('Transfer to Manufacturer')) {
          action = { type: 'transferManufacturer', batchId: notif.batchId };
        }
        break;
      case 3: // Manufacturer
        if (notif.message.includes('manufacture')) {
          action = { type: 'manufacture', batchId: notif.batchId };
        } else if (notif.message.includes('Transfer to Repackager')) {
          action = { type: 'transferRepackager', batchId: notif.batchId };
        }
        break;
      case 4: // Repackager
        if (notif.message.includes('Transfer to Distributor')) {
          action = { type: 'transferDistributor', batchId: notif.batchId };
        }
        break;
      case 5: // Distributor
        if (notif.message.includes('Transfer to Pharmacy')) {
          action = { type: 'transferPharmacy', batchId: notif.batchId };
        }
        break;
      default:
        // No action for other roles
        break;
    }
    
    if (action && onNotificationClick) {
      onNotificationClick(action);
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'action_required': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'success';
      default: return 'info';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 400, maxHeight: 500 }
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No new notifications
            </Typography>
          </MenuItem>
        ) : (
          notifications.map((notif) => (
            <MenuItem 
              key={notif.id} 
              onClick={() => handleNotificationClick(notif)} 
              sx={{ whiteSpace: 'normal', py: 2, cursor: 'pointer' }}
            >
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Circle 
                    sx={{ 
                      fontSize: 8, 
                      mr: 1,
                      color: notif.type === 'action_required' ? 'error.main' : 
                             notif.type === 'warning' ? 'warning.main' :
                             notif.type === 'success' ? 'success.main' : 'info.main'
                    }} 
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', flex: 1 }}>
                    {notif.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTimestamp(notif.timestamp)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  {notif.message}
                </Typography>
                {notif.batchId && (
                  <Chip 
                    label={notif.batchId} 
                    size="small" 
                    sx={{ ml: 2, mt: 0.5 }}
                    color={getNotificationColor(notif.type)}
                    variant="outlined"
                  />
                )}
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}

export default Notifications;
