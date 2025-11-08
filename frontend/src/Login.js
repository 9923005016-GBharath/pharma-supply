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

function Login({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  const handleSignUp = async () => {
    if (!name || !email || !password || !selectedRole) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Register user (backend will generate blockchain wallet)
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role: parseInt(selectedRole)
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('✅ Account created! You can now login.');
      setTimeout(() => {
        setIsSignUp(false);
        setSuccess('');
        setPassword('');
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password || !selectedRole) {
      setError('Please enter email, password and select role');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password,
          role: parseInt(selectedRole)
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      // Login successful - user data includes blockchain credentials
      onLogin(data.user);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
              }}
            >
              <LoginIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {isSignUp ? 'Join the Pharmaceutical Supply Chain Network' : 'Sign in to continue'}
            </Typography>
          </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={(e) => { e.preventDefault(); isSignUp ? handleSignUp() : handleLogin(); }}>
          {isSignUp && (
            <TextField
              fullWidth
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          )}

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Your Role</InputLabel>
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              label="Select Your Role"
              required
              sx={{ borderRadius: 2 }}
            >
              {Object.entries(ROLES).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {value === '0' && '👤'}
                    {value === '1' && '⚖️'}
                    {value === '2' && '🏭'}
                    {value === '3' && '⚙️'}
                    {value === '4' && '📦'}
                    {value === '5' && '🚚'}
                    {value === '6' && '🏥'}
                    <span>{label}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
            sx={{
              mb: isSignUp ? 2 : 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
            helperText={isSignUp ? "Minimum 6 characters" : ""}
          />

          {isSignUp && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                🔐 A blockchain wallet will be automatically created for you!
              </Typography>
            </Alert>
          )}

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              py: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                boxShadow: '0 6px 16px rgba(102, 126, 234, 0.5)'
              }
            }}
          >
            {loading ? '⏳ Processing...' : (isSignUp ? '🚀 Create Account' : '🔓 Login')}
          </Button>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </Typography>
            <Button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccess('');
                setName('');
                setEmail('');
                setPassword('');
                setSelectedRole('');
              }}
              variant="text"
              sx={{
                textTransform: 'none',
                fontWeight: 'bold',
                color: '#667eea'
              }}
            >
              {isSignUp ? 'Login here' : 'Sign Up now'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
    </Box>
  );
}

export default Login;
