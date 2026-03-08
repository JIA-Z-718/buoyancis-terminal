import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Pilcrow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const MenuButton = ({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <Toggle
    size="sm"
    pressed={isActive}
    onPressedChange={onClick}
    disabled={disabled}
    title={title}
    className="h-8 w-8 p-0 data-[state=on]:bg-accent"
  >
    {children}
  </Toggle>
);

const ToolbarDivider = () => (
  <Separator orientation="vertical" className="mx-1 h-6" />
);

interface LinkPopoverProps {
  editor: Editor;
}

const LinkPopover = ({ editor }: LinkPopoverProps) => {
  const [url, setUrl] = useState("");
  const [open, setOpen] = useState(false);

  const handleSetLink = () => {
    if (url.trim()) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url.trim() })
        .run();
    }
    setUrl("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Toggle
          size="sm"
          pressed={editor.isActive("link")}
          className="h-8 w-8 p-0 data-[state=on]:bg-accent"
          title="Add link"
        >
          <LinkIcon className="h-4 w-4" />
        </Toggle>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <Label htmlFor="link-url">Link URL</Label>
          <Input
            id="link-url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSetLink();
              }
            }}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUrl("");
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSetLink}>
              Add Link
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface ImagePopoverProps {
  editor: Editor;
}

const ImagePopover = ({ editor }: ImagePopoverProps) => {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [open, setOpen] = useState(false);

  const handleAddImage = () => {
    if (url.trim()) {
      editor
        .chain()
        .focus()
        .setImage({ src: url.trim(), alt: alt.trim() || undefined })
        .run();
    }
    setUrl("");
    setAlt("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Toggle
          size="sm"
          className="h-8 w-8 p-0"
          title="Add image"
        >
          <ImageIcon className="h-4 w-4" />
        </Toggle>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="image-url">Image URL</Label>
            <Input
              id="image-url"
              placeholder="https://example.com/image.jpg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image-alt">Alt text (optional)</Label>
            <Input
              id="image-alt"
              placeholder="Image description"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUrl("");
                setAlt("");
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddImage}>
              Add Image
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30 rounded-t-md">
      {/* Text formatting */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="Inline code"
      >
        <Code className="h-4 w-4" />
      </MenuButton>

      <ToolbarDivider />

      {/* Headings */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().setParagraph().run()}
        isActive={editor.isActive("paragraph")}
        title="Paragraph"
      >
        <Pilcrow className="h-4 w-4" />
      </MenuButton>

      <ToolbarDivider />

      {/* Lists */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Bullet list"
      >
        <List className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Numbered list"
      >
        <ListOrdered className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal rule"
      >
        <Minus className="h-4 w-4" />
      </MenuButton>

      <ToolbarDivider />

      {/* Links and Images */}
      <LinkPopover editor={editor} />
      <MenuButton
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive("link")}
        title="Remove link"
      >
        <Unlink className="h-4 w-4" />
      </MenuButton>
      <ImagePopover editor={editor} />

      <ToolbarDivider />

      {/* Undo/Redo */}
      <MenuButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo className="h-4 w-4" />
      </MenuButton>
    </div>
  );
};

const RichTextEditor = ({
  content,
  onChange,
  placeholder = "Start writing...",
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-md my-4",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[400px] px-4 py-3",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync content from parent if it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="border border-input rounded-md overflow-hidden bg-background">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
