// Performance monitoring utilities for production

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep only the last 1000 metrics

  // Start timing an operation
  startTimer(
    name: string
  ): (metadata?: Record<string, unknown>) => PerformanceMetric {
    const startTime = performance.now();
    const timestamp = Date.now();

    return (metadata?: Record<string, unknown>) => {
      const duration = performance.now() - startTime;
      const metric: PerformanceMetric = {
        name,
        duration,
        timestamp,
        metadata,
      };

      this.addMetric(metric);
      return metric;
    };
  }

  // Add a metric manually
  addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  // Get metrics for a specific operation
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter((metric) => metric.name === name);
    }
    return [...this.metrics];
  }

  // Get performance statistics
  getStats(name?: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  } {
    const metrics = this.getMetrics(name);

    if (metrics.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, p95: 0, p99: 0 };
    }

    const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
    const count = durations.length;
    const sum = durations.reduce((acc, d) => acc + d, 0);
    const average = sum / count;
    const min = durations[0];
    const max = durations[count - 1];
    const p95Index = Math.floor(count * 0.95);
    const p99Index = Math.floor(count * 0.99);
    const p95 = durations[p95Index] || max;
    const p99 = durations[p99Index] || max;

    return { count, average, min, max, p95, p99 };
  }

  // Clear all metrics
  clear(): void {
    this.metrics = [];
  }

  // Get recent slow operations
  getSlowOperations(thresholdMs = 1000, limit = 10): PerformanceMetric[] {
    return this.metrics
      .filter((metric) => metric.duration > thresholdMs)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Middleware wrapper for API routes
export function withPerformanceMonitoring<T extends unknown[], R>(
  name: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const endTimer = performanceMonitor.startTimer(name);

    try {
      const result = await fn(...args);
      endTimer({ success: true });
      return result;
    } catch (error) {
      endTimer({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  };
}

// Database query performance wrapper
export function withDatabaseMonitoring<T extends unknown[], R>(
  queryName: string,
  queryFn: (...args: T) => Promise<R>
) {
  return withPerformanceMonitoring(`db:${queryName}`, queryFn);
}

// API route performance wrapper
export function withApiMonitoring<T extends unknown[], R>(
  routeName: string,
  handler: (...args: T) => Promise<R>
) {
  return withPerformanceMonitoring(`api:${routeName}`, handler);
}

// Memory usage monitoring
export function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    timestamp: Date.now(),
  };
}

// Log performance summary
export function logPerformanceSummary(): void {
  const allStats = performanceMonitor.getStats();
  const slowOps = performanceMonitor.getSlowOperations(500, 5);
  const memory = getMemoryUsage();

  console.log("\n📊 Performance Summary:");
  console.log(`  Total operations: ${allStats.count}`);
  console.log(`  Average response time: ${allStats.average.toFixed(2)}ms`);
  console.log(`  95th percentile: ${allStats.p95.toFixed(2)}ms`);
  console.log(`  99th percentile: ${allStats.p99.toFixed(2)}ms`);

  if (slowOps.length > 0) {
    console.log("\n🐌 Slowest operations:");
    slowOps.forEach((op) => {
      console.log(`  - ${op.name}: ${op.duration.toFixed(2)}ms`);
    });
  }

  console.log("\n💾 Memory usage:");
  console.log(`  Heap used: ${memory.heapUsed}MB`);
  console.log(`  Heap total: ${memory.heapTotal}MB`);
  console.log(`  RSS: ${memory.rss}MB`);
}

// Automatic performance logging in production
if (process.env.NODE_ENV === "production") {
  // Log performance summary every 5 minutes
  setInterval(logPerformanceSummary, 5 * 60 * 1000);
}
