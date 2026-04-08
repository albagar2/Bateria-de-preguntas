-- AlterTable
ALTER TABLE "topics" ADD COLUMN     "creator_id" TEXT,
ADD COLUMN     "opposition_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "opposition_id" TEXT;

-- CreateTable
CREATE TABLE "oppositions" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oppositions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "topics_opposition_id_idx" ON "topics"("opposition_id");

-- CreateIndex
CREATE INDEX "topics_creator_id_idx" ON "topics"("creator_id");

-- CreateIndex
CREATE INDEX "users_opposition_id_idx" ON "users"("opposition_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_opposition_id_fkey" FOREIGN KEY ("opposition_id") REFERENCES "oppositions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_opposition_id_fkey" FOREIGN KEY ("opposition_id") REFERENCES "oppositions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
