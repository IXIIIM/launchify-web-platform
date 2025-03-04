// prisma/schema/SpotlightSchema.ts

model Spotlight {
  id          String    @id @default(uuid())
  userId      String
  type        String    // BOOST, SUPER_BOOST
  startDate   DateTime
  endDate     DateTime
  status      String    // ACTIVE, EXPIRED, CANCELLED
  metadata    Json?     // For storing boost-specific settings
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [id])
}

// Add to User model
model User {
  // ... existing fields
  spotlights  Spotlight[]
  boostCredits Int @default(0)  // Available boost credits
}