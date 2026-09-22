-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firtsName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
