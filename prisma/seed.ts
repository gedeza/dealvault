import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@dealvault.co.za" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@dealvault.co.za",
      phone: "+27 80 000 0000",
      passwordHash,
      emailVerified: true,
      role: "admin",
    },
  });

  // Create regular users
  const seller = await prisma.user.upsert({
    where: { email: "seller@example.com" },
    update: {},
    create: {
      name: "James van der Merwe",
      email: "seller@example.com",
      phone: "+27 82 555 0001",
      passwordHash,
      emailVerified: true,
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@example.com" },
    update: {},
    create: {
      name: "Sarah Ndlovu",
      email: "buyer@example.com",
      phone: "+27 83 555 0002",
      passwordHash,
      emailVerified: true,
    },
  });

  const intermediary = await prisma.user.upsert({
    where: { email: "broker@example.com" },
    update: {},
    create: {
      name: "Ahmed Patel",
      email: "broker@example.com",
      phone: "+27 84 555 0003",
      passwordHash,
      emailVerified: true,
    },
  });

  const buyerMandate = await prisma.user.upsert({
    where: { email: "mandate@example.com" },
    update: {},
    create: {
      name: "Lindiwe Dlamini",
      email: "mandate@example.com",
      phone: "+27 85 555 0004",
      passwordHash,
      emailVerified: true,
    },
  });

  // Create companies
  const sellerCompany = await prisma.company.upsert({
    where: { id: "seed-company-seller" },
    update: {},
    create: {
      id: "seed-company-seller",
      name: "Van der Merwe Mining (Pty) Ltd",
      registrationNumber: "2020/123456/07",
      taxNumber: "9876543210",
      country: "South Africa",
      verified: true,
      verifiedAt: new Date(),
      userId: seller.id,
    },
  });

  await prisma.company.upsert({
    where: { id: "seed-company-buyer" },
    update: {},
    create: {
      id: "seed-company-buyer",
      name: "Ndlovu Gold Traders International",
      registrationNumber: "2019/654321/07",
      taxNumber: "1234567890",
      country: "South Africa",
      verified: true,
      verifiedAt: new Date(),
      userId: buyer.id,
    },
  });

  // Deal 1: Gold — active deal with full chain
  const deal1 = await prisma.deal.upsert({
    where: { dealNumber: "DV-2026-0001" },
    update: {},
    create: {
      dealNumber: "DV-2026-0001",
      title: "Gold Bullion Purchase - 25kg AU 999.9",
      commodity: "gold",
      quantity: 25,
      unit: "kg",
      value: 1750000,
      currency: "USD",
      commissionPool: 0.02,
      status: "documents_pending",
      creatorId: seller.id,
    },
  });

  // Deal 2: Diamonds — draft stage
  const deal2 = await prisma.deal.upsert({
    where: { dealNumber: "DV-2026-0002" },
    update: {},
    create: {
      dealNumber: "DV-2026-0002",
      title: "Rough Diamonds - 500 carats",
      commodity: "diamonds",
      quantity: 500,
      unit: "carats",
      value: 2500000,
      currency: "USD",
      commissionPool: 0.03,
      status: "draft",
      creatorId: buyer.id,
    },
  });

  // Deal 3: Platinum — further along
  const deal3 = await prisma.deal.upsert({
    where: { dealNumber: "DV-2026-0003" },
    update: {},
    create: {
      dealNumber: "DV-2026-0003",
      title: "Platinum Sponge Export - 100kg",
      commodity: "platinum",
      quantity: 100,
      unit: "kg",
      value: 3200000,
      currency: "USD",
      commissionPool: 0.025,
      status: "under_review",
      creatorId: seller.id,
    },
  });

  // Add parties to Deal 1
  await prisma.dealParty.upsert({
    where: { dealId_userId: { dealId: deal1.id, userId: seller.id } },
    update: {},
    create: {
      dealId: deal1.id,
      userId: seller.id,
      role: "seller",
      side: "sell",
      positionInChain: 0,
      commissionPct: 0,
      status: "accepted",
      acceptedAt: new Date(),
      companyId: sellerCompany.id,
    },
  });

  await prisma.dealParty.upsert({
    where: { dealId_userId: { dealId: deal1.id, userId: buyer.id } },
    update: {},
    create: {
      dealId: deal1.id,
      userId: buyer.id,
      role: "buyer",
      side: "buy",
      positionInChain: 0,
      commissionPct: 0,
      status: "accepted",
      acceptedAt: new Date(),
    },
  });

  await prisma.dealParty.upsert({
    where: { dealId_userId: { dealId: deal1.id, userId: intermediary.id } },
    update: {},
    create: {
      dealId: deal1.id,
      userId: intermediary.id,
      role: "seller_intermediary",
      side: "sell",
      positionInChain: 1,
      commissionPct: 0.005,
      status: "accepted",
      acceptedAt: new Date(),
    },
  });

  await prisma.dealParty.upsert({
    where: { dealId_userId: { dealId: deal1.id, userId: buyerMandate.id } },
    update: {},
    create: {
      dealId: deal1.id,
      userId: buyerMandate.id,
      role: "buyer_mandate",
      side: "buy",
      positionInChain: 1,
      commissionPct: 0.003,
      status: "invited",
    },
  });

  // Add parties to Deal 2
  await prisma.dealParty.upsert({
    where: { dealId_userId: { dealId: deal2.id, userId: buyer.id } },
    update: {},
    create: {
      dealId: deal2.id,
      userId: buyer.id,
      role: "seller",
      side: "sell",
      positionInChain: 0,
      status: "accepted",
      acceptedAt: new Date(),
    },
  });

  // Add parties to Deal 3
  await prisma.dealParty.upsert({
    where: { dealId_userId: { dealId: deal3.id, userId: seller.id } },
    update: {},
    create: {
      dealId: deal3.id,
      userId: seller.id,
      role: "seller",
      side: "sell",
      positionInChain: 0,
      status: "accepted",
      acceptedAt: new Date(),
    },
  });

  await prisma.dealParty.upsert({
    where: { dealId_userId: { dealId: deal3.id, userId: intermediary.id } },
    update: {},
    create: {
      dealId: deal3.id,
      userId: intermediary.id,
      role: "seller_intermediary",
      side: "sell",
      positionInChain: 1,
      commissionPct: 0.005,
      status: "accepted",
      acceptedAt: new Date(),
    },
  });

  // Commission ledger for Deal 1
  await prisma.commissionLedger.upsert({
    where: { id: "seed-commission-1" },
    update: {},
    create: {
      id: "seed-commission-1",
      dealId: deal1.id,
      partyId: (await prisma.dealParty.findUnique({ where: { dealId_userId: { dealId: deal1.id, userId: intermediary.id } } }))!.id,
      agreedPct: 0.005,
      calculatedAmount: 1750000 * 0.005,
    },
  });

  // Timeline events for Deal 1
  await prisma.dealTimeline.createMany({
    data: [
      {
        dealId: deal1.id,
        userId: seller.id,
        eventType: "deal_created",
        description: 'Deal room "Gold Bullion Purchase - 25kg AU 999.9" (DV-2026-0001) created',
        metadata: JSON.stringify({ commodity: "gold", value: 1750000, currency: "USD" }),
      },
      {
        dealId: deal1.id,
        userId: seller.id,
        eventType: "party_invited",
        description: "Sarah Ndlovu invited as buyer",
        metadata: JSON.stringify({ role: "buyer", email: "buyer@example.com" }),
      },
      {
        dealId: deal1.id,
        userId: buyer.id,
        eventType: "party_accepted",
        description: "Sarah Ndlovu accepted invitation as buyer",
      },
      {
        dealId: deal1.id,
        userId: seller.id,
        eventType: "party_invited",
        description: "Ahmed Patel invited as seller's intermediary",
        metadata: JSON.stringify({ role: "seller_intermediary", email: "broker@example.com" }),
      },
      {
        dealId: deal1.id,
        userId: seller.id,
        eventType: "status_changed",
        description: 'Deal status changed from "draft" to "documents_pending"',
        metadata: JSON.stringify({ from: "draft", to: "documents_pending" }),
      },
      {
        dealId: deal1.id,
        userId: seller.id,
        eventType: "commission_agreed",
        description: "Commission for Ahmed Patel set to 0.50% (USD 8,750)",
        metadata: JSON.stringify({ agreedPct: 0.005, calculatedAmount: 8750 }),
      },
    ],
  });

  // Timeline for Deal 3
  await prisma.dealTimeline.createMany({
    data: [
      {
        dealId: deal3.id,
        userId: seller.id,
        eventType: "deal_created",
        description: 'Deal room "Platinum Sponge Export - 100kg" (DV-2026-0003) created',
        metadata: JSON.stringify({ commodity: "platinum", value: 3200000, currency: "USD" }),
      },
      {
        dealId: deal3.id,
        userId: seller.id,
        eventType: "status_changed",
        description: 'Deal status changed from "draft" to "documents_pending"',
        metadata: JSON.stringify({ from: "draft", to: "documents_pending" }),
      },
      {
        dealId: deal3.id,
        userId: seller.id,
        eventType: "status_changed",
        description: 'Deal status changed from "documents_pending" to "under_review"',
        metadata: JSON.stringify({ from: "documents_pending", to: "under_review" }),
      },
    ],
  });

  // Messages for Deal 1
  await prisma.message.createMany({
    data: [
      {
        dealId: deal1.id,
        senderId: seller.id,
        content: "Welcome to the deal room. I have the gold ready at the refinery. Let's get the documentation sorted.",
        visibility: "deal",
      },
      {
        dealId: deal1.id,
        senderId: buyer.id,
        content: "Thank you. We'll have the BCL and POF uploaded by end of week.",
        visibility: "deal",
      },
      {
        dealId: deal1.id,
        senderId: intermediary.id,
        content: "I'll prepare the NCNDA and IMFPA documents for all parties.",
        visibility: "deal",
      },
      {
        dealId: deal1.id,
        senderId: seller.id,
        content: "Side note for our team: make sure the refinery certificate is current.",
        visibility: "side",
      },
    ],
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: buyerMandate.id,
        type: "party_invited",
        title: "Deal Invitation",
        message: 'You\'ve been invited to "Gold Bullion Purchase - 25kg AU 999.9" as buyer mandate',
        link: `/deals/${deal1.id}`,
      },
      {
        userId: buyer.id,
        type: "status_changed",
        title: "Deal Status Updated",
        message: '"Gold Bullion Purchase" is now Documents Pending',
        link: `/deals/${deal1.id}`,
      },
    ],
  });

  console.log("\n✓ Seed data created successfully!\n");
  console.log("Demo accounts (password: password123):");
  console.log("  admin@dealvault.co.za  (admin)");
  console.log("  seller@example.com     (seller)");
  console.log("  buyer@example.com      (buyer)");
  console.log("  broker@example.com     (intermediary)");
  console.log("  mandate@example.com    (buyer mandate)");
  console.log("\nDeals:");
  console.log("  DV-2026-0001 — Gold Bullion (documents_pending)");
  console.log("  DV-2026-0002 — Rough Diamonds (draft)");
  console.log("  DV-2026-0003 — Platinum Sponge (under_review)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
