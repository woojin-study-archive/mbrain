import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;

  return {
    title: "악성재고 예방 관제실 | 현대백화점",
    description: "현대백화점 AI 악성재고 사전예측 및 실질 마진 최적화 PoC",
    openGraph: {
      title: "악성재고 예방 관제실",
      description: "지점 이동·노출·할인·반품 전략의 실질 마진을 비교하는 현대백화점 재고 의사결정 PoC",
      type: "website",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: "악성재고 예방 관제실" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "악성재고 예방 관제실",
      description: "현대백화점 AI 악성재고 사전예측 및 실질 마진 최적화 PoC",
      images: [imageUrl],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
