"use client";

import { HomeLayout } from "fumadocs-ui/layouts/home";
import { useBaseOptions } from "@/lib/layout.client";
import { useEffect } from "react";
import { I18nProvider } from "fumadocs-ui/contexts/i18n";

export default function Layout({ children }: { children: React.ReactNode }) {
  const options = useBaseOptions();

  useEffect(() => {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";

    return () => {
      document.documentElement.style.colorScheme = "";
    };
  }, []);

  return (
    <I18nProvider locale="en" translations={{}}>
      <HomeLayout {...options}>{children}</HomeLayout>
    </I18nProvider>
  );
}
