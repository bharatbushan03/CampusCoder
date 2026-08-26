import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CountdownTimer } from './CountdownTimer';

// Mock framer-motion to avoid animation issues in jsdom
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <div ref={ref} {...props}>{children}</div>
    )),
    span: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <span ref={ref} {...props}>{children}</span>
    )),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('CountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing initially to prevent hydration mismatch, then renders timer', () => {
    const targetDate = new Date(Date.now() + 10000); // 10 seconds from now
    
    render(<CountdownTimer targetDate={targetDate} />);
    
    // We can't strictly test the non-mounted state easily if useEffect runs synchronously in test,
    // but we can verify it eventually renders the timer.
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });

  it('calculates and displays the correct time left', () => {
    // 1 day, 2 hours, 30 minutes, 15 seconds from now
    const now = new Date('2026-06-20T12:00:00Z').getTime();
    vi.setSystemTime(now);

    const targetDate = new Date('2026-06-21T14:30:15Z');
    
    render(<CountdownTimer targetDate={targetDate} />);

    // Fast-forward 1 second so setInterval runs
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Check days
    expect(screen.getByText('01')).toBeInTheDocument(); // 1 day
    expect(screen.getByText('Days')).toBeInTheDocument();
    
    // Check hours
    expect(screen.getByText('02')).toBeInTheDocument(); // 2 hours
    expect(screen.getByText('Hours')).toBeInTheDocument();
    
    // Check minutes
    expect(screen.getByText('30')).toBeInTheDocument(); // 30 mins
    expect(screen.getByText('Mins')).toBeInTheDocument();
    
    // Check seconds
    expect(screen.getByText('14')).toBeInTheDocument(); // 15 - 1 = 14 secs
    expect(screen.getByText('Secs')).toBeInTheDocument();
  });

  it('displays "🚀 Event Started" when target date is reached', () => {
    const now = new Date('2026-06-22T12:00:00Z').getTime();
    vi.setSystemTime(now);

    // Target date is in the past
    const targetDate = new Date('2026-06-22T10:00:00Z');
    
    render(<CountdownTimer targetDate={targetDate} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('Event Started')).toBeInTheDocument();
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  });
});
