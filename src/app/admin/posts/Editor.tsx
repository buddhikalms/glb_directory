"use client";

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";

interface EditorProps {
  content?: string;
  onChange: (content: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function parseJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as any;
  } catch {
    return { error: text };
  }
}

export default function Editor({ content = "", onChange }: EditorProps) {
  const uploadImage = async (
    file: File,
    onProgress?: (event: { progress: number }) => void,
    abortSignal?: AbortSignal,
  ) => {
    if (!file) {
      throw new Error("No file provided.");
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File size exceeds 5MB limit.");
    }

    const payload = new FormData();
    payload.append("kind", "gallery");
    payload.append("file", file);

    const response = await fetch("/api/uploads/business-image", {
      method: "POST",
      body: payload,
      signal: abortSignal,
    });
    const data = await parseJsonSafe(response);
    if (!response.ok || !data?.url) {
      throw new Error(data?.error || "Image upload failed.");
    }

    onProgress?.({ progress: 100 });
    return data.url as string;
  };

  return (
    <div className="admin-simple-editor">
      <SimpleEditor
        content={content}
        onChange={onChange}
        uploadImage={uploadImage}
      />
      <style jsx global>{`
        .admin-simple-editor .simple-editor-wrapper {
          width: 100%;
          height: auto;
          min-height: 560px;
          overflow: visible;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          background: #ffffff;
        }

        .admin-simple-editor .simple-editor-content {
          max-width: 100%;
          min-height: 500px;
        }

        .admin-simple-editor .simple-editor-content .tiptap.ProseMirror.simple-editor {
          min-height: 460px;
          padding: 1.25rem 1.5rem 2rem;
        }

        .admin-simple-editor .simple-editor-content .tiptap.ProseMirror.simple-editor:focus {
          outline: 2px solid #10b981;
          outline-offset: 2px;
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
}
