import express from 'express';
import { supabaseHelpers } from '../lib/supabase';

const router = express.Router();

// Save a completed timer
router.post('/save', async (req, res) => {
  try {
    const { userId, duration, type, completed } = req.body;
    
    if (!userId || !duration || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const timer = await supabaseHelpers.saveTimer(userId, {
      duration,
      type,
      completed
    });

    res.json(timer);
  } catch (error) {
    console.error('Error saving timer:', error);
    res.status(500).json({ error: 'Failed to save timer' });
  }
});

// Get timer history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;
    
    const history = await supabaseHelpers.getTimerHistory(
      userId,
      limit ? parseInt(limit as string) : undefined
    );

    res.json(history);
  } catch (error) {
    console.error('Error fetching timer history:', error);
    res.status(500).json({ error: 'Failed to fetch timer history' });
  }
});

// Get user settings
router.get('/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const settings = await supabaseHelpers.getUserSettings(userId);
    res.json(settings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Failed to fetch user settings' });
  }
});

// Update user settings
router.put('/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const settings = req.body;
    
    const updatedSettings = await supabaseHelpers.updateUserSettings(userId, settings);
    res.json(updatedSettings);
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

export default router; 