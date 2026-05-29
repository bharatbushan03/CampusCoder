import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      {
        success: false,
        message: 'Supabase environment variables are missing.',
        env: {
          NEXT_PUBLIC_SUPABASE_URL: url ? 'Present' : 'Missing',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: key ? 'Present' : 'Missing',
        },
      },
      { status: 500 }
    );
  }

  try {
    const supabase = await createClient();
    
    // Attempt to query the events table to check database connectivity
    const { data, error, status } = await supabase
      .from('events')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Connected to API, but database query failed.',
          error: error.message,
          code: error.code,
          httpStatus: status,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully connected to Supabase database!',
      details: {
        url,
        queryStatus: 'Query successful',
        eventsCountData: data,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected connection error occurred.',
        error: error.message || error,
      },
      { status: 500 }
    );
  }
}
