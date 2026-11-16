'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Loader2,
  MessageCircleQuestion,
  PenLine,
} from "lucide-react";
import { ApiRequestError, getLesson } from "@/services/api";
import type { Lesson, LessonSection } from "@/types/lesson";

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function LessonWorkspacePage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params?.lessonId;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lessonId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getLesson(lessonId);
        if (cancelled) return;
        setLesson(data);
        setActiveSectionId(data.sections[0]?.id ?? null);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ApiRequestError
            ? err.message
            : "Could not load this lesson.";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const activeSection: LessonSection | null = useMemo(() => {
    if (!lesson || !activeSectionId) return null;
    return lesson.sections.find((section) => section.id === activeSectionId) ?? null;
  }, [lesson, activeSectionId]);

  return (
    <main className="min-h-screen bg-[#faf9ff] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-violet-700">
            <ArrowLeft size={16} />
            Back home
          </Link>
          <div className="flex items-center gap-2 font-bold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white">
              <GraduationCap size={20} />
            </span>
            <span>Whiteboard<span className="text-violet-600">AI</span></span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {loading && (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-600">
            <Loader2 className="animate-spin text-violet-600" size={28} />
            <p className="text-sm">Loading your AI-generated lesson…</p>
          </div>
        )}

        {!loading && error && (
          <div className="mx-auto max-w-xl rounded-2xl bg-rose-50 px-5 py-6 text-center ring-1 ring-rose-100">
            <p className="text-sm leading-6 text-rose-700">{error}</p>
            <Link
              href="/"
              className="mt-4 inline-flex rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Generate a new lesson
            </Link>
          </div>
        )}

        {!loading && lesson && (
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Sections</p>
              <nav className="mt-3 space-y-1">
                {lesson.sections.map((section, index) => {
                  const active = section.id === activeSectionId;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSectionId(section.id)}
                      className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        active
                          ? "bg-violet-600 text-white"
                          : "text-slate-700 hover:bg-violet-50"
                      }`}
                    >
                      <span className="block text-[11px] opacity-80">
                        {formatTime(section.start_time)} – {formatTime(section.end_time)}
                      </span>
                      <span className="font-medium">
                        {index + 1}. {section.title}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-600">
                  <BookOpen size={14} />
                  AI lesson workspace
                </div>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  {lesson.title}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Topic: <span className="font-medium text-slate-700">{lesson.topic}</span>
                  {" · "}
                  Level: <span className="capitalize font-medium text-slate-700">{lesson.level}</span>
                  {" · "}
                  Duration: <span className="font-medium text-slate-700">{lesson.duration}s</span>
                </p>
                <p className="mt-5 text-base leading-7 text-slate-700">{lesson.introduction}</p>

                <div className="mt-6">
                  <h2 className="text-sm font-semibold text-slate-900">Learning objectives</h2>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
                    {lesson.learning_objectives.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              {activeSection && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                        Current section
                      </p>
                      <h2 className="mt-1 text-2xl font-bold text-slate-950">{activeSection.title}</h2>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {formatTime(activeSection.start_time)} – {formatTime(activeSection.end_time)}
                    </span>
                  </div>

                  <div className="mt-5 rounded-xl bg-violet-50/70 p-4 ring-1 ring-violet-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Narration</p>
                    <p className="mt-2 text-sm leading-7 text-slate-700">{activeSection.narration}</p>
                  </div>

                  <div className="mt-6">
                    <div className="mb-3 flex items-center gap-2">
                      <PenLine size={16} className="text-violet-600" />
                      <h3 className="text-sm font-semibold text-slate-900">Whiteboard visual actions</h3>
                    </div>
                    <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-dashed border-violet-200 bg-[linear-gradient(180deg,#fbfaff_0%,#f4f0ff_100%)] p-4">
                      {activeSection.visual_actions.map((action) => (
                        <div
                          key={action.id}
                          className="absolute max-w-[46%] rounded-lg border border-violet-200 bg-white/95 px-2.5 py-2 shadow-sm"
                          style={{
                            left: `${action.position.x}%`,
                            top: `${action.position.y}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-600">
                            {action.type}
                          </p>
                          <p className="mt-0.5 text-xs leading-5 text-slate-800">{action.content}</p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            t={formatTime(action.start_time)} · {action.duration}s
                          </p>
                        </div>
                      ))}
                    </div>
                    <ul className="mt-4 space-y-2">
                      {activeSection.visual_actions.map((action) => (
                        <li
                          key={`${action.id}-list`}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                        >
                          <span className="font-semibold capitalize text-violet-700">{action.type}</span>
                          {": "}
                          {action.content}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              <section className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-slate-900">Summary</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{lesson.summary}</p>
                  <h3 className="mt-5 text-sm font-semibold text-slate-900">Key points</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
                    {lesson.key_points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <MessageCircleQuestion size={16} className="text-violet-600" />
                    <h2 className="text-sm font-semibold text-slate-900">Follow-up questions</h2>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {lesson.follow_up_questions.map((question) => (
                      <li
                        key={question}
                        className="rounded-xl bg-violet-50 px-3 py-2.5 text-sm leading-6 text-violet-900 ring-1 ring-violet-100"
                      >
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
