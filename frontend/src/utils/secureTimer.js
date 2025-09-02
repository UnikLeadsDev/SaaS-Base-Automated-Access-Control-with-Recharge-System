// Secure timer utility to prevent code injection
export class SecureTimer {
  constructor() {
    this.intervalId = null;
    this.isActive = false;
  }

  start(duration, callback) {
    this.stop(); // Clear any existing timer
    
    if (typeof duration !== 'number' || duration < 0 || duration > 3600) {
      throw new Error('Invalid timer duration');
    }
    
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    this.isActive = true;
    let remaining = Math.floor(duration);
    
    this.intervalId = setInterval(() => {
      if (!this.isActive) {
        this.stop();
        return;
      }
      
      remaining = Math.max(0, remaining - 1);
      callback(remaining);
      
      if (remaining === 0) {
        this.stop();
      }
    }, 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isActive = false;
  }

  isRunning() {
    return this.isActive;
  }
}