import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProductTutorialHost } from "@/components/onboarding/product-tutorial";
import { siteUrl } from "@/lib/site-url";

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

const TITLE = "G KONG — Performance e Gestão de Treinos";
const DESCRIPTION = "Plataforma de treinos para personal trainers, alunos acompanhados e atletas independentes criarem fichas, explorarem exercícios e acompanharem sua rotina.";

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: TITLE,
    template: "%s | G KONG",
  },
  description: DESCRIPTION,
  keywords: ["personal trainer", "gestão de treinos", "montar ficha de treino", "exercícios com demonstração", "academia"],
  applicationName: "G KONG",
  alternates: { canonical: "/" },
  // Os ícones vêm de src/app/favicon.ico, icon e apple-icon. Não use o logo
  // JPG como favicon, porque ele é muito maior do que os arquivos dedicados.
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "G KONG",
    title: "G KONG — Força na gestão. Foco no resultado.",
    description: "Gestão profissional e treino independente com anatomia, demonstrações e fichas em PDF.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "G KONG — Performance System" }],
  },
  twitter: { card: "summary_large_image", title: "G KONG — Performance System", description: "Gestão profissional e fichas independentes com exercícios demonstrados.", images: ["/opengraph-image"] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <ProductTutorialHost />
              {children}
              {/*
                O aviso nasce onde a ação acontece: no celular o polegar está
                embaixo, e o canto superior direito era o ponto mais distante
                dele. A margem inferior maior livra a navegação fixa.
              */}
              <Toaster
                richColors
                position="bottom-center"
                mobileOffset={{ bottom: '5.5rem', left: '0.75rem', right: '0.75rem' }}
              />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
