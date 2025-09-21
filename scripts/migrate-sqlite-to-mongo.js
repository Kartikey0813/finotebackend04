// scripts/migrate-sqlite-to-mongo.js
// Run examples:
//   node scripts/migrate-sqlite-to-mongo.js --dry-run   # simulate only
//   node scripts/migrate-sqlite-to-mongo.js --drop      # drop Mongo collections before insert
//
// Reads from Prisma SQLite DB -> writes to Mongo Atlas via Mongoose.

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const mongoose = require('mongoose');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse CLI flags
const argv = yargs(hideBin(process.argv))
  .option('dry-run', { type: 'boolean' })
  .option('drop', { type: 'boolean' })
  .argv;

const dryRun = !!argv['dry-run'];
const dropFirst = !!argv.drop;

console.log('Migration config:', { dryRun, dropFirst });

// Ensure we have URI
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not set in .env');
  process.exit(1);
}

// Prisma (SQLite) client
const prisma = new PrismaClient();

// ✅ Import Mongoose models
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const FraudAlert = require('../models/FraudAlert');

// Connect to Mongo
async function connectMongo() {
  console.log('⏳ Connecting to MongoDB...');
  const conn = await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB cluster:', conn.connection.host, 'DB:', conn.connection.db.databaseName);
}

async function closeAll() {
  try { await prisma.$disconnect(); } catch (e) {}
  try { await mongoose.disconnect(); } catch (e) {}
}

// Convert Prisma DateTime to JS Date
function toDate(d) {
  if (!d) return null;
  return new Date(d);
}

// ----------------- MIGRATION FUNCTIONS -----------------

async function migrateUsers() {
  console.log('📥 Reading users from SQLite...');
  const users = await prisma.user.findMany();
  console.log('Found users:', users.length);
  if (users.length === 0) return 0;

  if (dropFirst) {
    if (!dryRun) {
      console.log('🗑 Dropping existing users collection...');
      await User.deleteMany({});
    } else {
      console.log('[dry-run] would drop users collection');
    }
  }

  const docs = users.map(u => ({
    _id: u.id,
    name: u.name,
    email: u.email,
    password: u.password,
    role: u.role,
    walletAddress: u.walletAddress,
    createdAt: toDate(u.createdAt)
  }));

  if (dryRun) {
    console.log(`[dry-run] would insert ${docs.length} users`);
    return docs.length;
  }

  try {
    const res = await User.insertMany(docs, { ordered: false });
    console.log(`✅ Inserted ${res.length} users`);
    return res.length;
  } catch (err) {
    console.warn('⚠️ User insert warning:', err.message);
    const count = await User.countDocuments();
    console.log('Users now in Mongo:', count);
    return count;
  }
}

async function migrateInvoices() {
  console.log('📥 Reading invoices from SQLite...');
  const invoices = await prisma.invoice.findMany();
  console.log('Found invoices:', invoices.length);
  if (invoices.length === 0) return 0;

  if (dropFirst) {
    if (!dryRun) {
      console.log('🗑 Dropping existing invoices collection...');
      await Invoice.deleteMany({});
    } else {
      console.log('[dry-run] would drop invoices collection');
    }
  }

  const docs = invoices.map(i => ({
    _id: i.id,
    userId: i.userId,
    clientName: i.clientName,
    clientEmail: i.clientEmail,
    invoiceNumber: i.invoiceNumber,
    items: i.items || [],
    totalAmount: i.totalAmount,
    dueDate: toDate(i.dueDate),
    status: i.status,
    invoiceHash: i.invoiceHash,
    blockchainTx: i.blockchainTx,
    createdAt: toDate(i.createdAt)
  }));

  if (dryRun) {
    console.log(`[dry-run] would insert ${docs.length} invoices`);
    return docs.length;
  }

  try {
    const res = await Invoice.insertMany(docs, { ordered: false });
    console.log(`✅ Inserted ${res.length} invoices`);
    return res.length;
  } catch (err) {
    console.warn('⚠️ Invoice insert warning:', err.message);
    const count = await Invoice.countDocuments();
    console.log('Invoices now in Mongo:', count);
    return count;
  }
}

async function migrateFraudAlerts() {
  console.log('📥 Reading fraud alerts from SQLite...');
  const alerts = await prisma.fraudAlert.findMany();
  console.log('Found fraud alerts:', alerts.length);
  if (alerts.length === 0) return 0;

  if (dropFirst) {
    if (!dryRun) {
      console.log('🗑 Dropping existing fraudalerts collection...');
      await FraudAlert.deleteMany({});
    } else {
      console.log('[dry-run] would drop fraudalerts collection');
    }
  }

  const docs = alerts.map(a => ({
    _id: a.id,
    invoiceId: a.invoiceId,
    severity: a.severity,
    reason: a.reason,
    resolved: a.resolved,
    createdAt: toDate(a.createdAt)
  }));

  if (dryRun) {
    console.log(`[dry-run] would insert ${docs.length} fraud alerts`);
    return docs.length;
  }

  try {
    const res = await FraudAlert.insertMany(docs, { ordered: false });
    console.log(`✅ Inserted ${res.length} fraud alerts`);
    return res.length;
  } catch (err) {
    console.warn('⚠️ FraudAlert insert warning:', err.message);
    const count = await FraudAlert.countDocuments();
    console.log('Fraud alerts now in Mongo:', count);
    return count;
  }
}

// ----------------- MAIN -----------------

async function main() {
  try {
    await connectMongo();

    const userCount = await migrateUsers();
    const invoiceCount = await migrateInvoices();
    const alertCount = await migrateFraudAlerts();

    console.log('🎉 Migration summary:', { userCount, invoiceCount, alertCount });
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await closeAll();
    console.log('✅ Migration script finished.');
  }
}

main();
