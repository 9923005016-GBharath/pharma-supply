import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, AppBar, Toolbar, Typography, Box, Paper, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Chip, Button, TextField, Tabs, Tab, LinearProgress, IconButton, Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Search,
  Sensors,
  Warning,
  Logout
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Login from './Login';
import WorkflowActions from './WorkflowActions';
import Notifications from './Notifications';
import PendingActions from './PendingActions';
import LiveTemperature from './LiveTemperature';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Role mapping
const ROLES = {
  0: 'Patient',
  1: 'FDA',
  2: 'Ingredient Supplier',
  3: 'Manufacturer',
  4: 'Repackager',
  5: 'Distributor',
  6: 'Pharmacy'
};

const STATUS = {
  0: 'None',
  1: 'Ingredients Supplied',
  2: 'FDA Pending',
  3: 'FDA Approved',
  4: 'FDA Rejected',
  5: 'Manufactured',
  6: 'Repackaged',
  7: 'Distributed',
  8: 'Dispensed'
};

const ALERT_TYPES = {
  0: 'Temperature',
  1: 'Humidity',
  2: 'Pressure',
  3: 'Tampering',
  4: 'Fake Transfer'
};

function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);
  
  const [currentTab, setCurrentTab] = useState(0);
  const [analytics, setAnalytics] = useState({ totalTransactions: 0, totalIoTLogs: 0, totalAlerts: 0 });
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [searchBatchId, setSearchBatchId] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchHistory, setBatchHistory] = useState([]);
  const [batchIoTData, setBatchIoTData] = useState([]);
  const [batchAlerts, setBatchAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [triggerAction, setTriggerAction] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
      const interval = setInterval(loadDashboardData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      const [analyticsRes, transactionsRes, alertsRes] = await Promise.all([
        axios.get(`${API_BASE}/analytics/overview`),
        axios.get(`${API_BASE}/transactions`),
        axios.get(`${API_BASE}/alerts`)
      ]);

      setAnalytics(analyticsRes.data.analytics);
      setTransactions(transactionsRes.data.transactions);
      setAlerts(alertsRes.data.alerts.filter(a => !a.resolved));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const searchBatch = async () => {
    if (!searchBatchId) return;
    
    setLoading(true);
    try {
      const [drugRes, historyRes, iotRes, alertsRes] = await Promise.all([
        axios.get(`${API_BASE}/drugs/${searchBatchId}`),
        axios.get(`${API_BASE}/history/${searchBatchId}`),
        axios.get(`${API_BASE}/iot/${searchBatchId}`),
        axios.get(`${API_BASE}/alerts/${searchBatchId}`)
      ]);

      setSelectedBatch(drugRes.data.drug);
      setBatchHistory(historyRes.data.history);
      setBatchIoTData(iotRes.data.iotData);
      setBatchAlerts(alertsRes.data.alerts);
    } catch (error) {
      console.error('Error searching batch:', error);
      alert('Batch not found or error occurred');
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      1: 'default',
      2: 'warning',
      3: 'success',
      4: 'error',
      5: 'info',
      6: 'info',
      7: 'info',
      8: 'success'
    };
    return colors[status] || 'default';
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = async () => {
    // Call backend to clear session
    if (currentUser && currentUser.email) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email })
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const handleNotificationClick = (action) => {
    setTriggerAction(action);
  };

  // Check for stored user on mount and validate it
  useEffect(() => {
    const validateStoredUser = async () => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          
          // Validate user still exists and has valid credentials
          const response = await fetch(`${API_BASE}/auth/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: user.email,
              address: user.address
            })
          });
          
          const data = await response.json();
          
          if (data.valid) {
            setCurrentUser(user);
          } else {
            // User data is stale - clear it
            console.warn('⚠️ Stored user data is outdated. Please login again.');
            localStorage.removeItem('currentUser');
            alert('Your session has expired or your account was updated. Please login again.');
          }
        } catch (error) {
          console.error('Error validating user:', error);
          // Clear localStorage on validation error (blockchain may have been reset)
          localStorage.removeItem('currentUser');
          alert('Unable to validate your session. Please login again.');
        }
      }
    };
    
    validateStoredUser();
  }, []);

  // Show login if no user
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {currentUser.role === 0 ? 'Patient Drug Tracking Portal' : 'Pharmaceutical Supply Chain - IoT & Blockchain Dashboard'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {currentUser.role !== 0 && (
              <Notifications currentUser={currentUser} onNotificationClick={handleNotificationClick} />
            )}
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {currentUser.name}
              </Typography>
              <Typography variant="caption">
                {ROLES[currentUser.role]}
              </Typography>
            </Box>
            <IconButton color="inherit" onClick={handleLogout} title="Logout">
              <Logout />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl">
        {/* Patient View - Simplified */}
        {currentUser.role === 0 ? (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
              🔍 Track Your Medication
            </Typography>
            
            <Box sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Enter your batch ID (found on your prescription label or medicine package) to verify your medication's journey and current status.
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                <TextField
                  label="Batch ID"
                  value={searchBatchId}
                  onChange={(e) => setSearchBatchId(e.target.value)}
                  fullWidth
                  placeholder="e.g., ASPIRIN-1762408273270"
                />
                <Button
                  variant="contained"
                  onClick={searchBatch}
                  disabled={loading}
                  startIcon={<Search />}
                  size="large"
                >
                  Track
                </Button>
              </Box>

              {loading && <LinearProgress sx={{ mb: 2 }} />}
            </Box>

            {selectedBatch && selectedBatch.exists && (
              <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                {/* Drug Information Card */}
                <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
                  <CardContent>
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      💊 {selectedBatch.drugName}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          <strong>Batch ID:</strong> {selectedBatch.batchId}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          <strong>Created:</strong> {new Date(selectedBatch.createdAt * 1000).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          <strong>Current Stage:</strong>
                        </Typography>
                        <Chip
                          label={STATUS[selectedBatch.status]}
                          color={getStatusColor(selectedBatch.status)}
                          size="large"
                          sx={{ fontSize: '1rem', py: 2 }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Journey Progress */}
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    📦 Supply Chain Journey
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    {[
                      { stage: 1, label: 'Ingredients Supplied', icon: '🏭' },
                      { stage: 2, label: 'FDA Review Pending', icon: '📋' },
                      { stage: 3, label: 'FDA Approved', icon: '✅' },
                      { stage: 5, label: 'Manufactured', icon: '⚙️' },
                      { stage: 6, label: 'Repackaged', icon: '📦' },
                      { stage: 7, label: 'Distributed', icon: '🚚' },
                      { stage: 8, label: 'Dispensed to You', icon: '🏥' }
                    ].map((step, idx) => (
                      <Box key={step.stage} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: selectedBatch.status >= step.stage ? 'success.main' : 'grey.300',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            mr: 2
                          }}
                        >
                          {selectedBatch.status >= step.stage ? '✓' : step.icon}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: selectedBatch.status === step.stage ? 'bold' : 'normal',
                              color: selectedBatch.status >= step.stage ? 'text.primary' : 'text.secondary'
                            }}
                          >
                            {step.label}
                            {selectedBatch.status === step.stage && (
                              <Chip label="Current Stage" size="small" color="primary" sx={{ ml: 2 }} />
                            )}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Paper>

                {/* Safety Status */}
                <Paper sx={{ p: 3, bgcolor: batchAlerts.length > 0 ? '#fff3e0' : '#e8f5e9' }}>
                  <Typography variant="h6" gutterBottom>
                    {batchAlerts.length > 0 ? '⚠️ Safety Alerts' : '✅ Safety Status'}
                  </Typography>
                  {batchAlerts.length > 0 ? (
                    <Box>
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        <strong>Alerts detected for this batch.</strong> Please consult your pharmacist before use.
                      </Alert>
                      {batchAlerts.map((alert, idx) => (
                        <Alert severity={alert.resolved ? 'info' : 'warning'} key={idx} sx={{ mb: 1 }}>
                          <Typography variant="body2">
                            <strong>{ALERT_TYPES[alert.alertType]}:</strong> {alert.message}
                          </Typography>
                          <Typography variant="caption">
                            {new Date(alert.timestamp * 1000).toLocaleString()}
                            {alert.resolved && ' - RESOLVED'}
                          </Typography>
                        </Alert>
                      ))}
                    </Box>
                  ) : (
                    <Alert severity="success">
                      <Typography variant="body1">
                        <strong>No safety concerns detected.</strong><br />
                        This medication has passed all quality checks and monitoring throughout the supply chain.
                      </Typography>
                    </Alert>
                  )}
                </Paper>
              </Box>
            )}

            {selectedBatch && !selectedBatch.exists && (
              <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto' }}>
                <Typography variant="body1">
                  <strong>Batch not found.</strong><br />
                  Please verify the Batch ID is correct. If you continue to have issues, contact your pharmacy.
                </Typography>
              </Alert>
            )}
          </Paper>
        ) : (
          <>
            {/* Regular Dashboard for Supply Chain Users */}
            {/* Pending Actions - Shows what needs to be done */}
            <PendingActions currentUser={currentUser} onActionClick={(action) => setTriggerAction(action)} />
            
            {/* Workflow Actions - Available based on role */}
            <WorkflowActions 
              currentUser={currentUser} 
              onActionComplete={loadDashboardData}
              triggerAction={triggerAction}
              onActionTriggered={() => setTriggerAction(null)}
            />

            <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} sx={{ mb: 3 }}>
              <Tab label="Dashboard" icon={<DashboardIcon />} />
              <Tab label="Track Batch" icon={<Search />} />
              <Tab label="Alerts" icon={<Warning />} />
              <Tab label="IoT Monitoring" icon={<Sensors />} />
            </Tabs>

        {/* Dashboard Tab */}
        {currentTab === 0 && (
          <>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Transactions
                    </Typography>
                    <Typography variant="h3">
                      {analytics.totalTransactions}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      IoT Data Logs
                    </Typography>
                    <Typography variant="h3">
                      {analytics.totalIoTLogs}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Active Alerts
                    </Typography>
                    <Typography variant="h3" color="error">
                      {analytics.totalAlerts}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Recent Transactions</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Batch ID</TableCell>
                      <TableCell>From</TableCell>
                      <TableCell>To</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.slice(0, 10).map((tx, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{tx.batchId}</TableCell>
                        <TableCell>{tx.from.substring(0, 10)}...</TableCell>
                        <TableCell>{tx.to.substring(0, 10)}...</TableCell>
                        <TableCell>
                          <Chip
                            label={STATUS[tx.status]}
                            color={getStatusColor(tx.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{tx.location || '-'}</TableCell>
                        <TableCell>{new Date(tx.timestamp * 1000).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}

        {/* Track Batch Tab */}
        {currentTab === 1 && (
          <>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  label="Batch ID"
                  value={searchBatchId}
                  onChange={(e) => setSearchBatchId(e.target.value)}
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={searchBatch}
                  disabled={loading}
                  startIcon={<Search />}
                >
                  Search
                </Button>
              </Box>

              {loading && <LinearProgress />}

              {selectedBatch && (
                <>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Batch Information</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography><strong>Batch ID:</strong> {selectedBatch.batchId}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography><strong>Drug Name:</strong> {selectedBatch.drugName}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography><strong>Current Owner:</strong> {selectedBatch.currentOwner}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography>
                            <strong>Status:</strong>{' '}
                            <Chip
                              label={STATUS[selectedBatch.status]}
                              color={getStatusColor(selectedBatch.status)}
                              size="small"
                            />
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography>
                            <strong>Created:</strong> {new Date(selectedBatch.createdAt * 1000).toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Transaction History</Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>From</TableCell>
                            <TableCell>To</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell>Remarks</TableCell>
                            <TableCell>Time</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {batchHistory.map((tx, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{tx.from === '0x0000000000000000000000000000000000000000' ? 'Origin' : tx.from.substring(0, 10) + '...'}</TableCell>
                              <TableCell>{tx.to.substring(0, 10)}...</TableCell>
                              <TableCell>
                                <Chip label={STATUS[tx.status]} color={getStatusColor(tx.status)} size="small" />
                              </TableCell>
                              <TableCell>{tx.location || '-'}</TableCell>
                              <TableCell>{tx.remarks}</TableCell>
                              <TableCell>{new Date(tx.timestamp * 1000).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>

                  {batchAlerts.filter(a => !a.resolved).length > 0 && (
                    <Paper sx={{ p: 2, mb: 3 }}>
                      <Typography variant="h6" gutterBottom color="error">
                        🚨 Active Alerts for this Batch
                      </Typography>
                      {batchAlerts.filter(a => !a.resolved).map((alert, idx) => (
                        <Paper key={idx} sx={{ p: 2, mb: 2, bgcolor: '#ffebee', border: '2px solid #f44336' }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={8}>
                              <Typography variant="body1" sx={{ mb: 1 }}>
                                <strong>Alert #{alert.id}</strong> - {ALERT_TYPES[alert.alertType]}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 0.5 }}>
                                {alert.message}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {new Date(alert.timestamp * 1000).toLocaleString()}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                              <Button
                                variant="contained"
                                color="warning"
                                size="small"
                                onClick={async () => {
                                  if (window.confirm(`Resolve this ${ALERT_TYPES[alert.alertType]} alert?\n\nOnly resolve if you have investigated and fixed the issue.`)) {
                                    try {
                                      setLoading(true);
                                      await axios.post(
                                        `${API_BASE}/alerts/${alert.id}/resolve`,
                                        { privateKey: currentUser.privateKey }
                                      );
                                      window.alert('Alert resolved successfully!');
                                      searchBatch();
                                    } catch (error) {
                                      window.alert('Error resolving alert: ' + error.message);
                                    } finally {
                                      setLoading(false);
                                    }
                                  }
                                }}
                                disabled={loading}
                              >
                                ✓ Resolve
                              </Button>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </Paper>
                  )}

                  {batchAlerts.filter(a => a.resolved).length > 0 && (
                    <Paper sx={{ p: 2, mb: 3, bgcolor: '#f1f8e9' }}>
                      <Typography variant="h6" gutterBottom color="success.main">
                        ✅ Resolved Alerts History
                      </Typography>
                      {batchAlerts.filter(a => a.resolved).map((alert, idx) => (
                        <Paper key={idx} sx={{ p: 2, mb: 1, bgcolor: '#e8f5e9', border: '1px solid #4caf50' }}>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Alert #{alert.id}</strong> - {ALERT_TYPES[alert.alertType]}: {alert.message}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(alert.timestamp * 1000).toLocaleString()}
                          </Typography>
                          <Chip 
                            label={`✓ Resolved by ${alert.resolvedBy ? alert.resolvedBy.substring(0, 10) + '...' : 'Unknown'}`} 
                            color="success" 
                            size="small" 
                            sx={{ ml: 2 }}
                          />
                        </Paper>
                      ))}
                    </Paper>
                  )}
                </>
              )}
            </Paper>
          </>
        )}

        {/* Alerts Tab */}
        {currentTab === 2 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Active Alerts</Typography>
            {alerts.length === 0 ? (
              <Alert severity="success">No active alerts</Alert>
            ) : (
              <Grid container spacing={2}>
                {alerts.map((alert, idx) => (
                  <Grid item xs={12} key={idx}>
                    <Paper sx={{ p: 2, border: '2px solid #f44336', bgcolor: '#ffebee' }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={8}>
                          <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>🚨 Alert #{alert.id}</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Batch ID:</strong> {alert.batchId}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Type:</strong> {ALERT_TYPES[alert.alertType]}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Message:</strong> {alert.message}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Triggered: {new Date(alert.timestamp * 1000).toLocaleString()}
                          </Typography>
                          {alert.resolved && (
                            <Chip 
                              label={`Resolved by ${alert.resolvedBy}`} 
                              color="success" 
                              size="small" 
                              sx={{ ml: 2 }}
                            />
                          )}
                        </Grid>
                        <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                          {!alert.resolved ? (
                            <Button
                              variant="contained"
                              color="warning"
                              onClick={async () => {
                                if (window.confirm(`Resolve this ${ALERT_TYPES[alert.alertType]} alert for batch ${alert.batchId}?\n\nOnly resolve if you have investigated and fixed the issue.`)) {
                                  try {
                                    setLoading(true);
                                    await axios.post(
                                      `${API_BASE}/alerts/${alert.id}/resolve`,
                                      { privateKey: currentUser.privateKey }
                                    );
                                    window.alert('Alert resolved successfully!');
                                    loadDashboardData();
                                  } catch (error) {
                                    window.alert('Error resolving alert: ' + error.message);
                                  } finally {
                                    setLoading(false);
                                  }
                                }
                              }}
                              disabled={loading}
                            >
                              ✓ Resolve Alert
                            </Button>
                          ) : (
                            <Chip label="✓ RESOLVED" color="success" size="large" />
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        )}

        {/* IoT Monitoring Tab */}
        {currentTab === 3 && (
          <>
            {/* Live ESP32 Temperature Display */}
            <Box sx={{ mb: 3 }}>
              <LiveTemperature />
            </Box>

            {selectedBatch && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
                  🌡️ IoT Environmental Monitoring - {selectedBatch.batchId}
                </Typography>

                {/* Batch Summary Info */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, bgcolor: '#e3f2fd', textAlign: 'center' }}>
                  <Typography variant="caption" color="textSecondary">Drug Name</Typography>
                  <Typography variant="h6">{selectedBatch.drugName}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, bgcolor: '#f3e5f5', textAlign: 'center' }}>
                  <Typography variant="caption" color="textSecondary">Current Status</Typography>
                  <Typography variant="h6">{STATUS[selectedBatch.status]}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, bgcolor: '#e8f5e9', textAlign: 'center' }}>
                  <Typography variant="caption" color="textSecondary">Total IoT Logs</Typography>
                  <Typography variant="h6">{batchIoTData.length}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, bgcolor: '#fff3e0', textAlign: 'center' }}>
                  <Typography variant="caption" color="textSecondary">Created At</Typography>
                  <Typography variant="h6" sx={{ fontSize: '0.9rem' }}>
                    {new Date(selectedBatch.createdAt * 1000).toLocaleDateString()}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {batchIoTData.length > 0 ? (
              <>
                {/* IoT-Related Alerts for this batch */}
                {batchAlerts.filter(a => !a.resolved && (a.alertType === 0 || a.alertType === 1 || a.alertType === 2 || a.alertType === 3)).length > 0 && (
                  <Paper sx={{ p: 2, mb: 3, bgcolor: '#ffebee', border: '2px solid #f44336' }}>
                    <Typography variant="h6" gutterBottom color="error">
                      🚨 IoT Environmental Alerts
                    </Typography>
                    <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
                      These alerts were triggered by sensor readings that exceeded safe thresholds during transportation and storage.
                    </Typography>
                    {batchAlerts.filter(a => !a.resolved && (a.alertType === 0 || a.alertType === 1 || a.alertType === 2 || a.alertType === 3)).map((alert, idx) => (
                      <Paper key={idx} sx={{ p: 2, mb: 1, bgcolor: 'white' }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={8}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                              ⚠️ {ALERT_TYPES[alert.alertType]} Alert
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {alert.message}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                              Detected: {new Date(alert.timestamp * 1000).toLocaleString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                            <Button
                              variant="contained"
                              color="warning"
                              size="small"
                              onClick={async () => {
                                if (window.confirm(`Resolve this ${ALERT_TYPES[alert.alertType]} alert?\n\nOnly resolve if you have investigated and fixed the issue.`)) {
                                  try {
                                    setLoading(true);
                                    await axios.post(
                                      `${API_BASE}/alerts/${alert.id}/resolve`,
                                      { privateKey: currentUser.privateKey }
                                    );
                                    window.alert('Alert resolved successfully!');
                                    // Reload both dashboard and batch alerts
                                    loadDashboardData();
                                    if (selectedBatch) {
                                      const alertsRes = await axios.get(`${API_BASE}/alerts/${selectedBatch.batchId}`);
                                      setBatchAlerts(alertsRes.data.alerts);
                                    }
                                  } catch (error) {
                                    window.alert('Error resolving alert: ' + error.message);
                                  } finally {
                                    setLoading(false);
                                  }
                                }
                              }}
                              disabled={loading}
                            >
                              ✓ Resolve Alert
                            </Button>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </Paper>
                )}

                {/* Statistics Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, bgcolor: '#e3f2fd' }}>
                      <Typography variant="caption" color="textSecondary">🌡️ Avg Temperature</Typography>
                      <Typography variant="h5">
                        {(batchIoTData.reduce((sum, d) => sum + d.temperature, 0) / batchIoTData.length).toFixed(2)}°C
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
                      <Typography variant="caption" color="textSecondary">💧 Avg Humidity</Typography>
                      <Typography variant="h5">
                        {Math.round(batchIoTData.reduce((sum, d) => sum + d.humidity, 0) / batchIoTData.length)}%
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, bgcolor: '#fff3e0' }}>
                      <Typography variant="caption" color="textSecondary">📊 Avg Pressure</Typography>
                      <Typography variant="h5">
                        {Math.round(batchIoTData.reduce((sum, d) => sum + d.pressure, 0) / batchIoTData.length)} kPa
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Paper sx={{ 
                      p: 2, 
                      bgcolor: batchIoTData.some(d => d.tamperDetected) ? '#ffebee' : '#e8f5e9' 
                    }}>
                      <Typography variant="caption" color="textSecondary">🔒 Tamper Events</Typography>
                      <Typography variant="h5" color={batchIoTData.some(d => d.tamperDetected) ? 'error' : 'success'}>
                        {batchIoTData.filter(d => d.tamperDetected).length}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Temperature & Humidity Charts */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>🌡️ Temperature Trend</Typography>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={batchIoTData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="timestamp"
                            tickFormatter={(ts) => new Date(ts * 1000).toLocaleTimeString()}
                          />
                          <YAxis domain={[-15, 30]} />
                          <Tooltip labelFormatter={(ts) => new Date(ts * 1000).toLocaleString()} />
                          <Legend />
                          <Line type="monotone" dataKey="temperature" stroke="#ff5722" strokeWidth={2} name="Temperature (°C)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>💧 Humidity Trend</Typography>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={batchIoTData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="timestamp"
                            tickFormatter={(ts) => new Date(ts * 1000).toLocaleTimeString()}
                          />
                          <YAxis domain={[0, 100]} />
                          <Tooltip labelFormatter={(ts) => new Date(ts * 1000).toLocaleString()} />
                          <Legend />
                          <Line type="monotone" dataKey="humidity" stroke="#2196f3" strokeWidth={2} name="Humidity (%)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Detailed Data Table */}
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>📋 Detailed Sensor Logs</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell><strong>Timestamp</strong></TableCell>
                        <TableCell><strong>📍 Location & GPS</strong></TableCell>
                        <TableCell><strong>🌡️ Temp</strong></TableCell>
                        <TableCell><strong>💧 Humidity</strong></TableCell>
                        <TableCell><strong>📊 Pressure</strong></TableCell>
                        <TableCell><strong>🔒 Tamper</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {batchIoTData.map((data, idx) => {
                        const tempOutOfRange = data.temperature < -10 || data.temperature > 25;
                        const humidityHigh = data.humidity > 70;
                        const pressureOutOfRange = data.pressure < 95 || data.pressure > 105;
                        const hasIssue = tempOutOfRange || humidityHigh || pressureOutOfRange || data.tamperDetected;

                        return (
                          <TableRow 
                            key={idx}
                            sx={{ 
                              bgcolor: hasIssue ? '#ffebee' : idx % 2 === 0 ? '#fafafa' : 'white',
                              '&:hover': { bgcolor: '#f5f5f5' }
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2">
                                {new Date(data.timestamp * 1000).toLocaleDateString()}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {new Date(data.timestamp * 1000).toLocaleTimeString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{data.location}</Typography>
                              {data.latitude && data.longitude && (
                                <Typography variant="caption" color="textSecondary">
                                  📍 {data.latitude}°, {data.longitude}°
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 'bold',
                                  color: tempOutOfRange ? '#d32f2f' : '#2e7d32' 
                                }}
                              >
                                {data.temperature.toFixed(2)}°C
                              </Typography>
                              {tempOutOfRange && (
                                <Typography variant="caption" color="error">⚠️ Out of range</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 'bold',
                                  color: humidityHigh ? '#d32f2f' : '#2e7d32' 
                                }}
                              >
                                {data.humidity}%
                              </Typography>
                              {humidityHigh && (
                                <Typography variant="caption" color="error">⚠️ Too high</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2"
                                sx={{ 
                                  color: pressureOutOfRange ? '#d32f2f' : 'inherit' 
                                }}
                              >
                                {data.pressure} kPa
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {data.tamperDetected ? (
                                <Chip label="YES" color="error" size="small" icon={<span>⚠️</span>} />
                              ) : (
                                <Chip label="NO" color="success" size="small" icon={<span>✅</span>} />
                              )}
                            </TableCell>
                            <TableCell>
                              {hasIssue ? (
                                <Chip label="⚠️ Alert" color="error" size="small" />
                              ) : (
                                <Chip label="✅ Normal" color="success" size="small" />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : null}
              </Paper>
          )}
          </>
        )}
          </>
        )}
      </Container>
    </Box>
  );
}

export default App;
