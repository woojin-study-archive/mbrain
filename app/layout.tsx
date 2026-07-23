import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;

  return {
    title: "재고 전략 관제실 | H·GROUP AI Inventory",
    description: "계열사 통합 AI 재고 소진 의사결정 플랫폼 PoC",
    openGraph: {
      title: "재고 전략 관제실",
      description: "계열사 통합 AI 재고 소진 의사결정 플랫폼",
      type: "website",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: "재고 전략 관제실" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "재고 전략 관제실",
      description: "계열사 통합 AI 재고 소진 의사결정 플랫폼",
      images: [imageUrl],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
