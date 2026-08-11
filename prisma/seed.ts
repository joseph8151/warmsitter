import { PrismaClient } from "@prisma/client";
import { DEFAULT_ACTION_COSTS, DEFAULT_CREDIT_PACKAGES } from "../src/lib/settings";

const prisma = new PrismaClient();

async function main() {
  // Platform settings singleton.
  await prisma.platformSetting.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      feeRateBps: 1000, // 10%
      ticketPrice: 29000,
      ticketDurationDays: 30,
      premiumMonthlyPrice: 9900,
      creditPackages: DEFAULT_CREDIT_PACKAGES as unknown as object,
      actionCosts: DEFAULT_ACTION_COSTS as unknown as object,
    },
    update: {},
  });

  // Admin.
  await prisma.user.upsert({
    where: { email: "admin@warmsitter.test" },
    create: { email: "admin@warmsitter.test", name: "Admin", role: "ADMIN", creditBalance: 0 },
    update: {},
  });

  // Parents.
  const parent1 = await prisma.user.upsert({
    where: { email: "parent@warmsitter.test" },
    create: {
      email: "parent@warmsitter.test",
      name: "지현 (부모)",
      role: "PARENT",
      creditBalance: 3, // a few credits to try the flow
      parentProfile: { create: { children: 2, address: "Seoul" } },
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { email: "premium-parent@warmsitter.test" },
    create: {
      email: "premium-parent@warmsitter.test",
      name: "민수 (프리미엄 부모)",
      role: "PARENT",
      creditBalance: 0,
      isPremium: true,
      parentProfile: { create: { children: 1, address: "Busan" } },
      subscription: {
        create: {
          plan: "PREMIUM_MONTHLY",
          status: "ACTIVE",
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
    update: {},
  });

  // Sitters.
  const sitters = [
    { email: "emma@warmsitter.test", name: "Emma R.", rate: 18000, exp: 5, city: "Seoul", bio: "CPR certified, loves crafts and story time.", verified: true, rating: 4.9, count: 42 },
    { email: "sofia@warmsitter.test", name: "Sofia L.", rate: 15000, exp: 3, city: "Seoul", bio: "Toddler specialist, bilingual (EN/KR).", verified: true, rating: 4.8, count: 28 },
    { email: "grace@warmsitter.test", name: "Grace K.", rate: 20000, exp: 7, city: "Busan", bio: "Newborn & infant care, night nanny experience.", verified: true, rating: 5.0, count: 61 },
    { email: "mia@warmsitter.test", name: "Mia T.", rate: 16000, exp: 2, city: "Incheon", bio: "After-school pickups and homework help.", verified: false, rating: 4.6, count: 12 },
  ];
  const sitterUsers = [];
  for (const s of sitters) {
    const u = await prisma.user.upsert({
      where: { email: s.email },
      create: {
        email: s.email,
        name: s.name,
        role: "SITTER",
        sitterProfile: {
          create: {
            hourlyRate: s.rate,
            yearsOfExp: s.exp,
            city: s.city,
            bio: s.bio,
            verified: s.verified,
            ratingAvg: s.rating,
            ratingCount: s.count,
          },
        },
      },
      update: {},
    });
    sitterUsers.push(u);
  }

  // A sample job by parent1, matched with Emma, ready to demonstrate payment.
  const emma = sitterUsers[0];
  await prisma.jobPost.upsert({
    where: { id: "seed-job-1" },
    create: {
      id: "seed-job-1",
      parentId: parent1.id,
      title: "화요일 오후 돌봄 (2명)",
      description: "하교 후 픽업 + 저녁 돌봄",
      city: "Seoul",
      hoursPerSession: 3,
      status: "MATCHED",
      matchedSitterId: emma.id,
      agreedRate: 18000,
      agreedHours: 3,
    },
    update: {},
  });

  // An OPEN job with a pending application from Sofia (to demo the apply/accept flow).
  const sofia = sitterUsers[1];
  await prisma.jobPost.upsert({
    where: { id: "seed-job-2" },
    create: {
      id: "seed-job-2",
      parentId: parent1.id,
      title: "주말 오전 돌봄 (신생아)",
      description: "토요일 오전 9시~12시, 신생아 돌봄 경험자 우대",
      city: "Seoul",
      hoursPerSession: 3,
      status: "OPEN",
    },
    update: {},
  });
  await prisma.application.upsert({
    where: { jobId_sitterId: { jobId: "seed-job-2", sitterId: sofia.id } },
    create: {
      jobId: "seed-job-2",
      sitterId: sofia.id,
      message: "신생아 돌봄 3년 경력입니다. 잘 부탁드려요!",
      status: "PENDING",
    },
    update: {},
  });

  // A demo chat room between parent1 and Emma with a couple of messages.
  const room = await prisma.chatRoom.upsert({
    where: { parentId_sitterId_jobId: { parentId: parent1.id, sitterId: emma.id, jobId: "seed-job-1" } },
    create: { id: "seed-room-1", parentId: parent1.id, sitterId: emma.id, jobId: "seed-job-1" },
    update: {},
  });
  const existingMsgs = await prisma.message.count({ where: { roomId: room.id } });
  if (existingMsgs === 0) {
    await prisma.message.createMany({
      data: [
        { roomId: room.id, senderId: parent1.id, body: "안녕하세요! 화요일 오후 돌봄 가능하실까요?" },
        { roomId: room.id, senderId: emma.id, body: "네, 가능합니다 😊 시급은 18,000원이에요." },
        { roomId: room.id, senderId: parent1.id, body: "좋아요, 3시간으로 진행할게요!" },
      ],
    });
  }

  // Emma's weekly availability (weekday afternoons/evenings + Sat morning).
  const emmaSlots = [
    { dayOfWeek: 2, slot: "AFTERNOON" as const },
    { dayOfWeek: 2, slot: "EVENING" as const },
    { dayOfWeek: 4, slot: "AFTERNOON" as const },
    { dayOfWeek: 6, slot: "MORNING" as const },
  ];
  for (const s of emmaSlots) {
    await prisma.availabilitySlot.upsert({
      where: { sitterId_dayOfWeek_slot: { sitterId: emma.id, dayOfWeek: s.dayOfWeek, slot: s.slot } },
      create: { sitterId: emma.id, dayOfWeek: s.dayOfWeek, slot: s.slot },
      update: {},
    });
  }

  // parent1 saved Emma.
  await prisma.favorite.upsert({
    where: { parentId_sitterId: { parentId: parent1.id, sitterId: emma.id } },
    create: { parentId: parent1.id, sitterId: emma.id },
    update: {},
  });

  // A demo booking proposed by Emma for the Tuesday job (awaiting parent confirm).
  const existingBooking = await prisma.booking.findFirst({ where: { jobId: "seed-job-1" } });
  if (!existingBooking) {
    await prisma.booking.create({
      data: {
        jobId: "seed-job-1",
        parentId: parent1.id,
        sitterId: emma.id,
        proposedById: emma.id,
        scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        hours: 3,
        hourlyRate: 18000,
        note: "화요일 오후 3시부터 3시간 어떠세요?",
        status: "PROPOSED",
      },
    });
  }

  // A couple of demo notifications for the bell.
  const noteCount = await prisma.notification.count({ where: { userId: parent1.id } });
  if (noteCount === 0) {
    await prisma.notification.createMany({
      data: [
        {
          userId: parent1.id,
          type: "SYSTEM",
          title: "warm sitter에 오신 것을 환영해요 ☀️",
          body: "무료로 시터를 검색하고, 마음에 들면 연결해보세요.",
          link: "/sitters",
        },
        {
          userId: parent1.id,
          type: "APPLICATION_RECEIVED",
          title: "새 지원자가 있어요",
          body: 'Sofia L.님이 "주말 오전 돌봄 (신생아)"에 지원했습니다.',
          link: "/jobs/seed-job-2",
        },
      ],
    });
  }

  console.log("Seed complete.");
  console.log("Demo users:");
  console.log("  admin@warmsitter.test (ADMIN)");
  console.log("  parent@warmsitter.test (PARENT, 3 credits)");
  console.log("  premium-parent@warmsitter.test (PARENT, premium)");
  console.log("  emma/sofia/grace/mia@warmsitter.test (SITTERS)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
