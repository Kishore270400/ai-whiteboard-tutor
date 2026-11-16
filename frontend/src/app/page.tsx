'use client';

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, AudioLines, BookOpen, BrainCircuit,
  GraduationCap, Loader2, MessageCircle, PenLine, Sparkles,
} from "lucide-react";
import BackendConnectionStatus, {
  type ConnectionState,
} from "@/components/BackendConnectionStatus";
import { ApiRequestError, generateLesson } from "@/services/api";
import type { LessonLevel } from "@/types/lesson";

const examples = ["Photosynthesis", "Artificial Intelligence", "Newton's Laws", "The Human Heart"];

const features = [
  {
    icon: BrainCircuit,
    title: "AI-powered lessons",
    description: "Turn any topic into a clear, structured lesson tailored to your level.",
  },
  {
    icon: PenLine,
    title: "Interactive whiteboard",
    description: "Understand complex ideas through diagrams, annotations, and visual steps.",
  },
  {
    icon: AudioLines,
    title: "Synchronized narration",
    description: "Follow the explanation while the whiteboard demonstrates each concept.",
  },
  {
    icon: MessageCircle,
    title: "Ask follow-up questions",
    description: "Keep learning with contextual answers from your AI tutor.",
  },
];

export default function Home() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<LessonLevel>("beginner");
  const [connection, setConnection] = useState<ConnectionState>("checking");
  const [formMessage, setFormMessage] = useState<{
    type: "error" | "info";
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = topic.trim();
    if (!trimmed) {
      setFormMessage({
        type: "error",
        text: "Please enter a topic before generating a lesson.",
      });
      return;
    }

    if (trimmed.length > 200) {
      setFormMessage({
        type: "error",
        text: "Topic must be 200 characters or fewer.",
      });
      return;
    }

    if (connection !== "connected") {
      setFormMessage({
        type: "error",
        text: "Backend is disconnected. Start FastAPI, then retry connection.",
      });
      return;
    }

    setIsSubmitting(true);
    setFormMessage(null);

    try {
      const lesson = await generateLesson({
        topic: trimmed,
        level,
        duration: 120,
      });
      router.push(`/workspace/${lesson.id}`);
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Lesson generation failed. Please try again.";
      setFormMessage({ type: "error", text: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  const generateDisabled = !topic.trim() || isSubmitting || connection === "checking";

  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
            <GraduationCap size={23} />
          </span>
          <span className="text-lg">Whiteboard<span className="text-violet-600">AI</span></span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <Link className="hover:text-violet-700" href="/">Home</Link>
          <a className="hover:text-violet-700" href="#features">Features</a>
          <a className="hover:text-violet-700" href="#how-it-works">How it works</a>
        </nav>
        <a href="#start" className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700">
          Get started
        </a>
      </header>

      <section id="start" className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
        <div className="absolute -left-40 top-20 -z-10 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700 shadow-sm">
            <Sparkles size={16} /> Your personal AI learning companion
          </div>
          <h1 className="max-w-2xl text-5xl font-bold leading-[1.08] tracking-tight text-slate-950 sm:text-6xl">
            Learn anything.<br />
            <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">See everything.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Turn any topic into a visual lesson with an AI tutor that explains,
            draws, and speaks alongside you.
          </p>

          <form onSubmit={handleSubmit} className="mt-9 max-w-xl rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-violet-100/70">
            <label htmlFor="topic" className="sr-only">What do you want to learn?</label>
            <input
              id="topic"
              value={topic}
              onChange={(event) => {
                setTopic(event.target.value);
                if (formMessage) setFormMessage(null);
              }}
              placeholder="What do you want to learn today?"
              className="w-full rounded-xl px-4 py-4 text-base text-slate-900 outline-none placeholder:text-slate-400"
              aria-invalid={formMessage?.type === "error"}
              aria-describedby={formMessage ? "topic-message" : undefined}
              disabled={isSubmitting}
            />
            <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-2 pt-3 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 px-2 text-xs text-slate-500">
                Level
                <select
                  value={level}
                  onChange={(event) => setLevel(event.target.value as LessonLevel)}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
              <button
                type="submit"
                disabled={generateDisabled}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating lesson…
                  </>
                ) : (
                  <>
                    Generate lesson <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          {formMessage && (
            <p
              id="topic-message"
              role="status"
              className={`mt-3 max-w-xl rounded-xl px-4 py-3 text-sm leading-6 ${
                formMessage.type === "error"
                  ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
                  : "bg-violet-50 text-violet-800 ring-1 ring-violet-100"
              }`}
            >
              {formMessage.text}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setTopic(example);
                  setFormMessage(null);
                }}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-violet-300 hover:text-violet-700 disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>

          <div className="mt-8">
            <BackendConnectionStatus onStatusChange={setConnection} />
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-violet-200/70 to-indigo-100/30 blur-2xl" />
          <div className="relative rounded-3xl border border-white bg-white p-4 shadow-2xl shadow-violet-200/60">
            <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Live lesson preview</p>
                <h2 className="mt-1 font-semibold text-slate-900">How photosynthesis works</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Visual lesson</span>
            </div>
            <div className="my-5 rounded-2xl bg-[#fbfaff] p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">The process</span>
                <BookOpen size={17} className="text-violet-500" />
              </div>
              <div className="grid grid-cols-3 items-center gap-2 text-center">
                <div className="rounded-xl bg-amber-50 p-3">
                  <div className="text-3xl">☀️</div>
                  <p className="mt-2 text-xs font-semibold text-amber-800">Sunlight</p>
                </div>
                <div className="text-2xl text-violet-400">+</div>
                <div className="rounded-xl bg-sky-50 p-3">
                  <div className="text-3xl">💧</div>
                  <p className="mt-2 text-xs font-semibold text-sky-800">Water</p>
                </div>
              </div>
              <div className="my-3 flex justify-center text-violet-500">↓</div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <div className="text-3xl">🌱</div>
                <p className="mt-2 text-sm font-bold text-emerald-800">Plant produces glucose</p>
                <p className="mt-1 text-xs text-emerald-700">A visual explanation preview</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-white"><AudioLines size={17} /></div>
              <div className="flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-2/5 rounded-full bg-violet-500" /></div>
                <p className="mt-1.5 text-[10px] text-slate-500">Example interface preview · narration not active</p>
              </div>
              <span className="text-xs font-medium text-slate-500">2:00</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-slate-200/70 bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-violet-600">A better way to learn</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Everything clicks when you can see it</h2>
            <p className="mt-4 leading-7 text-slate-600">A learning experience designed to make complex ideas easier to understand.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-100">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Icon size={21} /></div>
                <h3 className="mt-5 font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-3">
          {[
            ["01", "Choose a topic", "Tell your AI tutor what you want to understand."],
            ["02", "Watch it come to life", "Follow narration and visual explanations together."],
            ["03", "Ask and explore", "Ask questions until the concept makes sense."],
          ].map(([number, title, description]) => (
            <div key={number} className="flex gap-4">
              <span className="text-3xl font-bold text-violet-300">{number}</span>
              <div><h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">
        <span suppressHydrationWarning>
          © {new Date().getFullYear()} AI Whiteboard Tutor. Built for learning.
        </span>
      </footer>
    </main>
  );
}
