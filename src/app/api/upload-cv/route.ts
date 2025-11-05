import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:5001";
  const target = `${base}/upload-cv`;

  try {
    // Get the form data from the request
    const formData = await request.formData();

    // Forward the request to the backend
    const resp = await fetch(target, {
      method: "POST",
      body: formData,
    });

    const raw = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const message =
        (raw && (raw.message || raw.error)) || `Upload failed (${resp.status})`;
      return NextResponse.json(
        { message, base, target, status: resp.status },
        { status: resp.status }
      );
    }

    return NextResponse.json(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload";
    return NextResponse.json({ message, base, target }, { status: 502 });
  }
}
