"use client";

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Undo,
  Redo,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  disabled: boolean;
  submitting: boolean;
  onSubmit: (html: string, text: string) => void;
  userTask: string;
};

export function ResponseEditor({
  disabled,
  submitting,
  onSubmit,
  userTask,
}: Props): React.ReactElement {
  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[320px] px-5 py-4",
      },
    },
  });

  React.useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  const text = editor?.getText() ?? "";
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b bg-muted/30 px-5 py-3">
        <p className="text-xs text-muted-foreground">{userTask}</p>
      </div>

      <div className="flex items-center gap-1 border-b bg-background px-2 py-1.5">
        <ToolbarButton
          disabled={!editor || disabled}
          active={editor?.isActive("heading", { level: 2 }) ?? false}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
          aria-label="Heading"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          disabled={!editor || disabled}
          active={editor?.isActive("bold") ?? false}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          disabled={!editor || disabled}
          active={editor?.isActive("italic") ?? false}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="mx-1 h-4 w-px bg-border" />
        <ToolbarButton
          disabled={!editor || disabled}
          active={editor?.isActive("bulletList") ?? false}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          aria-label="Bullet list"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          disabled={!editor || disabled}
          active={editor?.isActive("orderedList") ?? false}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          aria-label="Numbered list"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          disabled={!editor || disabled}
          active={editor?.isActive("blockquote") ?? false}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          aria-label="Quote"
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="mx-1 h-4 w-px bg-border" />
        <ToolbarButton
          disabled={!editor || disabled || !editor?.can().undo()}
          onClick={() => editor?.chain().focus().undo().run()}
          aria-label="Undo"
        >
          <Undo className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          disabled={!editor || disabled || !editor?.can().redo()}
          onClick={() => editor?.chain().focus().redo().run()}
          aria-label="Redo"
        >
          <Redo className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      <footer className="flex items-center justify-between gap-3 border-t bg-background px-4 py-3">
        <p className="text-xs text-muted-foreground tabular-nums">
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </p>
        <Button
          size="sm"
          disabled={disabled || submitting || wordCount < 5}
          onClick={() => {
            if (!editor) return;
            onSubmit(editor.getHTML(), editor.getText());
          }}
        >
          {submitting ? "Submitting…" : "Submit response"}
        </Button>
      </footer>
    </div>
  );
}

function ToolbarButton({
  active,
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
}): React.ReactElement {
  return (
    <button
      type="button"
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:pointer-events-none",
        active && "bg-accent text-foreground",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
