import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { TooltipProvider } from "@/components/ui/tooltip";
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

const TITLE = "D KONG — Performance e Gestão de Treinos";
const DESCRIPTION = "Plataforma profissional para personal trainers gerenciarem alunos, treinos, evolução física e desempenho. O aluno entra com o nome e um código de seis números — sem e-mail e sem senha.";

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["personal trainer", "gestão de treinos", "fichas de treino", "evolução física", "academia"],
  applicationName: "D KONG",
  // O ícone vem de src/app/favicon.ico, icon e apple-icon. Declarar o logo
  // JPG aqui servia 158 KB como favicon.
  openGraph: {
    type: "website",
    siteName: "D KONG",
    locale: "pt_BR",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
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
