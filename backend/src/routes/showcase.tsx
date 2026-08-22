import React from 'react';
import { Router, type Response } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthedRequest } from '../middleware/auth';
import { createAdminClient } from '../utils/supabase/admin';
import { ADMIN_EMAIL, FROM_EMAIL, resend } from '../lib/email';
import { ProjectSubmissionNotificationEmail } from '../components/emails/ProjectSubmissionNotification';
import { ProjectSubmissionReceiptEmail } from '../components/emails/ProjectSubmissionReceipt';

const router = Router();

const projectSubmissionSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  tagline: z.string().min(5, 'Tagline must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(3000),
  techStack: z.string().min(2, 'Please specify your tech stack (e.g. Next.js, TypeScript, PostgreSQL)'),
  category: z.string().optional().default('Web App'),
  githubUrl: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  liveUrl: z.string().url('Invalid Live Demo URL').optional().or(z.literal('')),
  demoVideoUrl: z.string().url('Invalid Video Demo URL').optional().or(z.literal('')),
});

export type ShowcaseProject = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  techStack: string[];
  category: string;
  githubUrl?: string | null;
  liveUrl?: string | null;
  demoVideoUrl?: string | null;
  authorName: string;
  authorCollege?: string | null;
  stars?: number;
  featured?: boolean;
};

// Projects list (empty by default until submitted/approved)
const curatedProjects: ShowcaseProject[] = [];

// GET /api/showcase/projects
router.get('/projects', async (_req, res: Response) => {
  return res.json({
    ok: true,
    projects: curatedProjects,
  });
});

// POST /api/showcase/submit (Requires verified student auth)
router.post('/submit', requireAuth, async (req: AuthedRequest, res: Response) => {
  const validation = projectSubmissionSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      ok: false,
      error: validation.error.issues[0].message,
    });
  }

  const { title, tagline, description, techStack, githubUrl, liveUrl, demoVideoUrl } = validation.data;
  const user = req.user;

  if (!user) {
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const studentName = profile?.full_name || user.email?.split('@')[0] || 'Verified Student';
  const studentEmail = profile?.email || user.email || '';
  const college = profile?.college || null;
  const branch = profile?.branch || null;
  const year = profile?.year || null;
  const submittedAt = new Date().toLocaleString();

  // Send email notification to admin via Resend
  let emailSent = false;
  if (resend) {
    try {
      const adminMailRes = await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `🚀 New Project Submission: ${title} by ${studentName}`,
        react: (
          <ProjectSubmissionNotificationEmail
            studentName={studentName}
            studentEmail={studentEmail}
            college={college}
            branch={branch}
            year={year}
            projectTitle={title}
            tagline={tagline}
            description={description}
            techStack={techStack}
            githubUrl={githubUrl || null}
            liveUrl={liveUrl || null}
            demoVideoUrl={demoVideoUrl || null}
            submittedAt={submittedAt}
          />
        ),
      });

      if (adminMailRes.error) {
        console.error('Error sending project submission email to admin:', adminMailRes.error);
      } else {
        emailSent = true;
        console.log(`[Showcase] Admin notification email sent successfully for project: "${title}" to ${ADMIN_EMAIL}`);
      }

      // Also send confirmation email to the student
      if (studentEmail) {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: studentEmail,
          subject: `✨ Project Submission Received: ${title}`,
          react: (
            <ProjectSubmissionReceiptEmail
              studentName={studentName}
              projectTitle={title}
            />
          ),
        }).catch((err) => {
          console.warn('Failed to send confirmation email to student:', err);
        });
      }
    } catch (mailErr) {
      console.error('Failed to trigger Resend project submission notification:', mailErr);
    }
  } else {
    console.log(
      `[Showcase DEV] Resend not configured. New project submitted:\n` +
      `Title: ${title}\nAuthor: ${studentName} (${studentEmail})\nCollege: ${college}\nTech: ${techStack}\nAdmin target: ${ADMIN_EMAIL}`
    );
  }

  return res.json({
    ok: true,
    message: 'Your project has been submitted successfully! The admin has been notified via email and will review your submission for the showcase gallery.',
    emailSent,
    project: {
      title,
      studentName,
      submittedAt,
    },
  });
});

export { router as showcaseRouter };
