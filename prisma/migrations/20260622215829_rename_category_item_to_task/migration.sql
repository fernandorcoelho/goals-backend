-- Renomeia a tabela de "items" para "tasks", preservando os dados existentes.
ALTER TABLE "category_items" RENAME TO "category_tasks";

-- Mantém os nomes de constraints e índices consistentes com a nova tabela.
ALTER TABLE "category_tasks" RENAME CONSTRAINT "category_items_pkey" TO "category_tasks_pkey";
ALTER TABLE "category_tasks" RENAME CONSTRAINT "category_items_categoryId_fkey" TO "category_tasks_categoryId_fkey";
ALTER INDEX "category_items_categoryId_idx" RENAME TO "category_tasks_categoryId_idx";
