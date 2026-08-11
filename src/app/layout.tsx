import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SITE_URL } from "@/lib/site";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "G KONG — Performance e Gestão de Treinos",
    template: "%s | G KONG",
  },
  description: "Plataforma profissional para personal trainers gerenciarem alunos, treinos, evolução física e desempenho.",
  keywords: ["personal trainer", "gestão de treinos", "fichas de treino", "evolução física", "academia"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "G KONG",
    title: "G KONG — Força na gestão. Foco no resultado.",
    description: "Gestão profissional de alunos, fichas de treino e evolução física com acesso simples por código.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "G KONG — Performance System" }],
  },
  twitter: { card: "summary_large_image", title: "G KONG — Performance System", description: "Gestão de treinos com acesso simples e evolução visível.", images: ["/opengraph-image"] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              {children}
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
