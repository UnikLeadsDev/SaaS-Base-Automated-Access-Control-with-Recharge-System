#!/usr/bin/env node

/**
 * SaaS Base Deployment Script
 * Automates the deployment process for production environment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const runCommand = (command, description) => {
  try {
    log(`\n🔄 ${description}...`, 'blue');
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`, 'green');
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    process.exit(1);
  }
};

const checkEnvironment = () => {
  log('\n🔍 Checking environment...', 'blue');
  
  const requiredFiles = [
    'backend/.env',
    'backend/package.json',
    'frontend/package.json'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      log(`❌ Missing required file: ${file}`, 'red');
      process.exit(1);
    }
  }
  
  log('✅ Environment check passed', 'green');
};

const deployBackend = () => {
  log('\n📦 Deploying Backend...', 'yellow');
  
  process.chdir('backend');
  
  // Install dependencies
  runCommand('npm ci --production', 'Installing backend dependencies');
  
  // Run database migrations
  runCommand('npm run migrate', 'Running database migrations');
  
  // Start PM2 process
  runCommand('pm2 start ecosystem.config.js --env production', 'Starting backend with PM2');
  
  process.chdir('..');
};

const deployFrontend = () => {
  log('\n🎨 Deploying Frontend...', 'yellow');
  
  process.chdir('frontend');
  
  // Install dependencies
  runCommand('npm ci', 'Installing frontend dependencies');
  
  // Build for production
  runCommand('npm run build', 'Building frontend for production');
  
  // Deploy to S3 or serve statically
  if (process.env.AWS_S3_BUCKET) {
    runCommand(`aws s3 sync dist/ s3://${process.env.AWS_S3_BUCKET} --delete`, 'Deploying to S3');
  } else {
    runCommand('pm2 serve dist 3000 --name "saas-frontend"', 'Serving frontend with PM2');
  }
  
  process.chdir('..');
};

const setupNginx = () => {
  log('\n🌐 Setting up Nginx...', 'yellow');
  
  const nginxConfig = `
server {
    listen 80;
    server_name ${process.env.DOMAIN_NAME || 'localhost'};
    
    # Frontend
    location / {
        root /var/www/saas-base/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}`;
  
  fs.writeFileSync('/etc/nginx/sites-available/saas-base', nginxConfig);
  
  runCommand('ln -sf /etc/nginx/sites-available/saas-base /etc/nginx/sites-enabled/', 'Enabling Nginx site');
  runCommand('nginx -t', 'Testing Nginx configuration');
  runCommand('systemctl reload nginx', 'Reloading Nginx');
};

const setupSSL = () => {
  if (process.env.DOMAIN_NAME && process.env.ENABLE_SSL === 'true') {
    log('\n🔒 Setting up SSL...', 'yellow');
    runCommand(`certbot --nginx -d ${process.env.DOMAIN_NAME}`, 'Installing SSL certificate');
  }
};

const setupMonitoring = () => {
  log('\n📊 Setting up monitoring...', 'yellow');
  
  // PM2 monitoring
  runCommand('pm2 install pm2-logrotate', 'Installing PM2 log rotation');
  runCommand('pm2 set pm2-logrotate:max_size 10M', 'Setting log rotation size');
  runCommand('pm2 set pm2-logrotate:retain 30', 'Setting log retention');
  
  // Setup PM2 startup
  runCommand('pm2 startup', 'Setting up PM2 startup');
  runCommand('pm2 save', 'Saving PM2 configuration');
};

const main = async () => {
  log('🚀 Starting SaaS Base Deployment', 'green');
  
  try {
    checkEnvironment();
    deployBackend();
    deployFrontend();
    
    if (process.env.SETUP_NGINX === 'true') {
      setupNginx();
      setupSSL();
    }
    
    setupMonitoring();
    
    log('\n🎉 Deployment completed successfully!', 'green');
    log('\n📋 Post-deployment checklist:', 'yellow');
    log('  • Verify all services are running: pm2 status');
    log('  • Check application logs: pm2 logs');
    log('  • Test API endpoints');
    log('  • Verify webhook URLs in Razorpay dashboard');
    log('  • Test notification system');
    
  } catch (error) {
    log(`\n💥 Deployment failed: ${error.message}`, 'red');
    process.exit(1);
  }
};

// Run deployment
main();