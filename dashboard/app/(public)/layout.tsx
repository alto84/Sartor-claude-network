import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${brand.name} - ${brand.tagline}`,
  description: brand.story.long,
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {children}
      <Toaster />
    </div>
  );
}
