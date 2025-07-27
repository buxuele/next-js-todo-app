import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Get today's date
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Create some sample todos for today
  const todayTodos = [
    "完成项目文档",
    "开会讨论需求",
    "代码审查",
    "更新数据库设计",
    "测试新功能",
  ];

  console.log(`Creating todos for ${today}...`);
  for (let i = 0; i < todayTodos.length; i++) {
    await prisma.todo.create({
      data: {
        content: todayTodos[i],
        date: today,
        orderNum: i + 1,
        completed: i === 1, // Mark second todo as completed
        completedAt: i === 1 ? new Date() : null,
      },
    });
  }

  // Create some sample todos for yesterday (all completed)
  const yesterdayTodos = ["准备会议材料", "回复邮件", "整理代码"];

  console.log(`Creating todos for ${yesterday}...`);
  for (let i = 0; i < yesterdayTodos.length; i++) {
    await prisma.todo.create({
      data: {
        content: yesterdayTodos[i],
        date: yesterday,
        orderNum: i + 1,
        completed: true,
        completedAt: new Date(
          Date.now() - 24 * 60 * 60 * 1000 + i * 60 * 60 * 1000
        ), // Stagger completion times
      },
    });
  }

  // Create a date alias for yesterday
  await prisma.dateAlias.create({
    data: {
      date: yesterday,
      alias: "昨日工作",
    },
  });

  console.log("Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
