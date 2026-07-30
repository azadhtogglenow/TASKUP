import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

dotenv.config();

import { users, documents } from '../src/db/schema';

const BCRYPT_SALT_ROUNDS = 12;

async function seed() {
  const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  const pool = new Pool({
    connectionString: connectionString,
    connectionTimeoutMillis: 5000, 
  });
  const db = drizzle(pool);

  try {
    console.log('Creating admin user...');

    const adminPassword = await bcrypt.hash('Admin@123456', BCRYPT_SALT_ROUNDS);

    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@documentapi.com'))
      .limit(1);

    let adminId: string;

    if (existingAdmin) {
      console.log('Admin user already exists, skipping...');
      adminId = existingAdmin.id;
    } else {
      const [admin] = await db
        .insert(users)
        .values({
          email: 'admin@documentapi.com',
          password: adminPassword,
          name: 'System Admin',
          role: 'admin',
        })
        .returning();
      adminId = admin.id;
      console.log('Admin user created');
    }


    const testUsers = [
      { email: 'john@example.com', name: 'John Doe', password: 'User@123456' },
    ];

    const userIds: string[] = [adminId];

    for (const userData of testUsers) {
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);

      if (existing) {
        userIds.push(existing.id);
        console.log(`User ${userData.email} already exists, skipping...`);
      } else {
        const hashedPassword = await bcrypt.hash(userData.password, BCRYPT_SALT_ROUNDS);
        const [user] = await db
          .insert(users)
          .values({
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            role: 'user',
          })
          .returning();
        userIds.push(user.id);
        console.log(`  User ${userData.email} created`);
      }
    }
    const sampleDocuments = [
      {
        title: 'API Documentation Guide',
        content: '# API Documentation\n\nThis guide covers all available endpoints for the Document Management API.',
        status: 'published' as const,
        userId: adminId,
      },
      {
        title: 'Project Requirements v2',
        content: '# Requirements\n\n## Overview\n\nThis document outlines the project requirements...',
        status: 'published' as const,
        userId: userIds[1],
      },
      {
        title: 'Meeting Notes - Sprint 12',
        content: '# Sprint 12 Meeting Notes\n\n## Attendees\n- John\n- Jane\n- Bob',
        status: 'draft' as const,
        userId: userIds[1],
      },
      
    ];

    for (const doc of sampleDocuments) {
      const [existing] = await db
        .select()
        .from(documents)
        .where(eq(documents.title, doc.title))
        .limit(1);

      if (existing) {
        console.log(`Document "${doc.title}" already exists, skipping...`);
      } else {
        await db.insert(documents).values(doc);
        console.log(`Document "${doc.title}" created`);
      }
    }
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();