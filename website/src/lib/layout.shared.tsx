import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function baseOptions(lang?: string): BaseLayoutProps {
  const currentLang = lang || "en";

  return {
    githubUrl: "https://github.com/0xviny/azurajs",

    nav: {
      title: (
        <div className="flex items-center gap-2 font-bold">
          <div>
            <img src="/logo.png" alt="AzuraJS Logo" className="h-16 w-auto" />
          </div>
          <span className="text-lg tracking-tight">AzuraJS</span>
          {/* Opcional: Badge de versão */}
          <span className="text-xs bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-700 font-mono font-normal">
            Beta
          </span>
        </div>
      ),

      transparentMode: "top",
    },

    themeSwitch: {
      enabled: false,
    },

    links: [
      {
        text: "Documentation",
        url: `/docs/${currentLang}`,
        active: "nested-url",
      },
      {
        type: "custom",
        children: <LanguageSwitcher />,
      },
      {
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
        ),
        text: "Discord",
        url: "https://discord.gg/gr63YzEYfp",
        external: true,
      },
      {
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12s12-5.373 12-12S18.627 0 12 0zm-1.5 17.625H8.25v-6.75h2.25v6.75zm6.75 0h-2.25v-6.75h2.25v6.75zM12 10.125c-1.243 0-2.25-1.007-2.25-2.25S10.757 5.625 12 5.625s2.25 1.007 2.25 2.25s-1.007 2.25-2.25 2.25z" />
          </svg>
        ),
        text: "NPM",
        url: "https://www.npmjs.com/package/azurajs",
        external: true,
      },
    ],
  };
}
