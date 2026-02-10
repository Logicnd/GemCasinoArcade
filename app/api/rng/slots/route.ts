
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateSpinResult } from '@/lib/slots-engine';
import { ECONOMY } from '@/lib/economy';

const spinSchema = z.object({
  bet: z.number().int().min(ECONOMY.MIN_BET).max(ECONOMY.MAX_BET),
  seed: z.string().optional(), // For testing only
});

// Simple in-memory rate limit
const RATE_LIMIT_WINDOW = 1000; // 1 second
const ipMap = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    // Rate Limit Check
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const lastRequest = ipMap.get(ip) || 0;
    
    if (now - lastRequest < RATE_LIMIT_WINDOW) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429 }
      );
    }
    ipMap.set(ip, now);

    // Clean up old IPs periodically (simple naive approach)
    if (ipMap.size > 1000) ipMap.clear();

    const body = await req.json();
    const validation = spinSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { bet, seed } = validation.data;

    // NOTE: In a real app with server-side wallet, we would check balance here.
    // Since this is client-side state (MVP), the client checks balance before calling.
    // The "Tamper-Evident" mode would require signed cookies here.
    // For MVP, we trust the client's request to spin, and the client applies the result.
    
    // However, if we enable the optional signed-cookie mode, we would read the cookie here,
    // deduct the bet, add the win, and return the new balance + spin result.
    
    // Proceed with spin
    const result = calculateSpinResult(bet, seed);

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error) {
    console.error('Spin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
