/**
 * POST /api/auth/register
 * Creates a new user account with hashed password.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return Response.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password (12 rounds = secure but not too slow)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // Create welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to ContentEngine! 🎉',
        message: 'Your account is ready. Start by creating your first post or exploring the AI features.',
        type: 'INFO',
        actionUrl: '/dashboard',
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: 'USER_LOGIN',
        description: 'Account created',
        metadata: { method: 'credentials' },
      },
    });

    return Response.json({ data: user }, { status: 201 });
  } catch (error) {
    console.error('[register] Error:', error);
    return Response.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
