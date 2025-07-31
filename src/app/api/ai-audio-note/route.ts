import { GoogleGenAI, Type, createUserContent, createPartFromUri } from "@google/genai";

// Helper to read a Blob/File into base64 string
async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  // Convert ArrayBuffer to base64
  let binary = "";
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
}

export async function POST(request: Request) {
  try {
    const ai = new GoogleGenAI({});

    // Parse multipart/form-data
    const form = await request.formData();
    const file = form.get("audio") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "Missing 'audio' file field in form-data." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Accept common webm/opus or other audio mime types from browsers
    const mimeType = file.type || "audio/webm";
    const size = file.size || 0;

    // Strategy: if >= ~18MB, upload via Files API, else inline base64
    const INLINE_LIMIT_BYTES = 18 * 1024 * 1024;

    let contents;
    if (size >= INLINE_LIMIT_BYTES) {
      // Files API upload path
      const uploaded = await ai.files.upload({
        // @ts-ignore SDK expects a file path or Blob in Node; in Next runtime, File should be acceptable
        file,
        config: { mimeType: mimeType || "audio/webm" },
      });

      contents = createUserContent([
        createPartFromUri(uploaded.uri as string, (uploaded as any).mimeType || mimeType || "audio/webm"),
        {
          text:
            "Transcribe the audio and then synthesize a concise note.\n" +
            "Return JSON strictly matching this schema fields (the model is configured for JSON):\n" +
            "- title: A concise, descriptive title capturing the core topic, maximum 50 characters.\n" +
            "- content: A clean, coherent summary of the main points.\n",
        },
      ]);
    } else {
      // Inline base64 path
      const base64 = await blobToBase64(file);
      contents = [
        { role: "user", parts: [{ text: "Transcribe the audio and create a concise note." }] },
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64,
              },
            },
            {
              text:
                "Produce a JSON response with two fields: 'title' (≤ 50 chars) capturing the core topic, and 'content' as a clean, coherent summary.",
            },
          ],
        },
      ];
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
          },
          required: ["title", "content"],
          propertyOrdering: ["title", "content"],
        },
      },
    });

    const text = response.text || "";
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: "AI did not return valid JSON.",
          details: text?.slice(0, 500),
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
    const content = typeof parsed.content === "string" ? parsed.content.trim() : "";

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: "AI response missing required fields 'title' and/or 'content'." }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Soft-guard title length
    const finalTitle = title.length > 50 ? title.slice(0, 50) : title;

    return new Response(JSON.stringify({ title: finalTitle, content }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("POST /api/ai-audio-note error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
