import React from 'react';
import { Router, type Response, type Request } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthedRequest } from '../middleware/auth';
import { createAdminClient } from '../utils/supabase/admin';
import { ADMIN_EMAIL, sendAppEmail } from '../lib/email';
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
  createdAt?: string;
};

function mapDbRowToProject(row: any): ShowcaseProject {
  return {
    id: row.id,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    techStack: Array.isArray(row.tech_stack) ? row.tech_stack : [],
    category: row.category || 'Web App',
    githubUrl: row.github_url || null,
    liveUrl: row.live_url || null,
    demoVideoUrl: row.demo_video_url || null,
    authorName: row.author_name,
    authorCollege: row.author_college || null,
    stars: row.stars ?? 0,
    featured: Boolean(row.featured),
    createdAt: row.created_at,
  };
}

// GET /api/showcase/projects - List all approved projects from database
router.get('/projects', async (_req: Request, res: Response) => {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('showcase_projects')
      .select('*')
      .neq('status', 'rejected')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Showcase] Supabase query warning (table may need creation):', error.message);
      return res.json({
        ok: true,
        projects: [],
      });
    }

    const projects = (data || []).map(mapDbRowToProject);
    return res.json({
      ok: true,
      projects,
    });
  } catch (err: any) {
    console.error('[Showcase] Error fetching projects:', err);
    return res.json({
      ok: true,
      projects: [],
    });
  }
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

  const { title, tagline, description, techStack, category, githubUrl, liveUrl, demoVideoUrl } = validation.data;
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

  // Convert comma-separated tech stack to string array
  const techStackArray = techStack
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  // 1. Store project into Supabase database
  let savedProject: ShowcaseProject | null = null;
  try {
    const { data: insertedData, error: insertError } = await supabase
      .from('showcase_projects')
      .insert({
        title,
        tagline,
        description,
        tech_stack: techStackArray,
        category: category || 'Web App',
        github_url: githubUrl || null,
        live_url: liveUrl || null,
        demo_video_url: demoVideoUrl || null,
        author_id: user.id,
        author_name: studentName,
        author_email: studentEmail || null,
        author_college: college,
        author_branch: branch,
        author_year: year,
        stars: 0,
        featured: false,
        status: 'approved',
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('[Showcase] Failed to save project to Supabase:', insertError);
      return res.status(500).json({
        ok: false,
        error: `Database error: ${insertError.message}`,
      });
    }

    savedProject = mapDbRowToProject(insertedData);
  } catch (dbErr: any) {
    console.error('[Showcase] Supabase insert exception:', dbErr);
    return res.status(500).json({
      ok: false,
      error: dbErr.message || 'Database error occurred while storing project',
    });
  }

  // 2. Send email notification immediately to Admin via unified email service (Azure / Resend)
  let emailSent = false;
  try {
    const adminMailRes = await sendAppEmail({
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

    if (adminMailRes.success) {
      emailSent = true;
      console.log(`[Showcase] Admin email sent successfully for "${title}" to ${ADMIN_EMAIL}`);
    } else {
      console.warn('[Showcase] Admin notification email dispatch failed:', adminMailRes.error);
    }

    // Also send confirmation receipt email to the student
    if (studentEmail) {
      sendAppEmail({
        to: studentEmail,
        subject: `✨ Project Submission Received: ${title}`,
        react: (
          <ProjectSubmissionReceiptEmail
            studentName={studentName}
            projectTitle={title}
          />
        ),
      }).catch((err) => {
        console.warn('[Showcase] Failed to send receipt email to student:', err);
      });
    }
  } catch (mailErr) {
    console.error('[Showcase] Email trigger exception:', mailErr);
  }

  return res.json({
    ok: true,
    message: 'Your project has been submitted and stored in the showcase database! The admin has been notified via email.',
    emailSent,
    project: savedProject || {
      id: '',
      title,
      tagline,
      description,
      techStack: techStackArray,
      category: category || 'Web App',
      authorName: studentName,
      authorCollege: college,
    },
  });
});

// POST /api/showcase/:id/like - Like or star a showcase project
router.post('/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = createAdminClient();

    // Fetch current stars
    const { data: project, error: fetchErr } = await supabase
      .from('showcase_projects')
      .select('stars')
      .eq('id', id)
      .single();

    if (fetchErr || !project) {
      return res.status(404).json({ ok: false, error: 'Project not found' });
    }

    const newStars = (project.stars ?? 0) + 1;
    const { error: updateErr } = await supabase
      .from('showcase_projects')
      .update({ stars: newStars })
      .eq('id', id);

    if (updateErr) {
      return res.status(500).json({ ok: false, error: updateErr.message });
    }

    return res.json({ ok: true, stars: newStars });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export { router as showcaseRouter };
