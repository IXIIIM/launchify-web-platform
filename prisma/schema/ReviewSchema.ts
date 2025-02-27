// prisma/schema/ReviewSchema.ts

model Review {
  id            String      @id @default(uuid())
  reviewerId    String
  reviewedId    String
  rating        Int         @db.SmallInt
  categories    Json        // Stores ratings for different categories
  content       String?     @db.Text
  status        String      // PENDING, PUBLISHED, FLAGGED, REMOVED
  flags         Flag[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  reviewer      User        @relation("ReviewsGiven", fields: [reviewerId], references: [id])
  reviewed      User        @relation("ReviewsReceived", fields: [reviewedId], references: [id])
}

model Flag {
  id            String      @id @default(uuid())
  reviewId      String
  reporterId    String
  reason        String
  status        String      // PENDING, REVIEWED, DISMISSED
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  review        Review      @relation(fields: [reviewId], references: [id])
  reporter      User        @relation(fields: [reporterId], references: [id])
}

// Add to User model
model User {
  // ... existing fields
  reviewsGiven      Review[]  @relation("ReviewsGiven")
  reviewsReceived   Review[]  @relation("ReviewsReceived")
  flags             Flag[]
}