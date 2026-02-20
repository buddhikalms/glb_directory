import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedMimeToExt: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

type UploadKind = "logo" | "cover" | "gallery";

function normalizeKind(value: FormDataEntryValue | null): UploadKind {
  if (value === "logo") return "logo";
  if (value === "gallery") return "gallery";
  return "cover";
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const fileEntry = formData.get("file");
    const kind = normalizeKind(formData.get("kind"));

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (fileEntry.size === 0) {
      return NextResponse.json({ error: "File is empty." }, { status: 400 });
    }

    if (fileEntry.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit." },
        { status: 400 },
      );
    }

    const extension = allowedMimeToExt[fileEntry.type];
    if (!extension) {
      return NextResponse.json(
        { error: "Unsupported file type. Use JPG, PNG, WEBP, or GIF." },
        { status: 400 },
      );
    }

    const folderSegment =
      kind === "logo" ? "logos" : kind === "gallery" ? "gallery" : "covers";
    const relativeDir = path.join("uploads", "businesses", folderSegment);
    const absoluteDir = path.join(process.cwd(), "public", relativeDir);

    await mkdir(absoluteDir, { recursive: true });

    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const absolutePath = path.join(absoluteDir, fileName);
    const buffer = Buffer.from(await fileEntry.arrayBuffer());

    await writeFile(absolutePath, buffer);

    return NextResponse.json(
      { url: `/${relativeDir.replace(/\\/g, "/")}/${fileName}` },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Image upload failed.",
      },
      { status: 500 },
    );
  }
}
