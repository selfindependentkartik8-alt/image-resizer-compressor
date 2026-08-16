"use client";

import { useRef, useState } from "react";

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<OutputFormat>("image/webp");
  const [lockRatio, setLockRatio] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";

    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1
    );

    return `${(bytes / Math.pow(1024, index)).toFixed(
      index === 0 ? 0 : 2
    )} ${units[index]}`;
  };

  const formatName = (type: OutputFormat) => {
    if (type === "image/jpeg") return "JPG";
    if (type === "image/png") return "PNG";
    return "WebP";
  };

  const loadImage = (selectedFile: File) => {
    setError("");
    setResultUrl("");
    setResultSize(0);

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError("Image size must be 25 MB or less.");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    const img = new Image();

    img.onload = () => {
      setFile(selectedFile);
      setPreview(objectUrl);
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError("Unable to read this image.");
    };

    img.src = objectUrl;
  };

  const handleWidthChange = (rawValue: string) => {
    const value = Math.max(1, Number(rawValue) || 1);

    if (!width || !height || !lockRatio) {
      setWidth(value);
      return;
    }

    const ratio = height / width;
    const newHeight = Math.max(
      1,
      Math.round(value * ratio)
    );

    setWidth(value);
    setHeight(newHeight);
  };

  const handleHeightChange = (rawValue: string) => {
    const value = Math.max(1, Number(rawValue) || 1);

    if (!width || !height || !lockRatio) {
      setHeight(value);
      return;
    }

    const ratio = width / height;
    const newWidth = Math.max(
      1,
      Math.round(value * ratio)
    );

    setHeight(value);
    setWidth(newWidth);
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      loadImage(selectedFile);
    }
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      loadImage(droppedFile);
    }
  };

const processImage = async () => {
  if (!file) {
    setError("Please upload an image first.");
    return;
  }

  let finalWidth = Math.max(1, Math.round(width));
  let finalHeight = Math.max(1, Math.round(height));

  if (!finalWidth || !finalHeight) {
    setError("Please enter valid image dimensions.");
    return;
  }

  setProcessing(true);
  setError("");

  try {
    const img = new Image();
    const sourceUrl = URL.createObjectURL(file);

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () =>
        reject(new Error("Unable to load image."));
      img.src = sourceUrl;
    });

    const createBlob = (
      targetWidth: number,
      targetHeight: number,
      targetQuality: number
    ): Promise<Blob | null> => {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");

        canvas.width = Math.max(1, Math.round(targetWidth));
        canvas.height = Math.max(1, Math.round(targetHeight));

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height
        );

        canvas.toBlob(
          (blob) => resolve(blob),
          format,
          format === "image/png"
            ? undefined
            : targetQuality
        );
      });
    };

    let bestBlob: Blob | null = null;

    // PNG doesn't have a normal quality slider.
    // Still make sure the result isn't unnecessarily huge.
    if (format === "image/png") {
      bestBlob = await createBlob(
        finalWidth,
        finalHeight,
        1
      );

      if (bestBlob && bestBlob.size > file.size) {
        let scale = 0.9;

        while (
          bestBlob &&
          bestBlob.size > file.size &&
          scale >= 0.4
        ) {
          finalWidth = Math.max(
            1,
            Math.floor(finalWidth * scale)
          );

          finalHeight = Math.max(
            1,
            Math.floor(finalHeight * scale)
          );

          bestBlob = await createBlob(
            finalWidth,
            finalHeight,
            1
          );

          scale -= 0.1;
        }
      }
    } else {
      // First try the user's selected quality.
      bestBlob = await createBlob(
        finalWidth,
        finalHeight,
        quality / 100
      );

      // Automatically reduce quality if output is larger.
      let currentQuality = quality / 100;

      while (
        bestBlob &&
        bestBlob.size > file.size &&
        currentQuality > 0.1
      ) {
        currentQuality -= 0.1;

        bestBlob = await createBlob(
          finalWidth,
          finalHeight,
          currentQuality
        );
      }

      // If quality alone isn't enough,
      // reduce dimensions gradually.
      let scale = 0.95;

      while (
        bestBlob &&
        bestBlob.size > file.size &&
        scale >= 0.5
      ) {
        finalWidth = Math.max(
          1,
          Math.floor(finalWidth * scale)
        );

        finalHeight = Math.max(
          1,
          Math.floor(finalHeight * scale)
        );

        bestBlob = await createBlob(
          finalWidth,
          finalHeight,
          0.7
        );

        scale -= 0.05;
      }
    }

    URL.revokeObjectURL(sourceUrl);

    if (!bestBlob) {
      throw new Error(
        "Unable to compress the image."
      );
    }

    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }

    const outputUrl =
      URL.createObjectURL(bestBlob);

    setWidth(finalWidth);
    setHeight(finalHeight);

    setResultUrl(outputUrl);
    setResultSize(bestBlob.size);

  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to process image."
    );
  } finally {
    setProcessing(false);
  }
};

  const downloadImage = () => {
    if (!resultUrl || !file) return;

    const extension =
      format === "image/jpeg"
        ? "jpg"
        : format === "image/png"
        ? "png"
        : "webp";

    const originalName = file.name.replace(
      /\.[^/.]+$/,
      ""
    );

    const link = document.createElement("a");

    link.href = resultUrl;
    link.download = `${originalName}-optimized.${extension}`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const resetTool = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }

    setFile(null);
    setPreview("");
    setResultUrl("");
    setResultSize(0);
    setWidth(0);
    setHeight(0);
    setQuality(80);
    setFormat("image/webp");
    setLockRatio(true);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const reduction =
    file && resultSize
      ? Math.max(
          0,
          Math.round(
            ((file.size - resultSize) / file.size) * 100
          )
        )
      : 0;

  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[#303030] via-[#111111] to-black text-white">

      {/* Background */}

      <div className="pointer-events-none absolute left-1/2 top-[-230px] h-[600px] w-[850px] max-w-[100vw] -translate-x-1/2 rounded-full bg-white/[0.08] blur-[160px]" />

      <div className="pointer-events-none absolute left-[-180px] top-[45%] h-[350px] w-[350px] rounded-full bg-white/[0.035] blur-[140px]" />

      <div className="pointer-events-none absolute right-[-180px] top-[60%] h-[350px] w-[350px] rounded-full bg-white/[0.035] blur-[140px]" />

      {/* Navbar */}

      <nav className="relative z-20 mx-4 mt-5 rounded-3xl border border-white/10 bg-black/70 px-4 py-4 shadow-2xl backdrop-blur-2xl sm:mx-auto sm:max-w-6xl sm:px-6">

        <div className="flex items-center justify-between gap-4">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10">
              <img
                src="/logo.png"
                alt="KrishAIWorks"
                className="h-full w-full rounded-full object-cover"
              />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold sm:text-base">
                KrishAIWorks
              </h2>

              <p className="text-[10px] text-zinc-500 sm:text-xs">
                AI Solutions That Work
              </p>
            </div>

          </div>

          <div className="hidden items-center gap-7 text-sm text-zinc-300 md:flex">

            <a
              href="#home"
              className="transition hover:text-white"
            >
              Home
            </a>

            <a
              href="#features"
              className="transition hover:text-white"
            >
              Features
            </a>

            <a
              href="#how"
              className="transition hover:text-white"
            >
              How To Use
            </a>

            <a
              href="#faq"
              className="transition hover:text-white"
            >
              FAQ
            </a>

            <a
              href="https://www.instagram.com/krishaiworks/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-zinc-200 px-5 py-2 font-medium text-black transition hover:bg-white"
            >
              Follow
            </a>

          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs text-zinc-300 md:hidden"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>

        </div>

      </nav>

      {/* Mobile Menu */}

      {menuOpen && (
        <div className="relative z-30 mx-4 mt-2 rounded-3xl border border-white/10 bg-black/95 p-4 backdrop-blur-xl md:hidden">

          <div className="flex flex-col gap-1">

            {[
              ["#home", "Home"],
              ["#features", "Features"],
              ["#how", "How To Use"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                {label}
              </a>
            ))}

            <a
              href="https://www.instagram.com/krishaiworks/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 rounded-2xl bg-zinc-200 px-4 py-3 text-center text-sm font-semibold text-black"
            >
              Follow
            </a>

          </div>

        </div>
      )}

      {/* Hero */}

      <section
        id="home"
        className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-8 sm:pt-24"
      >

        <div className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs text-zinc-200">
          🖼️ Image Resizer & Compressor
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          Built by{" "}
          <span className="font-semibold text-zinc-200">
            KrishAIWorks
          </span>
        </p>

        <h1 className="mt-7 max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
          Resize & Compress
          <br />

          <span className="bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
            Images Effortlessly.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base sm:leading-8">
          Resize your images, reduce file size and convert
          formats directly in your browser.
          <br />
          Your images never leave your device.
        </p>

        <div className="mt-7 flex max-w-full flex-wrap justify-center gap-3">

          <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-zinc-300">
            🔒 Private
          </span>

          <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-zinc-300">
            ⚡ Browser Based
          </span>

          <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-zinc-300">
            📦 JPG • PNG • WebP
          </span>

        </div>

        {/* Generator */}

        <div className="mt-12 w-full max-w-5xl">

          <div className="rounded-[2rem] border border-white/10 bg-black/65 p-4 text-left shadow-2xl backdrop-blur-2xl sm:p-7">

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Image Optimizer
            </p>

            <h2 className="mt-3 text-lg font-semibold sm:text-xl">
              Upload an image to get started.
            </h2>

            <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
              Maximum file size: 25 MB.
            </p>

            {/* Upload */}

            {!file && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className={`mt-7 flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed px-5 py-10 text-center transition ${
                  dragging
                    ? "border-white/50 bg-white/[0.09]"
                    : "border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]"
                }`}
              >

                <span className="text-5xl">
                  🖼️
                </span>

                <span className="mt-5 text-sm font-semibold text-white">
                  Drop your image here
                </span>

                <span className="mt-2 text-xs text-zinc-500">
                  or click to browse
                </span>

                <span className="mt-4 text-[11px] text-zinc-600">
                  JPG, PNG, WebP and other common image formats
                </span>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

              </div>
            )}

            {/* Editor */}

            {file && (
              <div className="mt-7 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">

                {/* Preview */}

                <div className="rounded-3xl border border-white/5 bg-zinc-950 p-4">

                  <div className="flex items-center justify-between gap-3">

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Original Image
                      </p>

                      <p className="mt-1 max-w-[250px] truncate text-sm text-zinc-500">
                        {file.name}
                      </p>
                    </div>

                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-zinc-400">
                      {formatBytes(file.size)}
                    </span>

                  </div>

                  <div className="mt-4 flex min-h-[300px] items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-black p-4">

                    <img
                      src={preview}
                      alt="Original preview"
                      className="max-h-[430px] max-w-full object-contain"
                    />

                  </div>

                </div>

                {/* Controls */}

                <div className="rounded-3xl border border-white/5 bg-zinc-950 p-5">

                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                    ⚙️ Resize & Compress
                  </h3>

                  {/* Width */}

                  <div className="mt-6">

                    <label className="mb-2 block text-xs font-medium text-zinc-400">
                      Width
                    </label>

                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={Math.max(1, width)}
                      onChange={(e) =>
                        handleWidthChange(e.target.value)
                      }
                      className="h-12 w-full rounded-xl border border-white/10 bg-black px-4 text-sm text-white outline-none transition focus:border-white/40"
                    />

                  </div>

                  {/* Lock */}

                  <button
                    type="button"
                    onClick={() =>
                      setLockRatio(!lockRatio)
                    }
                    className={`mt-3 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-xs transition ${
                      lockRatio
                        ? "border-white/20 bg-white/[0.08] text-white"
                        : "border-white/5 bg-black text-zinc-500"
                    }`}
                  >

                    <span>
                      🔗 Lock aspect ratio
                    </span>

                    <span className="font-semibold">
                      {lockRatio ? "ON" : "OFF"}
                    </span>

                  </button>

                  {/* Height */}

                  <div className="mt-4">

                    <label className="mb-2 block text-xs font-medium text-zinc-400">
                      Height
                    </label>

                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={Math.max(1, height)}
                      onChange={(e) =>
                        handleHeightChange(e.target.value)
                      }
                      className="h-12 w-full rounded-xl border border-white/10 bg-black px-4 text-sm text-white outline-none transition focus:border-white/40"
                    />

                  </div>

                  {/* Quality */}

                  <div className="mt-5">

                    <div className="flex items-center justify-between">

                      <label className="text-xs font-medium text-zinc-400">
                        Compression Quality
                      </label>

                      <span className="text-xs font-semibold text-white">
                        {quality}%
                      </span>

                    </div>

                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={quality}
                      onChange={(e) =>
                        setQuality(
                          Number(e.target.value)
                        )
                      }
                      className="mt-3 w-full accent-white"
                      disabled={format === "image/png"}
                    />

                    {format === "image/png" && (
                      <p className="mt-2 text-[11px] text-zinc-600">
                        PNG does not use JPEG/WebP quality compression.
                      </p>
                    )}

                  </div>

                  {/* Format */}

                  <div className="mt-5">

                    <label className="mb-2 block text-xs font-medium text-zinc-400">
                      Output Format
                    </label>

                    <select
                      value={format}
                      onChange={(e) =>
                        setFormat(
                          e.target.value as OutputFormat
                        )
                      }
                      className="h-12 w-full rounded-xl border border-white/10 bg-black px-4 text-sm text-white outline-none focus:border-white/40"
                    >

                      <option value="image/webp">
                        WebP — Recommended
                      </option>

                      <option value="image/jpeg">
                        JPG
                      </option>

                      <option value="image/png">
                        PNG
                      </option>

                    </select>

                  </div>

                  {/* Process */}

                  <button
                    type="button"
                    onClick={processImage}
                    disabled={processing}
                    className="mt-6 w-full rounded-2xl bg-zinc-200 px-5 py-4 text-sm font-semibold text-black shadow-xl shadow-black/30 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {processing
                      ? "⚙️ Processing Image..."
                      : "✨ Resize & Compress"}

                  </button>

                  {/* Reset */}

                  <button
                    type="button"
                    onClick={resetTool}
                    className="mt-3 w-full rounded-xl py-3 text-xs text-zinc-600 transition hover:text-zinc-300"
                  >
                    ↻ Start Over
                  </button>

                </div>

              </div>
            )}

            {/* Error */}

            {error && (
              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-300">
                ⚠️ {error}
              </div>
            )}

            {/* Result */}

            {resultUrl && (
              <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-950 p-5 sm:p-7">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Optimized Result
                    </p>

                    <h3 className="mt-2 text-2xl font-bold">
                      Your Image Is Ready.
                    </h3>

                  </div>

                  <button
                    type="button"
                    onClick={downloadImage}
                    className="rounded-xl bg-zinc-200 px-5 py-3 text-sm font-semibold text-black transition hover:bg-white"
                  >
                    ⬇️ Download {formatName(format)}
                  </button>

                </div>

                {/* Stats */}

                <div className="mt-7 grid gap-3 sm:grid-cols-3">

                  <div className="rounded-2xl border border-white/5 bg-black p-4">

                    <p className="text-[11px] uppercase tracking-wider text-zinc-600">
                      Original Size
                    </p>

                    <p className="mt-2 text-lg font-bold text-white">
                      {formatBytes(file?.size || 0)}
                    </p>

                  </div>

                  <div className="rounded-2xl border border-white/5 bg-black p-4">

                    <p className="text-[11px] uppercase tracking-wider text-zinc-600">
                      New Size
                    </p>

                    <p className="mt-2 text-lg font-bold text-white">
                      {formatBytes(resultSize)}
                    </p>

                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">

                    <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                      Size Reduction
                    </p>

                    <p className="mt-2 text-lg font-bold text-white">
                      {reduction}%
                    </p>

                  </div>

                </div>

                {/* Result Preview */}

                <div className="mt-7">

                  <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                    🖼️ Optimized Preview
                  </h4>

                  <div className="mt-4 flex min-h-[280px] items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-black p-4">

                    <img
                      src={resultUrl}
                      alt="Optimized result"
                      className="max-h-[420px] max-w-full object-contain"
                    />

                  </div>

                </div>

              </div>
            )}

            <p className="mt-4 text-xs text-zinc-600">
              🔒 Images are processed locally in your browser and
              are never uploaded to our servers.
            </p>

          </div>

        </div>

      </section>

      {/* Features */}

      <section
        id="features"
        className="relative z-10 mx-auto max-w-6xl px-4 py-20 sm:px-8"
      >

        <div className="grid gap-5 md:grid-cols-3">

          {[
            [
              "⚡",
              "Fast Processing",
              "Resize and compress images directly in your browser."
            ],
            [
              "🔒",
              "Private By Design",
              "Your images never need to leave your device."
            ],
            [
              "📦",
              "Multiple Formats",
              "Export optimized images as JPG, PNG or WebP."
            ],
          ].map(([icon, title, description]) => (

            <div
              key={title}
              className="rounded-3xl border border-white/5 bg-black/60 p-6 backdrop-blur-xl"
            >

              <div className="text-3xl">
                {icon}
              </div>

              <h3 className="mt-5 text-base font-bold">
                {title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-zinc-500">
                {description}
              </p>

            </div>

          ))}

        </div>

      </section>

      {/* How To */}

      <section
        id="how"
        className="relative z-10 mx-auto max-w-6xl px-4 py-20 sm:px-8"
      >

        <div className="text-center">

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            How To Use
          </p>

          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Optimize images in three steps.
          </h2>

        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">

          {[
            [
              "01",
              "Upload",
              "Choose an image from your device or drag it into the tool."
            ],
            [
              "02",
              "Customize",
              "Set dimensions, quality and output format."
            ],
            [
              "03",
              "Download",
              "Download your optimized image instantly."
            ],
          ].map(([number, title, description]) => (

            <div
              key={number}
              className="rounded-3xl border border-white/5 bg-black/60 p-6"
            >

              <span className="text-sm font-bold text-zinc-300">
                {number}
              </span>

              <h3 className="mt-5 text-lg font-bold">
                {title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-zinc-500">
                {description}
              </p>

            </div>

          ))}

        </div>

      </section>

      {/* FAQ */}

      <section
        id="faq"
        className="relative z-10 mx-auto max-w-4xl px-4 py-20 sm:px-8"
      >

        <div className="text-center">

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            FAQ
          </p>

          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Frequently Asked Questions
          </h2>

        </div>

        <div className="mt-10 space-y-4">

          {[
            [
              "Are my images uploaded to a server?",
              "No. Image processing happens locally in your browser."
            ],
            [
              "Which formats can I export?",
              "You can export your processed image as WebP, JPG or PNG."
            ],
            [
              "Can I keep the original aspect ratio?",
              "Yes. Keep Lock Aspect Ratio enabled while changing width or height."
            ],
            [
              "Does PNG use the quality slider?",
              "No. PNG does not use the same quality setting as JPG and WebP."
            ],
          ].map(([question, answer]) => (

            <div
              key={question}
              className="rounded-3xl border border-white/5 bg-black/60 p-6"
            >

              <h3 className="text-sm font-bold">
                {question}
              </h3>

              <p className="mt-3 text-sm leading-7 text-zinc-500">
                {answer}
              </p>

            </div>

          ))}

        </div>

      </section>

      {/* Footer */}

      <footer className="relative z-10 border-t border-white/5 px-4 py-10">

        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/10">
              <img
                src="/logo.png"
                alt="KrishAIWorks"
                className="h-full w-full rounded-full object-cover"
              />
            </div>

            <div>

              <p className="text-sm font-bold">
                KrishAIWorks
              </p>

              <p className="text-xs text-zinc-600">
                AI Solutions That Work
              </p>

            </div>

          </div>

          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} KrishAIWorks. All rights reserved.
          </p>

        </div>

      </footer>

    </main>
  );
}