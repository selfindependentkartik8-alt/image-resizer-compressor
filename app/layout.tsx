import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://imageresizercompressor.krishaiworks.com"
  ),

  title: "Image Resizer & Compressor | Resize and Compress Images Online",

  description:
    "Resize and compress images online quickly and easily. Reduce image file size and change image dimensions with the free Image Resizer & Compressor by KrishAIWorks.",

  keywords: [
    "Image Resizer",
    "Image Compressor",
    "Image Resizer and Compressor",
    "Resize Image Online",
    "Compress Image Online",
    "Image Size Reducer",
    "Reduce Image Size",
    "Resize and Compress Images",
    "Free Image Compressor",
    "Online Image Resizer",
  ],

  authors: [
    {
      name: "KrishAIWorks",
      url: "https://krishaiworks.vercel.app",
    },
  ],

  creator: "KrishAIWorks",
  publisher: "KrishAIWorks",

  alternates: {
    canonical:
      "https://imageresizercompressor.krishaiworks.com/",
  },

  openGraph: {
    title:
      "Image Resizer & Compressor | KrishAIWorks",
    description:
      "Resize images and reduce their file size online quickly and easily with KrishAIWorks.",
    url: "https://imageresizercompressor.krishaiworks.com/",
    siteName: "KrishAIWorks",
    type: "website",
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Image Resizer & Compressor | KrishAIWorks",
    description:
      "Resize and compress images online quickly and easily.",
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}