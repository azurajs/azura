import Link from "next/link";
import {
  Zap,
  Box,
  Layers,
  Cpu,
  ArrowRight,
  Github,
  BookOpen,
  Terminal,
  CheckCircle2,
} from "lucide-react";
import { GetStartedButton } from "./get-started-button";

export default function HomePage() {
  return (
    <div className="min-h-screen selection:bg-blue-500/30 font-sans">
      {/* Background Glow Effects - Ambient Light */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-125 bg-blue-500/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
      <div className="fixed bottom-0 right-0 w-125 h-125 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none opacity-30" />

      <main className="relative pt-32 pb-20 px-6">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            v1.0.3 Public Beta is live
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Build faster with <br />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-400 via-purple-500 to-blue-600 animate-gradient-x">
              AzuraJS Framework
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            The minimal, decorator-based framework for Node.js & Bun. Experience full type-safety
            without the boilerplate overhead.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <GetStartedButton />

            <Link
              href="https://github.com/0xviny/azurajs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-full hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm"
            >
              <Github size={18} />
              Star on GitHub
            </Link>
          </div>
        </div>

        {/* Code Showcase - "The Seyfert/Modern Vibe" */}
        <div className="max-w-4xl mx-auto mt-20 relative group">
          {/* Gradient Behind Code */}
          <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

          <div className="relative bg-[#0F0F11] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            {/* Window Controls */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="text-xs text-neutral-500 font-mono">user.controller.ts</div>
              <div className="w-10"></div> {/* Spacer for centering */}
            </div>

            {/* Code Content */}
            <div className="p-6 overflow-x-auto">
              <pre className="font-mono text-sm leading-relaxed text-blue-100">
                <code>
                  <span className="text-purple-400">import</span> {"{"} AzuraClient, Controller,
                  Get, Post {"}"} <span className="text-purple-400">from</span>{" "}
                  <span className="text-green-400">"azurajs"</span>;<br />
                  <br />
                  <span className="text-yellow-400">@Controller</span>(
                  <span className="text-green-400">"/api/users"</span>)<br />
                  <span className="text-purple-400">export class</span>{" "}
                  <span className="text-yellow-200">UserController</span> {"{"}
                  <br />
                  <div className="border-l-2 border-white/10 pl-4 my-1">
                    &nbsp;&nbsp;<span className="text-yellow-400">@Get</span>()
                    <br />
                    &nbsp;&nbsp;<span className="text-blue-300">getAllUsers</span>() {"{"}
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">return</span> {"{"}{" "}
                    users: [<span className="text-green-400">"Alice"</span>,{" "}
                    <span className="text-green-400">"Bob"</span>] {"}"};<br />
                    &nbsp;&nbsp;{"}"}
                  </div>
                  <br />
                  &nbsp;&nbsp;<span className="text-yellow-400">@Post</span>()
                  <br />
                  &nbsp;&nbsp;<span className="text-blue-300">createUser</span>(
                  <span className="text-yellow-400">@Body</span>() data:{" "}
                  <span className="text-purple-400">any</span>) {"{"}
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">return</span> {"{"} id:
                  Date.<span className="text-blue-300">now</span>(), ...data {"}"};<br />
                  &nbsp;&nbsp;{"}"}
                  <br />
                  {"}"}
                </code>
              </pre>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Why AzuraJS?</h2>
            <p className="text-neutral-400">
              Built for performance, designed for developer experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Terminal className="text-blue-400" />}
              title="Decorator Based"
              desc="Clean, expressive syntax using standard TypeScript decorators for routing and dependency injection."
            />
            <FeatureCard
              icon={<Zap className="text-yellow-400" />}
              title="Blazing Fast"
              desc="Minimal runtime overhead. Built on top of native HTTP modules for maximum throughput."
            />
            <FeatureCard
              icon={<Box className="text-purple-400" />}
              title="Zero Dependencies"
              desc="Lightweight core. No bloat. We only use what's absolutely necessary to run your app."
            />
            <FeatureCard
              icon={<CheckCircle2 className="text-green-400" />}
              title="Type Safe"
              desc="First-class TypeScript support. If it compiles, it likely works. Catch errors at build time."
            />
            <FeatureCard
              icon={<Layers className="text-pink-400" />}
              title="Middleware Ready"
              desc="Compatible with the Express ecosystem middleware pattern you already know and love."
            />
            <FeatureCard
              icon={<Cpu className="text-cyan-400" />}
              title="Platform Agnostic"
              desc="Run anywhere. Fully compatible with Node.js, Bun, and other modern runtimes."
            />
          </div>
        </div>

        {/* Stats / Footer Area */}
        <div className="max-w-4xl mx-auto mt-32 pt-16 border-t border-white/5 text-center">
          <h3 className="text-2xl font-bold mb-8">Ready to ship?</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <StatItem value="100%" label="TypeScript" />
            <StatItem value="0" label="Dependencies" />
            <StatItem value="MIT" label="License" />
            <StatItem value="v1.0.3" label="Release" />
          </div>

          <p className="text-neutral-600 text-sm">
            © {new Date().getFullYear()} AzuraJS. Open source software powered by the community.
          </p>
        </div>
      </main>
    </div>
  );
}

// Componentes Auxiliares Minimalistas

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-neutral-900/40 border border-white/5 hover:border-blue-500/30 hover:bg-neutral-900/60 transition-all duration-300 group">
      <div className="mb-4 p-3 rounded-lg bg-white/5 w-fit group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-neutral-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}
