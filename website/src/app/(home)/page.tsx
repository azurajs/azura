"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  Box,
  Layers,
  Cpu,
  Github,
  Terminal,
  CheckCircle2,
  Code2,
  ArrowRight,
  Command,
  Sparkles,
  Copy,
  Check,
  Star,
  Quote,
} from "lucide-react";
import { GetStartedButton } from "./get-started-button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Grid & Ambient Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-77.5 w-77.5 rounded-full bg-blue-500 opacity-20 blur-[100px]"></div>
        <div className="absolute right-0 bottom-0 -z-10 h-77.5 w-77.5 rounded-full bg-purple-500 opacity-10 blur-[100px]"></div>
      </div>

      <main className="relative z-10 pt-32 pb-20 px-6">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium uppercase tracking-wider">
            <Sparkles size={12} />
            v2.5 is now available
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            The framework for <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-indigo-400 to-purple-400">
              modern backend
            </span>{" "}
            development.
          </h1>

          <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Minimal, decorator-based, and type-safe. Build scalable Node.js & Bun applications with
            zero boilerplate and maximum performance.
          </p>

          {/* Buttons Area */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <GetStartedButton />

            <Link
              href="https://github.com/0xviny/azurajs"
              className="h-12 px-8 rounded-full bg-neutral-900 border border-white/10 text-white font-medium hover:bg-neutral-800 transition-all flex items-center gap-2 group w-full sm:w-auto justify-center"
            >
              <Github
                size={18}
                className="text-neutral-400 group-hover:text-white transition-colors"
              />
              Star on GitHub
            </Link>
          </div>

          {/* Install Box Area */}
          <div className="pt-8 flex justify-center">
            <InstallTabs />
          </div>
        </div>

        {/* Code Showcase */}
        <div className="max-w-4xl mx-auto mt-24">
          <div className="relative rounded-xl border border-white/10 bg-[#0A0A0A] shadow-2xl shadow-blue-900/10 overflow-hidden backdrop-blur-sm">
            <div className="flex items-center px-4 py-3 border-b border-white/5 bg-white/2">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
              </div>
              <div className="mx-auto text-xs text-neutral-500 font-mono flex items-center gap-2">
                <Code2 size={12} />
                server.ts
              </div>
            </div>

            <div className="p-6 md:p-8 overflow-x-auto bg-[#0A0A0A]">
              <pre className="font-mono text-sm leading-7 text-blue-100/90">
                <code>
                  <span className="text-purple-400">import</span> {"{"} AzuraClient {"}"}{" "}
                  <span className="text-purple-400">from</span>{" "}
                  <span className="text-green-400">'azurajs'</span>;<br />{" "}
                  <span className="text-purple-400">import</span> {"{"} Controller, Get {"}"}{" "}
                  <span className="text-purple-400">from</span>{" "}
                  <span className="text-green-400">'azurajs/decorators'</span>;<br />
                  <br />
                  <span className="text-yellow-300">@Controller</span>(
                  <span className="text-green-400">'/api'</span>)<br />
                  <span className="text-purple-400">class</span>{" "}
                  <span className="text-blue-300">AppController</span> {"{"}
                  <br />
                  <div className="pl-4 border-l border-white/5">
                    <span className="text-yellow-300">@Get</span>(
                    <span className="text-green-400">'/hello'</span>)<br />
                    <span className="text-blue-300">index</span>() {"{"}
                    <br />
                    <span className="pl-4 text-purple-400">return</span> {"{"} message:{" "}
                    <span className="text-green-400">'Hello World from Azura!'</span> {"}"};<br />
                    {"}"}
                  </div>
                  {"}"}
                  <br />
                  <br />
                  <span className="text-neutral-500">// Initialize application</span>
                  <br />
                  <span className="text-purple-400">const</span> app ={" "}
                  <span className="text-purple-400">new</span>{" "}
                  <span className="text-blue-300">AzuraClient</span>();
                  <br />
                  app.<span className="text-blue-300">listen</span>(
                  <span className="text-orange-300"></span>);
                </code>
              </pre>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto mt-32">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why AzuraJS?</h2>
            <p className="text-neutral-400 max-w-xl">
              Built to solve modern backend challenges. Everything you need, nothing you don't.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Zap className="text-amber-400" />}
              title="Blazing Fast"
              desc="Built on top of native HTTP modules with zero runtime overhead for maximum throughput."
            />
            <FeatureCard
              icon={<Terminal className="text-blue-400" />}
              title="Decorator Based"
              desc="Clean, expressive syntax using standard TypeScript decorators for routing."
            />
            <FeatureCard
              icon={<Box className="text-purple-400" />}
              title="Zero Dependencies"
              desc="Lightweight core. No bloat. We only use what's absolutely necessary."
            />
            <FeatureCard
              icon={<CheckCircle2 className="text-green-400" />}
              title="Type Safe"
              desc="First-class TypeScript support. Catch errors at build time, not runtime."
            />
            <FeatureCard
              icon={<Layers className="text-pink-400" />}
              title="Middleware Ready"
              desc="Compatible with the ecosystem middleware patterns you already know."
            />
            <FeatureCard
              icon={<Cpu className="text-cyan-400" />}
              title="Platform Agnostic"
              desc="Write once, run anywhere. Fully compatible with Node.js, Bun, and Deno."
            />
          </div>
        </div>

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Partners Section */}
        <PartnersSection />

        {/* Footer */}
        <footer className="max-w-6xl mx-auto mt-32 pt-8 border-t border-white/5 pb-8 flex flex-col md:flex-row justify-between items-center gap-4 text-neutral-500 text-sm">
          <div>© {new Date().getFullYear()} AzuraJS Framework.</div>
        </footer>
      </main>
    </div>
  );
}

// -- Components --

function InstallTabs() {
  const [activeTab, setActiveTab] = useState<"npm" | "pnpm" | "bun" | "yarn">("npm");
  const [copied, setCopied] = useState(false);

  const commands = {
    npm: "npm install azurajs",
    pnpm: "pnpm add azurajs",
    bun: "bun add azurajs",
    yarn: "yarn add azurajs",
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(commands[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden w-full max-w-105 shadow-2xl shadow-black/50">
      <div className="flex border-b border-white/5 bg-white/2">
        {(Object.keys(commands) as Array<keyof typeof commands>).map((pkg) => (
          <button
            key={pkg}
            onClick={() => setActiveTab(pkg)}
            className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
              activeTab === pkg
                ? "text-white bg-white/5 border-b-2 border-blue-500"
                : "text-neutral-500 hover:text-white hover:bg-white/5 border-b-2 border-transparent"
            }`}
          >
            {pkg}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between px-4 py-4 bg-[#0A0A0A]">
        <code className="font-mono text-sm text-neutral-300">
          <span className="text-neutral-600 mr-2 select-none">$</span>
          {commands[activeTab]}
        </code>
        <button
          onClick={handleCopy}
          className="ml-4 p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-all"
          title="Copy command"
        >
          {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}

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
    <div className="group p-6 rounded-xl bg-neutral-900/50 border border-white/5 hover:border-white/10 hover:bg-neutral-900 transition-all duration-300">
      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-neutral-400 leading-relaxed">{desc}</p>
    </div>
  );
}

interface Testimonial {
  user: string;
  name?: string;
  role?: string;
  description: string;
  avatar?: string;
}

function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/0xviny/azurajs/main/depoiments/depoiments.json")
      .then((res) => res.json())
      .then((data) => {
        setTestimonials(data.depoiments || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load testimonials:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto mt-32">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">What Developers Say</h2>
          <p className="text-neutral-400">Loading testimonials...</p>
        </div>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto mt-32">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">What Developers Say</h2>
        <p className="text-neutral-400 max-w-xl mx-auto">
          See what developers are saying about their experience with AzuraJS.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className="group p-6 rounded-xl bg-neutral-900/50 border border-white/5 hover:border-white/10 hover:bg-neutral-900 transition-all duration-300"
          >
            <div className="flex items-start gap-4 mb-4">
              {testimonial.avatar && (
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name || testimonial.user}
                  className="w-12 h-12 rounded-full border-2 border-white/10"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div className="flex-1">
                <h3 className="text-white font-semibold">{testimonial.name || testimonial.user}</h3>
                {testimonial.role && <p className="text-xs text-neutral-500">{testimonial.role}</p>}
              </div>
              <Quote size={20} className="text-blue-400/40" />
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed italic">
              "{testimonial.description}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Partner {
  name: string;
  logo: string;
  url: string;
}

function PartnersSection() {
  const partners: Partner[] = [
    {
      name: "Cheetah Solutions",
      logo: "/partners/cheetah.png",
      url: "https://www.cheetahsolutions.com.br/",
    },
    {
      name: "Simo",
      logo: "/partners/simo.png",
      url: "https://simobotlist.online/",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto mt-32">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Our Partners</h2>
        <p className="text-neutral-400 max-w-xl mx-auto">
          Proudly supported by companies that believe in modern backend development.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-8">
        {partners.map((partner, index) => (
          <a
            key={index}
            href={partner.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative p-8 rounded-xl bg-neutral-900/50 border border-white/5 hover:border-white/10 hover:bg-neutral-900 transition-all duration-300 hover:scale-105"
            title={partner.name}
          >
            <img
              src={partner.logo}
              alt={partner.name}
              className="h-12 w-auto grayscale group-hover:grayscale-0 transition-all duration-300 opacity-70 group-hover:opacity-100"
            />
          </a>
        ))}
      </div>
    </div>
  );
}
