/*
  Warnings:

  - You are about to drop the column `raw_response` on the `payments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `payments` DROP COLUMN `raw_response`,
    ADD COLUMN `intent_response` JSON NULL;
