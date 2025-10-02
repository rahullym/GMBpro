import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create a sample business
  const business = await prisma.business.upsert({
    where: { id: 'sample-business' },
    update: {},
    create: {
      id: 'sample-business',
      name: 'Sample Restaurant',
      planTier: 'free',
    },
  });

  console.log('Created business:', business);

  // Create a sample user
  const hashedPassword = await bcrypt.hash('password123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      passwordHash: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      businessId: business.id,
      role: 'owner',
    },
  });

  console.log('Created user:', user);

  // Create a sample location
  const location = await prisma.location.upsert({
    where: { googlePlaceId: 'sample-place-id' },
    update: {},
    create: {
      googlePlaceId: 'sample-place-id',
      businessId: business.id,
      name: 'Sample Restaurant Downtown',
      address: '123 Main St, City, State 12345',
      latitude: 40.7128,
      longitude: -74.0060,
      phoneNumber: '+1 (555) 123-4567',
      website: 'https://samplerestaurant.com',
    },
  });

  console.log('Created location:', location);

  // Create sample reviews
  const reviews = [
    {
      googleReviewId: 'review-1',
      locationId: location.id,
      authorName: 'John Doe',
      authorEmail: 'john@example.com',
      rating: 5,
      text: 'Amazing food and great service! Highly recommend this place.',
      sentiment: 'positive',
      status: 'pending',
    },
    {
      googleReviewId: 'review-2',
      locationId: location.id,
      authorName: 'Jane Smith',
      authorEmail: 'jane@example.com',
      rating: 3,
      text: 'Food was okay but service was slow. Could be better.',
      sentiment: 'neutral',
      status: 'pending',
    },
    {
      googleReviewId: 'review-3',
      locationId: location.id,
      authorName: 'Mike Johnson',
      authorEmail: 'mike@example.com',
      rating: 1,
      text: 'Terrible experience. Food was cold and staff was rude.',
      sentiment: 'negative',
      status: 'pending',
    },
  ];

  for (const reviewData of reviews) {
    const review = await prisma.review.upsert({
      where: { googleReviewId: reviewData.googleReviewId },
      update: {},
      create: {
        ...reviewData,
        createdAt: new Date(),
        ingestedAt: new Date(),
      },
    });
    console.log('Created review:', review);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

