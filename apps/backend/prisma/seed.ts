import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const password = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice@test.com' },
      update: {},
      create: {
        email: 'alice@test.com',
        name: 'Alice Johnson',
        emailVerified: true,
        profile: {
          create: {
            handle: 'alice',
            displayName: 'Alice',
            bio: 'Coffee enthusiast and dog lover. Always up for a good conversation!',
            age: 28,
            gender: 'female',
            interests: JSON.stringify(['coffee', 'dogs', 'hiking', 'photography', 'travel']),
            lookingFor: 'friends',
            chatReadiness: 'open_to_chat',
            activityIntent: 'coffee_chat',
            trustScore: 75,
            trustLevel: 'trusted',
            currentLocationLat: 37.7749,
            currentLocationLng: -122.4194,
            lastActiveAt: new Date(),
          },
        },
        accounts: {
          create: {
            providerId: 'credential',
            accountId: 'alice@test.com',
            password,
          },
        },
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob@test.com' },
      update: {},
      create: {
        email: 'bob@test.com',
        name: 'Bob Smith',
        emailVerified: true,
        profile: {
          create: {
            handle: 'bob',
            displayName: 'Bob',
            bio: 'Software engineer by day, guitarist by night. Love exploring new places.',
            age: 32,
            gender: 'male',
            interests: JSON.stringify(['coding', 'music', 'guitar', 'hiking', 'coffee']),
            lookingFor: 'networking',
            chatReadiness: 'open_to_meet',
            activityIntent: 'walk_and_talk',
            trustScore: 85,
            trustLevel: 'verified',
            currentLocationLat: 37.7849,
            currentLocationLng: -122.4094,
            lastActiveAt: new Date(),
          },
        },
        accounts: {
          create: {
            providerId: 'credential',
            accountId: 'bob@test.com',
            password,
          },
        },
      },
    }),
    prisma.user.upsert({
      where: { email: 'carol@test.com' },
      update: {},
      create: {
        email: 'carol@test.com',
        name: 'Carol Williams',
        emailVerified: true,
        profile: {
          create: {
            handle: 'carol',
            displayName: 'Carol',
            bio: 'Yoga instructor and foodie. Always looking for the best brunch spots!',
            age: 26,
            gender: 'female',
            interests: JSON.stringify(['yoga', 'food', 'brunch', 'wellness', 'travel']),
            lookingFor: 'activities',
            chatReadiness: 'open_to_chat',
            activityIntent: 'food',
            trustScore: 65,
            trustLevel: 'trusted',
            currentLocationLat: 37.7649,
            currentLocationLng: -122.4294,
            lastActiveAt: new Date(),
          },
        },
        accounts: {
          create: {
            providerId: 'credential',
            accountId: 'carol@test.com',
            password,
          },
        },
      },
    }),
    prisma.user.upsert({
      where: { email: 'david@test.com' },
      update: {},
      create: {
        email: 'david@test.com',
        name: 'David Chen',
        emailVerified: true,
        profile: {
          create: {
            handle: 'david',
            displayName: 'David',
            bio: 'Startup founder. Love meeting new people and exchanging ideas.',
            age: 35,
            gender: 'male',
            interests: JSON.stringify(['startups', 'tech', 'networking', 'coffee', 'running']),
            lookingFor: 'networking',
            chatReadiness: 'open_to_meet',
            activityIntent: 'brainstorm',
            trustScore: 90,
            trustLevel: 'vip',
            currentLocationLat: 37.7899,
            currentLocationLng: -122.4000,
            lastActiveAt: new Date(),
            subscriptionStatus: 'active',
          },
        },
        accounts: {
          create: {
            providerId: 'credential',
            accountId: 'david@test.com',
            password,
          },
        },
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create some pins
  const pins = await Promise.all([
    prisma.pin.create({
      data: {
        userId: users[0].id,
        latitude: 37.7749,
        longitude: -122.4194,
        description: 'Great coffee spot! The barista makes amazing latte art. ☕',
        likesCount: 12,
      },
    }),
    prisma.pin.create({
      data: {
        userId: users[1].id,
        latitude: 37.7849,
        longitude: -122.4094,
        description: 'Found this hidden park with the best city views. Perfect for a morning run! 🏃',
        likesCount: 8,
      },
    }),
    prisma.pin.create({
      data: {
        userId: users[2].id,
        latitude: 37.7649,
        longitude: -122.4294,
        description: 'Amazing brunch here! The avocado toast is to die for. 🥑',
        likesCount: 25,
      },
    }),
  ]);

  console.log(`✅ Created ${pins.length} pins`);

  // Create an event
  const event = await prisma.event.create({
    data: {
      hostId: users[3].id,
      title: 'Tech Networking Happy Hour',
      description: 'Casual meetup for people in tech. Come share ideas and make connections!',
      category: 'networking',
      venueName: 'The Startup Bar',
      venueAddress: '123 Innovation St, San Francisco, CA',
      latitude: 37.7800,
      longitude: -122.4100,
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // +3 hours
      maxAttendees: 30,
    },
  });

  console.log(`✅ Created event: ${event.title}`);

  // Create a mingle
  const mingle = await prisma.mingleEvent.create({
    data: {
      hostId: users[0].id,
      title: 'Coffee & Chat',
      description: 'Looking for someone to grab coffee with and have a nice conversation.',
      intentCard: 'coffee_chat',
      latitude: 37.7749,
      longitude: -122.4194,
      locationName: 'Blue Bottle Coffee',
      radius: 500,
      startTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      duration: 60,
      status: 'scheduled',
      maxParticipants: 3,
    },
  });

  console.log(`✅ Created mingle: ${mingle.title}`);

  // Create forum posts
  const posts = await Promise.all([
    prisma.forumPost.create({
      data: {
        authorId: users[0].id,
        title: 'Best coffee shops in SF?',
        content: 'Hey everyone! I\'m looking for recommendations for the best coffee shops in San Francisco. I prefer places with good wifi for working. Any suggestions?',
        category: 'places',
        likesCount: 5,
      },
    }),
    prisma.forumPost.create({
      data: {
        authorId: users[1].id,
        title: 'Anyone interested in a weekly hiking group?',
        content: 'Thinking of starting a weekly hiking group that meets Saturday mornings. Would anyone be interested? Planning easy to moderate trails around the Bay Area.',
        category: 'meetups',
        likesCount: 12,
      },
    }),
    prisma.forumPost.create({
      data: {
        authorId: users[3].id,
        title: 'Tips for meeting new people in a new city',
        content: 'Just moved here and want to share some tips that have helped me meet people: 1) Use apps like this one! 2) Say yes to everything at first 3) Join local clubs or groups 4) Be a regular somewhere. What are your tips?',
        category: 'tips',
        isPinned: true,
        likesCount: 45,
      },
    }),
  ]);

  console.log(`✅ Created ${posts.length} forum posts`);

  // Create some waves
  await prisma.wave.create({
    data: {
      fromUserId: users[1].id,
      toUserId: users[0].id,
      status: 'sent',
    },
  });

  await prisma.wave.create({
    data: {
      fromUserId: users[2].id,
      toUserId: users[0].id,
      status: 'waved_back',
    },
  });

  console.log(`✅ Created waves`);

  // Create streaks for users
  for (const user of users) {
    await prisma.userStreak.createMany({
      data: [
        { userId: user.id, streakType: 'login', currentStreak: Math.floor(Math.random() * 10), longestStreak: 15 },
        { userId: user.id, streakType: 'social', currentStreak: Math.floor(Math.random() * 5), longestStreak: 8 },
        { userId: user.id, streakType: 'explorer', currentStreak: Math.floor(Math.random() * 3), longestStreak: 5 },
      ],
      skipDuplicates: true,
    });
  }

  console.log(`✅ Created streaks`);

  // Create a hotspot
  await prisma.hotspot.create({
    data: {
      geohash: '9q8yy',
      centerLat: 37.7749,
      centerLng: -122.4194,
      activeUsers: 15,
      totalActivity: 50,
      trendScore: 85,
      peakHour: 18,
    },
  });

  console.log(`✅ Created hotspot`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📝 Test accounts:');
  console.log('   Email: alice@test.com | Password: password123');
  console.log('   Email: bob@test.com | Password: password123');
  console.log('   Email: carol@test.com | Password: password123');
  console.log('   Email: david@test.com | Password: password123 (Premium)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
