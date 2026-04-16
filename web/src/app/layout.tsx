import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { getThemeBootstrapScript } from "@/lib/theme/bootstrap-script";
import { getServerTheme } from "@/lib/theme/server-theme";
import "./globals.css";

const ibm = IBM_Plex_Sans({
  variable: "--font-ibm",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PolarisCRM",
  description: "MVP PolarisCRM — Next.js App Router",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const serverTheme = await getServerTheme();

  return (
    <html lang="pt-BR" data-theme={serverTheme} suppressHydrationWarning>
      <body
        className={`${ibm.variable} min-h-screen font-sans antialiased`}
        suppressHydrationWarning
      >
        <Script
          id="polaris-theme-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: getThemeBootstrapScript() }}
        />
        <ThemeProvider initialTheme={serverTheme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
