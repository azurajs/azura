import { getSource } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import type { ReactNode } from "react";
import { LanguageSaver } from "./language-saver";

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: "en" | "pt" }>;
}) {
  const { lang } = await params;
  const source = getSource(lang);

  return (
    <>
      <LanguageSaver lang={lang} />
      <DocsLayout tree={source.pageTree} {...baseOptions(lang)}>
        {children}
      </DocsLayout>
    </>
  );
}
