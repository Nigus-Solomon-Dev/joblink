class PerformanceMonitor {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      totalErrors: 0,
      averageResponseTime: 0,
      endpoints: {},
    };
    this.responseTimes = [];
  }

  recordRequest(startTime, statusCode, endpoint) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1e6;
    
    this.metrics.totalRequests++;
    this.responseTimes.push(duration);
    
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
    
    this.metrics.averageResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    
    if (statusCode >= 400) {
      this.metrics.totalErrors++;
    }
    
    if (!this.metrics.endpoints[endpoint]) {
      this.metrics.endpoints[endpoint] = {
        count: 0,
        totalTime: 0,
        errors: 0,
        avgTime: 0
      };
    }
    
    const endpointData = this.metrics.endpoints[endpoint];
    endpointData.count++;
    endpointData.totalTime += duration;
    endpointData.avgTime = endpointData.totalTime / endpointData.count;
    
    if (statusCode >= 400) {
      endpointData.errors++;
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    };
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      totalErrors: 0,
      averageResponseTime: 0,
      endpoints: {},
    };
    this.responseTimes = [];
  }
}

module.exports = new PerformanceMonitor();