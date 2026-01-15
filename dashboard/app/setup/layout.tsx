import type { Metadata } from "next";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Setup Wizard - ${brand.name}`,
  description: `Configure integrations for your ${brand.name} Dashboard`,
};

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <header className="py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl shadow-lg">
              N
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{brand.name}</h1>
          </div>
          <p className="text-muted-foreground">
            Integration Setup Wizard
          </p>
        </header>

        {/* Main Content */}
        <main className="pb-12">
          {children}
        </main>

        {/* Footer */}
        <footer className="py-6 text-center text-sm text-muted-foreground border-t">
          <p>
            Need help? Click the &quot;I need help&quot; button on any step, and Claude will assist you.
          </p>
        </footer>
      </div>
    </div>
  );
}
