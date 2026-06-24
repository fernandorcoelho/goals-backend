-- Remove o modelo de categorias: as tarefas passam a ser cadastradas
-- diretamente em cada dia da rotina.

-- DropForeignKey
ALTER TABLE "_RoutineDayCategories" DROP CONSTRAINT "_RoutineDayCategories_A_fkey";
ALTER TABLE "_RoutineDayCategories" DROP CONSTRAINT "_RoutineDayCategories_B_fkey";
ALTER TABLE "category_tasks" DROP CONSTRAINT "category_tasks_categoryId_fkey";
ALTER TABLE "categories" DROP CONSTRAINT "categories_userId_fkey";

-- DropTable
DROP TABLE "_RoutineDayCategories";
DROP TABLE "category_tasks";
DROP TABLE "categories";

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "routineDayId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasks_routineDayId_idx" ON "tasks"("routineDayId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_routineDayId_fkey" FOREIGN KEY ("routineDayId") REFERENCES "routine_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;
