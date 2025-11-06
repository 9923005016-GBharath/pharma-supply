import React, { useState } from 'react';
import {
  Container, Paper, Typography, TextField, Button, Box, FormControl,
  InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';

const ROLES = {
  0: 'Patient',
  1: 'FDA',
  2: 'Ingredient Supplier',
  3: 'Manufacturer',
  4: 'Repackager',
  5: 'Distributor',
  6: 'Pharmacy'
};

// Pre-registered users from deployment
const REGISTERED_USERS = [
  {
    address: '0x0000000000000000000000000000000000000001',
    privateKey: 'patient',
    name: 'Patient (Public Access)',
    role: 0
  },
  {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    name: 'FDA Regulatory Authority',
    role: 1
  },
  {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    name: 'Ingredient Supplier Co.',
    role: 2
  },
  {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    name: 'PharmaTech Manufacturing',
    role: 3
  },
  {
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
    name: 'RePackage Solutions Inc.',
    role: 4
  },
  {
    address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
    name: 'Global Distribution Network',
    role: 5
  },
  {
    address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    privateKey: '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
    name: 'City Central Pharmacy',
    role: 6
  }
];

function Login({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState('');

  const handleQuickLogin = (user) => {
    onLogin(user);
  };

  const handleManualLogin = () => {
    if (!selectedRole || !privateKey) {
      setError('Please select a role and enter your private key');
      return;
    }

    // Find user by private key
    const user = REGISTERED_USERS.find(u => 
      u.privateKey.toLowerCase() === privateKey.toLowerCase()
    );

    if (!user) {
      setError('Invalid private key or user not registered');
      return;
    }

    if (user.role !== parseInt(selectedRole)) {
      setError('Private key does not match selected role');
      return;
    }

    onLogin(user);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <LoginIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" gutterBottom>
            Pharma Supply Chain
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Role-Based Authentication System
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Quick Login Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Quick Login (Demo Users)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Click on a user to login instantly:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {REGISTERED_USERS.map((user) => (
              <Button
                key={user.address}
                variant="outlined"
                onClick={() => handleQuickLogin(user)}
                sx={{ justifyContent: 'flex-start', textTransform: 'none', p: 2 }}
              >
                <Box sx={{ textAlign: 'left', width: '100%' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {user.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Role: {ROLES[user.role]} | Address: {user.address.slice(0, 10)}...
                  </Typography>
                </Box>
              </Button>
            ))}
          </Box>
        </Box>

        {/* Manual Login Section */}
        <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Manual Login
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select your role and enter your private key:
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Your Role</InputLabel>
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              label="Select Your Role"
            >
              {Object.entries(ROLES).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Private Key"
            type="password"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="0x..."
            sx={{ mb: 2 }}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleManualLogin}
            size="large"
          >
            Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default Login;
