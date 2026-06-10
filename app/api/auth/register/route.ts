import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase-server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { name, email, password } = result.data;

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return Response.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from('users')
      .insert({ name, email: email.toLowerCase(), password: hashedPassword })
      .select('id, name, email, createdAt')
      .single();

    if (error || !user) {
      return Response.json({ error: 'Registration failed' }, { status: 500 });
    }

    await supabase.from('notifications').insert({
      userId: user.id,
      title: 'Welcome to ContentEngine! 🎉',
      message: 'Your account is ready. Start by creating your first post.',
      type: 'INFO',
      actionUrl: '/dashboard',
    });

    await supabase.from('activities').insert({
      userId: user.id,
      type: 'USER_LOGIN',
      description: 'Account created',
      metadata: { method: 'credentials' },
    });

    return Response.json({ data: user }, { status: 201 });
  } catch (error) {
    console.error('[register]', error);
    return Response.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
