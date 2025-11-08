import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, Grid, Chip } from '@mui/material';
import { Thermostat, LocationOn, Schedule } from '@mui/icons-material';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function LiveTemperature() {
  const [tempData, setTempData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Load temperature data every 2 seconds
    const loadTemperature = async () => {
      try {
        const res = await fetch(`${API_BASE}/live-temperature`);
        const data = await res.json();
        
        if (data.success && data.data) {
          setTempData(data.data);
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        console.error('Error fetching temperature:', error);
        setIsConnected(false);
      }
    };

    loadTemperature();
    const interval = setInterval(loadTemperature, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const getTemperatureColor = (temp) => {
    if (temp === null) return '#999';
    if (temp < 28) return '#2196f3'; // Too Cold - Blue
    if (temp >= 28 && temp <= 33) return '#4caf50'; // Safe Range - Green
    if (temp > 33 && temp <= 35) return '#ff9800'; // Warning - Orange
    return '#f44336'; // Critical Hot - Red
  };

  const getTemperatureStatus = (temp) => {
    if (temp === null) return 'No Data';
    if (temp < 28) return '🥶 Too Cold';
    if (temp >= 28 && temp <= 33) return '🌡️ Safe Range';
    if (temp > 33 && temp <= 35) return '⚠️ Warning';
    return '🔥 Critical Hot';
  };

  const getTemperatureIcon = (temp) => {
    if (temp === null) return '❓';
    if (temp < 28) return '🥶';
    if (temp >= 28 && temp <= 33) return '🌡️';
    if (temp > 33 && temp <= 35) return '⚠️';
    return '🔥';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <Paper 
      sx={{ 
        p: 3, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 3,
        boxShadow: 3
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        🌡️ ESP32 Live Temperature Monitor
      </Typography>

      {!isConnected ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, opacity: 0.8 }}>
            ⏳ Waiting for ESP32 connection...
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Make sure ESP32 is powered on and sending data
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {/* Large Temperature Display */}
            <Grid item xs={12} md={6}>
              <Paper 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.95)',
                  borderRadius: 2,
                  border: `4px solid ${getTemperatureColor(tempData?.temperature)}`,
                  boxShadow: `0 8px 16px ${getTemperatureColor(tempData?.temperature)}40`
                }}
              >
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontSize: '4rem',
                    mb: 1
                  }}
                >
                  {getTemperatureIcon(tempData?.temperature)}
                </Typography>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: getTemperatureColor(tempData?.temperature),
                    textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {tempData?.temperature !== null ? tempData.temperature.toFixed(1) : '--'}°C
                </Typography>
                <Chip 
                  label={getTemperatureStatus(tempData?.temperature)}
                  sx={{ 
                    mt: 2,
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    bgcolor: getTemperatureColor(tempData?.temperature),
                    color: 'white',
                    py: 2.5,
                    px: 1,
                    boxShadow: 2
                  }}
                  size="large"
                />
              </Paper>
            </Grid>

            {/* Additional Info */}
            <Grid item xs={12} md={6}>
              <Paper 
                sx={{ 
                  p: 3, 
                  background: 'rgba(255,255,255,0.95)',
                  borderRadius: 2,
                  height: '100%'
                }}
              >
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOn sx={{ fontSize: 18, mr: 0.5 }} /> Location
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {tempData?.location || 'Unknown'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Schedule sx={{ fontSize: 18, mr: 0.5 }} /> Last Update
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {formatTimestamp(tempData?.timestamp)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    💧 Humidity
                  </Typography>
                  <Typography variant="body1" color="text.primary">
                    {tempData?.humidity || 0}%
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="textSecondary">
                    📊 Pressure
                  </Typography>
                  <Typography variant="body1" color="text.primary">
                    {tempData?.pressure || 0} kPa
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Safe Range Info with Visual Thermometer */}
          <Paper 
            sx={{ 
              p: 3, 
              mt: 3, 
              background: 'rgba(255,255,255,0.95)',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" color="text.primary" gutterBottom sx={{ fontWeight: 'bold' }}>
              📊 Temperature Range Guide
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
              <strong>Safe Operating Range:</strong> 28°C - 33°C
            </Typography>
            
            {/* Visual Range Indicator */}
            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
              <Chip 
                icon={<span>🥶</span>}
                label="< 28°C: Too Cold" 
                size="medium" 
                sx={{ 
                  bgcolor: '#2196f3', 
                  color: 'white',
                  fontWeight: 'bold',
                  flex: 1,
                  minWidth: '140px'
                }} 
              />
              <Chip 
                icon={<span>🌡️</span>}
                label="28-33°C: Safe" 
                size="medium" 
                sx={{ 
                  bgcolor: '#4caf50', 
                  color: 'white',
                  fontWeight: 'bold',
                  flex: 1,
                  minWidth: '140px',
                  boxShadow: 3
                }} 
              />
              <Chip 
                icon={<span>⚠️</span>}
                label="33-35°C: Warning" 
                size="medium" 
                sx={{ 
                  bgcolor: '#ff9800', 
                  color: 'white',
                  fontWeight: 'bold',
                  flex: 1,
                  minWidth: '140px'
                }} 
              />
              <Chip 
                icon={<span>🔥</span>}
                label="> 35°C: Critical" 
                size="medium" 
                sx={{ 
                  bgcolor: '#f44336', 
                  color: 'white',
                  fontWeight: 'bold',
                  flex: 1,
                  minWidth: '140px'
                }} 
              />
            </Box>

            {/* Current Status Alert */}
            {tempData?.temperature && (tempData.temperature < 28 || tempData.temperature > 33) && (
              <Box 
                sx={{ 
                  mt: 3, 
                  p: 2, 
                  bgcolor: getTemperatureColor(tempData?.temperature) + '20',
                  border: `2px solid ${getTemperatureColor(tempData?.temperature)}`,
                  borderRadius: 2
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: getTemperatureColor(tempData?.temperature) }}>
                  {tempData.temperature < 28 ? '⚠️ ALERT: Temperature is below safe range!' : '⚠️ ALERT: Temperature is above safe range!'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Blockchain alerts have been automatically triggered for all active batches.
                </Typography>
              </Box>
            )}
          </Paper>
        </>
      )}
    </Paper>
  );
}

export default LiveTemperature;
