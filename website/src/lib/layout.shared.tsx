import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(lang?: string): BaseLayoutProps {
  const currentLang = lang || "en";

  return {
    githubUrl: "https://github.com/0xviny/azurajs",

    nav: {
      title: (
        <div className="flex items-center gap-2 font-bold">
          <div>
            <img src="logo.png" alt="AzuraJS Logo" className="h-16 w-auto" />
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
    ],
  };
}
