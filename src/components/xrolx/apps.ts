import {
  Brain,
  Hammer,
  Mail,
  Image as ImageIcon,
  Palette,
  AudioLines,
  FolderTree,
  Globe2,
  Compass,
  MapPin,
  Users,
  Radio,
  GraduationCap,
  Workflow,
  Store,
  BookOpen,
  BarChart3,
  Gamepad2,
  UsersRound,
  ShieldCheck,
  Cloud,
  Server,
  type LucideIcon,
} from "lucide-react";

export type XApp = {
  id: string;
  name: string;
  short: string;
  icon: LucideIcon;
  hue: string; // tailwind-ready hex
  blurb: string;
  category: "Core" | "Creative" | "Dev" | "Social" | "Cloud" | "Family";
};

export const APPS: XApp[] = [
  { id: "command", name: "Command Center", short: "AI brain & control", icon: Brain, hue: "#73ffb8", blurb: "Multi-chat AI with memory, voice and OS control.", category: "Core" },
  { id: "builder", name: "Builder", short: "Dev environment", icon: Hammer, hue: "#2dd4a8", blurb: "Monaco + terminal + AI sidebar. 11 languages.", category: "Dev" },
  { id: "mail", name: "Mail", short: "Inbox & automation", icon: Mail, hue: "#5eead4", blurb: "Gmail / Outlook / IMAP with AI sorting & replies.", category: "Core" },
  { id: "gallery", name: "Gallery", short: "Photos & video", icon: ImageIcon, hue: "#86efac", blurb: "Cloud sync, AI enhance, cartoonify, remove objects.", category: "Creative" },
  { id: "design", name: "Design Hub", short: "Canvas & UI", icon: Palette, hue: "#a7f3d0", blurb: "Figma-class canvas with AI → React export.", category: "Creative" },
  { id: "audio", name: "Audio Studio", short: "TTS & music", icon: AudioLines, hue: "#7dd3fc", blurb: "AI music, SFX, podcasts and voice tools.", category: "Creative" },
  { id: "files", name: "File Hub", short: "Drive & graph", icon: FolderTree, hue: "#67e8f9", blurb: "Cloud files with AI search and relationship graph.", category: "Core" },
  { id: "feed", name: "AI Feed", short: "Social stream", icon: Globe2, hue: "#34d399", blurb: "Following, projects, communities and trending.", category: "Social" },
  { id: "discover", name: "AI Discover", short: "Recommendations", icon: Compass, hue: "#22d3ee", blurb: "Learns your interests, goals, friends and projects.", category: "Social" },
  { id: "world", name: "World Hub", short: "Maps & events", icon: MapPin, hue: "#4ade80", blurb: "Nearby people, communities, hackathons, meetups.", category: "Social" },
  { id: "spaces", name: "Friend Spaces", short: "Servers", icon: Users, hue: "#6ee7b7", blurb: "Chat, voice, projects, files + AI helper.", category: "Social" },
  { id: "live", name: "Live Rooms", short: "Voice + screen", icon: Radio, hue: "#fb7185", blurb: "Shared screens, projects, AI meeting summaries.", category: "Social" },
  { id: "learn", name: "Learning Hub", short: "AI teacher", icon: GraduationCap, hue: "#fde68a", blurb: "Lessons, quizzes, classrooms, study groups.", category: "Core" },
  { id: "flows", name: "Workflows", short: "Automations", icon: Workflow, hue: "#c4b5fd", blurb: "Zapier-class flows with AI trigger logic.", category: "Dev" },
  { id: "market", name: "Marketplace", short: "Plugins & themes", icon: Store, hue: "#fcd34d", blurb: "Plugins, themes, workflows, AI tools, MCP servers.", category: "Dev" },
  { id: "knowledge", name: "Knowledge Hub", short: "Connected notes", icon: BookOpen, hue: "#f0abfc", blurb: "Notion-style notes linked to files, chats, projects.", category: "Core" },
  { id: "analyst", name: "Analyst", short: "Stats & trends", icon: BarChart3, hue: "#93c5fd", blurb: "Usage, project analytics, AI predictions.", category: "Core" },
  { id: "coach", name: "Game Coach", short: "Live coaching", icon: Gamepad2, hue: "#f87171", blurb: "Screen-aware coaching, auto clips, performance.", category: "Family" },
  { id: "teams", name: "Teams", short: "Org workspace", icon: UsersRound, hue: "#a3e635", blurb: "Members, roles, shared projects, pooled storage.", category: "Cloud" },
  { id: "family", name: "Family", short: "Parental & kids", icon: ShieldCheck, hue: "#fbbf24", blurb: "PINs, AI restrictions, time controls, multi-parent.", category: "Family" },
  { id: "xcp", name: "XCP Cloud", short: "Backend platform", icon: Cloud, hue: "#60a5fa", blurb: "Auth, DB, realtime, storage, payments, multiplayer.", category: "Cloud" },
  { id: "hosting", name: "Hosting", short: "Deploy", icon: Server, hue: "#38bdf8", blurb: "Temp URLs, custom domains, Netlify & Vercel link.", category: "Cloud" },
];

export const APP_BY_ID = Object.fromEntries(APPS.map((a) => [a.id, a]));
