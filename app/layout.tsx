import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";

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

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://krishaiworks.com/#organization",
      name: "KrishAIWorks",
      url: "https://krishaiworks.com",
      logo: {
        "@type": "ImageObject",
        url: "https://krishaiworks.com/logo.png",
        width: 512,
        height: 512,
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://krishaiworks.com/#website",
      url: "https://krishaiworks.com",
      name: "KrishAIWorks",
      description:
        "AI-powered tools, productivity utilities, automation, chatbots, websites and custom digital solutions.",
      publisher: {
        "@id": "https://krishaiworks.com/#organization",
      },
      inLanguage: "en",
    },
    {
      "@type": "WebApplication",
      "@id":
        "https://imageresizercompressor.krishaiworks.com/#webapplication",
      name: "Image Resizer & Compressor",
      url: "https://imageresizercompressor.krishaiworks.com/",
      description:
        "Resize and compress images online quickly and easily. Reduce image file size and change image dimensions with the free Image Resizer & Compressor by KrishAIWorks.",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires a modern web browser.",
      isPartOf: {
        "@id": "https://krishaiworks.com/#website",
      },
      publisher: {
        "@id": "https://krishaiworks.com/#organization",
      },
    },
    {
      "@type": "WebPage",
      "@id":
        "https://imageresizercompressor.krishaiworks.com/#webpage",
      url: "https://imageresizercompressor.krishaiworks.com/",
      name:
        "Image Resizer & Compressor | Resize and Compress Images Online",
      description:
        "Resize and compress images online quickly and easily. Reduce image file size and change image dimensions with the free Image Resizer & Compressor by KrishAIWorks.",
      isPartOf: {
        "@id": "https://krishaiworks.com/#website",
      },
      about: {
        "@id":
          "https://imageresizercompressor.krishaiworks.com/#webapplication",
      },
      inLanguage: "en",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-BS6TSMM1ZR"
          strategy="lazyOnload"
        />

        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-BS6TSMM1ZR');
          `}
        </Script>
      </body>
    </html>
  );
}