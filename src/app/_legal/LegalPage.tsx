import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type LegalPageProps = {
  label: string;
  title: string;
  summary: string;
  updatedAt: string;
  sections: LegalSection[];
};

function sectionId(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function LegalPage({ label, title, summary, updatedAt, sections }: LegalPageProps) {
  return (
    <div className="tech-grid min-h-screen">
      <section className="border-b border-slate-900/80 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-emerald-400"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>

          <div className="mt-10 inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-400">
            <FileText className="size-3.5" />
            {label}
          </div>

          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-400 md:text-lg">
            {summary}
          </p>
          <p className="mt-6 text-xs font-mono uppercase tracking-widest text-slate-500">
            Last updated: {updatedAt}
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <nav className="sticky top-28 space-y-2 text-xs font-mono">
              {sections.map((section) => (
                <a
                  key={section.title}
                  href={`#${sectionId(section.title)}`}
                  className="block rounded-lg border border-transparent px-3 py-2 text-slate-500 transition-colors hover:border-emerald-500/20 hover:bg-slate-900/60 hover:text-emerald-400"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <article className="space-y-10">
            {sections.map((section) => (
              <section
                key={section.title}
                id={sectionId(section.title)}
                className="scroll-mt-28 border-b border-slate-900 pb-10 last:border-b-0"
              >
                <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300 md:text-base md:leading-8">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}

                  {section.bullets && section.bullets.length > 0 ? (
                    <ul className="list-disc space-y-2 pl-5 text-slate-400">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </article>
        </div>
      </section>
    </div>
  );
}
