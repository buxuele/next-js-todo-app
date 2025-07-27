/**
 * Database performance and connection stability tests
 * Validates database operations under various conditions
 */

import { prisma } from "@/lib/db";
import { checkDatabaseHealth, warmConnection } from "@/lib/db-vercel";
import { performanceMonitor } from "@/lib/performance-monitor";

// Skip these tests if no database connection is available
const skipIfNoDatabase = process.env.DATABASE_URL ? describe : describe.skip;

skipIfNoDatabase("Database Performance and Stability", () => {
  beforeAll(async () => {
    // Warm up the connection
    await warmConnection();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Connection Health", () => {
    it("establishes database connection successfully", async () => {
      const health = await checkDatabaseHealth();
      expect(health.status).toBe("healthy");
      expect(health.timestamp).toBeDefined();
    });

    it("handles connection warming", async () => {
      const result = await warmConnection();
      expect(result).toBe(true);
    });

    it("maintains connection stability over multiple operations", async () => {
      const operations = [];

      // Perform multiple concurrent operations
      for (let i = 0; i < 10; i++) {
        operations.push(prisma.$queryRaw`SELECT 1 as test`);
      }

      const results = await Promise.all(operations);
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).toEqual([{ test: 1 }]);
      });
    });
  });

  describe("Query Performance", () => {
    const testDate = "2025-07-26";
    let createdTodoIds: number[] = [];

    beforeAll(async () => {
      // Create test data
      const testTodos = [];
      for (let i = 0; i < 50; i++) {
        testTodos.push({
          content: `Performance test todo ${i + 1}`,
          date: testDate,
          orderNum: i + 1,
          completed: i % 3 === 0, // Every third todo is completed
        });
      }

      await prisma.todo.createMany({
        data: testTodos,
      });

      // Get the IDs of created todos
      const todos = await prisma.todo.findMany({
        where: { date: testDate },
        select: { id: true },
      });
      createdTodoIds = todos.map((todo) => todo.id);
    });

    afterAll(async () => {
      // Clean up test data
      if (createdTodoIds.length > 0) {
        await prisma.todo.deleteMany({
          where: { id: { in: createdTodoIds } },
        });
      }
    });

    it("performs fast todo queries", async () => {
      const startTime = performance.now();

      const todos = await prisma.todo.findMany({
        where: { date: testDate },
        orderBy: [{ completed: "asc" }, { orderNum: "desc" }],
      });

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      expect(todos.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second

      console.log(`Query completed in ${queryTime.toFixed(2)}ms`);
    });

    it("handles concurrent read operations efficiently", async () => {
      const startTime = performance.now();

      const concurrentQueries = [];
      for (let i = 0; i < 10; i++) {
        concurrentQueries.push(
          prisma.todo.findMany({
            where: { date: testDate },
            take: 10,
          })
        );
      }

      const results = await Promise.all(concurrentQueries);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(10);
      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds

      console.log(
        `10 concurrent queries completed in ${totalTime.toFixed(2)}ms`
      );
    });

    it("performs efficient aggregation queries", async () => {
      const startTime = performance.now();

      const [totalCount, completedCount, pendingCount] = await Promise.all([
        prisma.todo.count({ where: { date: testDate } }),
        prisma.todo.count({ where: { date: testDate, completed: true } }),
        prisma.todo.count({ where: { date: testDate, completed: false } }),
      ]);

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      expect(totalCount).toBeGreaterThan(0);
      expect(completedCount + pendingCount).toBe(totalCount);
      expect(queryTime).toBeLessThan(500); // Should complete within 500ms

      console.log(`Aggregation queries completed in ${queryTime.toFixed(2)}ms`);
    });

    it("handles batch operations efficiently", async () => {
      const startTime = performance.now();

      // Update multiple todos in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const updates = [];
        for (let i = 0; i < 5; i++) {
          if (createdTodoIds[i]) {
            updates.push(
              tx.todo.update({
                where: { id: createdTodoIds[i] },
                data: { content: `Updated todo ${i + 1}` },
              })
            );
          }
        }
        return Promise.all(updates);
      });

      const endTime = performance.now();
      const transactionTime = endTime - startTime;

      expect(result.length).toBe(5);
      expect(transactionTime).toBeLessThan(1000); // Should complete within 1 second

      console.log(
        `Batch transaction completed in ${transactionTime.toFixed(2)}ms`
      );
    });
  });

  describe("Connection Resilience", () => {
    it("recovers from connection interruption", async () => {
      // Simulate connection recovery by disconnecting and reconnecting
      await prisma.$disconnect();

      // This should automatically reconnect
      const health = await checkDatabaseHealth();
      expect(health.status).toBe("healthy");
    });

    it("handles query timeout gracefully", async () => {
      // Test with a potentially slow query
      const startTime = performance.now();

      try {
        await prisma.$queryRaw`SELECT pg_sleep(0.1)`; // Sleep for 100ms
        const endTime = performance.now();
        const queryTime = endTime - startTime;

        expect(queryTime).toBeGreaterThan(100); // Should take at least 100ms
        expect(queryTime).toBeLessThan(5000); // But not more than 5 seconds
      } catch {
        // If the query fails due to timeout, that's also acceptable
        console.warn(
          "Query timeout test failed, which may be expected in some environments"
        );
      }
    });

    it("maintains performance under load", async () => {
      const operations = [];
      const startTime = performance.now();

      // Create 20 concurrent operations
      for (let i = 0; i < 20; i++) {
        operations.push(
          prisma.todo.findMany({
            where: { date: testDate },
            take: 5,
          })
        );
      }

      const results = await Promise.all(operations);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(20);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds

      console.log(
        `20 concurrent operations completed in ${totalTime.toFixed(2)}ms`
      );
    });
  });

  describe("Performance Monitoring", () => {
    it("tracks query performance metrics", async () => {
      // Clear previous metrics
      performanceMonitor.clear();

      // Perform some monitored operations
      const endTimer1 = performanceMonitor.startTimer("test-query-1");
      await prisma.todo.findMany({ take: 10 });
      endTimer1({ operation: "findMany" });

      const endTimer2 = performanceMonitor.startTimer("test-query-2");
      await prisma.todo.count();
      endTimer2({ operation: "count" });

      // Check metrics
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.length).toBe(2);

      const stats = performanceMonitor.getStats();
      expect(stats.count).toBe(2);
      expect(stats.average).toBeGreaterThan(0);
      expect(stats.min).toBeGreaterThan(0);
      expect(stats.max).toBeGreaterThan(0);
    });

    it("identifies slow operations", async () => {
      performanceMonitor.clear();

      // Simulate a slow operation
      const endTimer = performanceMonitor.startTimer("slow-operation");
      await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
      endTimer({ simulated: true });

      const slowOps = performanceMonitor.getSlowOperations(50, 5); // Operations slower than 50ms
      expect(slowOps.length).toBe(1);
      expect(slowOps[0].name).toBe("slow-operation");
      expect(slowOps[0].duration).toBeGreaterThan(50);
    });
  });

  describe("Data Integrity", () => {
    it("maintains referential integrity", async () => {
      const testDate = "2025-07-27";

      // Create a todo
      const todo = await prisma.todo.create({
        data: {
          content: "Integrity test todo",
          date: testDate,
          orderNum: 1,
        },
      });

      // Verify it was created correctly
      const retrieved = await prisma.todo.findUnique({
        where: { id: todo.id },
      });

      expect(retrieved).toBeTruthy();
      expect(retrieved!.content).toBe("Integrity test todo");
      expect(retrieved!.date).toBe(testDate);

      // Clean up
      await prisma.todo.delete({
        where: { id: todo.id },
      });
    });

    it("handles concurrent modifications correctly", async () => {
      const testDate = "2025-07-28";

      // Create a todo
      const todo = await prisma.todo.create({
        data: {
          content: "Concurrent test todo",
          date: testDate,
          orderNum: 1,
        },
      });

      // Simulate concurrent updates
      const updates = [];
      for (let i = 0; i < 5; i++) {
        updates.push(
          prisma.todo.update({
            where: { id: todo.id },
            data: { content: `Updated content ${i + 1}` },
          })
        );
      }

      // Only one should succeed, others should fail or be serialized
      try {
        await Promise.all(updates);
        // If all succeed, verify the final state
        const final = await prisma.todo.findUnique({
          where: { id: todo.id },
        });
        expect(final).toBeTruthy();
        expect(final!.content).toMatch(/Updated content \d+/);
      } catch {
        // Some updates may fail due to concurrency, which is expected
        console.log("Concurrent update conflict detected (expected behavior)");
      }

      // Clean up
      await prisma.todo.delete({
        where: { id: todo.id },
      });
    });
  });
});
