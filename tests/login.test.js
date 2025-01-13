import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, logout, getUserInfo, isAuthenticated, getAuthToken, getCurrentUserName, 
  getCurrentDirectory, getUsageInfo } from './commands/auth.js';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import fetch from 'node-fetch';
import Conf from 'conf';
import { BASE_URL } from '../commands/commons.js';

// Mock console to prevent actual logging
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock dependencies
vi.mock('inquirer');
vi.mock('chalk', () => ({
  default: {
    green: vi.fn(text => text),
    red: vi.fn(text => text),
    dim: vi.fn(text => text)
  }
}));
vi.mock('node-fetch');

// Mock Conf
vi.mock('conf', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      set: vi.fn(),
      get: vi.fn(),
    }))
  }
});

// Create a mock spinner object
const mockSpinner = {
  start: vi.fn().mockReturnThis(),
  succeed: vi.fn().mockReturnThis(),
  fail: vi.fn().mockReturnThis()
};

// Mock ora
vi.mock('ora', () => ({
  default: vi.fn(() => mockSpinner)
}));


describe('auth.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      // Mock inquirer response
      inquirer.prompt.mockResolvedValue({ 
        username: 'testuser', 
        password: 'testpass' 
      });

      // Mock fetch response
      fetch.mockResolvedValue({
        json: () => Promise.resolve({ 
          proceed: true, 
          token: 'testtoken' 
        })
      });
      
      await login();

      // Verify inquirer was called
      expect(inquirer.prompt).toHaveBeenCalled();

      // Verify fetch was called with correct parameters
      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/login`, {
        method: 'POST',
        headers: expect.any(Object),
        body: JSON.stringify({ 
          username: 'testuser', 
          password: 'testpass' 
        }),
      });

      // Verify spinner methods were called
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.succeed).toHaveBeenCalled();
      
    });
/*
    it('should fail login with invalid credentials', async () => {
      inquirer.prompt.mockResolvedValue({ username: 'testuser', password: 'testpass' });
      fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue({ proceed: false }),
        ok: true,
      });
      const spinner = { start: vi.fn(), fail: vi.fn() };
      ora.mockReturnValue(spinner);

      await login();

      expect(spinner.fail).toHaveBeenCalledWith(chalk.red('Login failed. Please check your credentials.'));
    });

    it('should handle login error', async () => {
      inquirer.prompt.mockResolvedValue({ username: 'testuser', password: 'testpass' });
      fetch.mockRejectedValue(new Error('Network error'));
      const spinner = { start: vi.fn(), fail: vi.fn() };
      ora.mockReturnValue(spinner);

      await login();

      expect(spinner.fail).toHaveBeenCalledWith(chalk.red('Failed to login'));
    });*/
  });
/*
  describe('logout', () => {
    it('should logout successfully', async () => {
      config.get.mockReturnValue('testtoken');
      const spinner = { start: vi.fn(), succeed: vi.fn() };
      ora.mockReturnValue(spinner);

      await logout();

      expect(config.clear).toHaveBeenCalled();
      expect(spinner.succeed).toHaveBeenCalledWith(chalk.green('Successfully logged out from Puter!'));
    });

    it('should handle already logged out', async () => {
      config.get.mockReturnValue(null);
      const spinner = { start: vi.fn(), info: vi.fn() };
      ora.mockReturnValue(spinner);

      await logout();

      expect(spinner.info).toHaveBeenCalledWith(chalk.yellow('Already logged out'));
    });

    it('should handle logout error', async () => {
      config.get.mockReturnValue('testtoken');
      config.clear.mockImplementation(() => { throw new Error('Config error'); });
      const spinner = { start: vi.fn(), fail: vi.fn() };
      ora.mockReturnValue(spinner);

      await logout();

      expect(spinner.fail).toHaveBeenCalledWith(chalk.red('Failed to logout'));
    });
  });

  describe('getUserInfo', () => {
    it('should fetch user info successfully', async () => {
      fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          username: 'testuser',
          uuid: 'testuuid',
          email: 'test@example.com',
          email_confirmed: true,
          is_temp: false,
          human_readable_age: '1 year',
          feature_flags: { flag1: true, flag2: false },
        }),
        ok: true,
      });

      await getUserInfo();

      expect(fetch).toHaveBeenCalledWith(`${API_BASE}/whoami`, {
        method: 'GET',
        headers: expect.any(Object),
      });
    });

    it('should handle fetch user info error', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      await getUserInfo();

      expect(console.error).toHaveBeenCalledWith(chalk.red('Failed to get user info.\nError: Network error'));
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if auth token exists', () => {
      config.get.mockReturnValue('testtoken');

      const result = isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false if auth token does not exist', () => {
      config.get.mockReturnValue(null);

      const result = isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getAuthToken', () => {
    it('should return the auth token', () => {
      config.get.mockReturnValue('testtoken');

      const result = getAuthToken();

      expect(result).toBe('testtoken');
    });
  });

  describe('getCurrentUserName', () => {
    it('should return the current username', () => {
      config.get.mockReturnValue('testuser');

      const result = getCurrentUserName();

      expect(result).toBe('testuser');
    });
  });

  describe('getCurrentDirectory', () => {
    it('should return the current directory', () => {
      config.get.mockReturnValue('/testuser');

      const result = getCurrentDirectory();

      expect(result).toBe('/testuser');
    });
  });

  describe('getUsageInfo', () => {
    it('should fetch usage info successfully', async () => {
      fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          user: [
            {
              service: { 'driver.interface': 'interface1', 'driver.method': 'method1', 'driver.implementation': 'impl1' },
              month: 1,
              year: 2023,
              monthly_usage: 10,
              monthly_limit: 100,
              policy: { 'rate-limit': { max: 5, period: 30000 } },
            },
          ],
          apps: { app1: { used: 5, available: 50 } },
          usages: [{ name: 'usage1', used: 10, available: 100, refill: 'monthly' }],
        }),
        ok: true,
      });

      await getUsageInfo();

      expect(fetch).toHaveBeenCalledWith(`${API_BASE}/drivers/usage`, {
        method: 'GET',
        headers: expect.any(Object),
      });
    });

    it('should handle fetch usage info error', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      await getUsageInfo();

      expect(console.error).toHaveBeenCalledWith(chalk.red('Failed to fetch usage information.\nError: Network error'));
    });
  });
  */
});