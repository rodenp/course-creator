import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useCourse } from "@/contexts/CourseContext";
import { useTranslation } from "@/i18n";
import type { ContentBlock, Course, Lesson, Module } from "@/types";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bold,
  BookOpen,
  Check,
  Edit,
  Eye,
  FileText,
  GripVertical,
  Image,
  Italic,
  Library,
  List,
  ListOrdered,
  MoreVertical,
  Move,
  Plus,
  Save,
  Trash2,
  Type,
  Underline,
  Upload,
  Video,
  Volume2,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface CourseEditorProps {
  courseId: string;
  onBack: () => void;
  onViewMode: () => void;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Fixed Rich Text Editor Component
function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const isUpdatingRef = useRef(false);

  const handleCommand = (command: string, commandValue?: string) => {
    if (!editorRef.current) return;

    // Save current selection
    const selection = window.getSelection();
    let range: Range | null = null;

    if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0).cloneRange();
    }

    // Execute command
    document.execCommand(command, false, commandValue);

    // Update content
    const newContent = editorRef.current.innerHTML;
    onChange(newContent);

    // Restore focus
    editorRef.current.focus();

    // Restore selection if possible
    if (range && selection) {
      try {
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        // Ignore range errors
      }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (isUpdatingRef.current) return;

    const target = e.target as HTMLDivElement;
    const newContent = target.innerHTML;
    onChange(newContent);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  // Only update innerHTML when value changes externally (not from user input)
  useEffect(() => {
    if (editorRef.current && !isFocused) {
      isUpdatingRef.current = true;
      editorRef.current.innerHTML = value || "";
      isUpdatingRef.current = false;
    }
  }, [value, isFocused]);

  return (
    <div
      className={`border rounded-lg ${className} ${isFocused ? "ring-2 ring-blue-500" : ""}`}
    >
      {/* Toolbar */}
      <div className="border-b p-3 flex flex-wrap gap-1 bg-gray-50">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleCommand("bold")}
          className="p-2 hover:bg-gray-200 rounded"
          title={t("editor.bold", "Bold")}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleCommand("italic")}
          className="p-2 hover:bg-gray-200 rounded"
          title={t("editor.italic", "Italic")}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleCommand("underline")}
          className="p-2 hover:bg-gray-200 rounded"
          title={t("editor.underline", "Underline")}
        >
          <Underline className="h-4 w-4" />
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleCommand("insertUnorderedList")}
          className="p-2 hover:bg-gray-200 rounded"
          title={t("editor.bulletList", "Bullet List")}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleCommand("insertOrderedList")}
          className="p-2 hover:bg-gray-200 rounded"
          title={t("editor.numberedList", "Numbered List")}
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleCommand("justifyLeft")}
          className="p-2 hover:bg-gray-200 rounded"
          title={t("editor.alignLeft", "Align Left")}
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleCommand("justifyCenter")}
          className="p-2 hover:bg-gray-200 rounded"
          title={t("editor.alignCenter", "Align Center")}
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleCommand("justifyRight")}
          className="p-2 hover:bg-gray-200 rounded"
          title={t("editor.alignRight", "Align Right")}
        >
          <AlignRight className="h-4 w-4" />
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <select
          onMouseDown={(e) => e.preventDefault()}
          onChange={(e) => {
            handleCommand("formatBlock", e.target.value);
            e.target.value = "";
          }}
          className="px-2 py-1 text-sm border rounded"
          value=""
        >
          <option value="">{t("editor.format", "Format")}</option>
          <option value="h1">{t("editor.heading1", "Heading 1")}</option>
          <option value="h2">{t("editor.heading2", "Heading 2")}</option>
          <option value="h3">{t("editor.heading3", "Heading 3")}</option>
          <option value="p">{t("editor.paragraph", "Paragraph")}</option>
        </select>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPaste={handlePaste}
        className="p-4 min-h-[200px] outline-none prose max-w-none"
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
        style={{
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}

// Editable text component for both lessons and modules
interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

function EditableText({
  value,
  onChange,
  className,
  placeholder = "Untitled",
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [hasChanged, setHasChanged] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
    setHasChanged(false);
  }, [value]);

  const handleSave = () => {
    const newValue = editValue.trim() || placeholder;
    onChange(newValue);
    setIsEditing(false);
    setHasChanged(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setHasChanged(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(value);
    setHasChanged(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    setHasChanged(newValue !== value);
  };

  const handleBlur = () => {
    if (!hasChanged) {
      setIsEditing(false);
      setEditValue(value);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 flex-1">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="h-6 text-sm"
        />
        {hasChanged && (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              className="h-6 w-6 p-0"
            >
              <Check className="h-3 w-3 text-green-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3 text-red-600" />
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <span
      className={`flex-1 truncate cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded ${className}`}
      onDoubleClick={handleDoubleClick}
      title="Double-click to edit"
    >
      {value}
    </span>
  );
}

// Enhanced content block editor
interface ContentBlockEditorProps {
  content: ContentBlock;
  onUpdate: (content: ContentBlock) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function ContentBlockEditor({
  content,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: ContentBlockEditorProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create a mock URL for demonstration
    const url = URL.createObjectURL(file);

    if (content.type === "image" && file.type.startsWith("image/")) {
      onUpdate({
        ...content,
        content: {
          type: "image",
          url,
          title:
            content.content.type === "image"
              ? content.content.title || file.name
              : file.name,
          caption:
            content.content.type === "image"
              ? content.content.caption || ""
              : "",
        },
      });
    } else if (content.type === "video" && file.type.startsWith("video/")) {
      onUpdate({
        ...content,
        content: {
          type: "video",
          url,
          title:
            content.content.type === "video"
              ? content.content.title || file.name
              : file.name,
          caption:
            content.content.type === "video"
              ? content.content.caption || ""
              : "",
        },
      });
    } else if (content.type === "audio" && file.type.startsWith("audio/")) {
      onUpdate({
        ...content,
        content: {
          type: "audio",
          url,
          title:
            content.content.type === "audio"
              ? content.content.title || file.name
              : file.name,
          caption:
            content.content.type === "audio"
              ? content.content.caption || ""
              : "",
        },
      });
    }
  };

  const renderEditor = () => {
    switch (content.type) {
      case "text":
        return (
          <RichTextEditor
            value={
              content.content.type === "text" ? content.content.content : ""
            }
            onChange={(newContent) =>
              onUpdate({
                ...content,
                content: { type: "text", content: newContent },
              })
            }
            placeholder={t("editor.enterText", "Enter your content here...")}
          />
        );

      case "image":
        return (
          <div className="space-y-4">
            {content.content.type === "image" && content.content.url ? (
              <div className="relative">
                <img
                  src={content.content.url}
                  alt={content.content.title || ""}
                  className="w-full max-h-96 object-cover rounded-lg"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-2 right-2"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {t("common.change", "Change")}
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">
                  {t("editor.uploadImage", "Click to upload an image")}
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder={t("editor.imageTitle", "Image title (optional)")}
                value={
                  content.content.type === "image"
                    ? content.content.title || ""
                    : ""
                }
                onChange={(e) =>
                  onUpdate({
                    ...content,
                    content: {
                      type: "image",
                      url:
                        content.content.type === "image"
                          ? content.content.url
                          : "",
                      title: e.target.value,
                      caption:
                        content.content.type === "image"
                          ? content.content.caption || ""
                          : "",
                    },
                  })
                }
              />
              <Input
                placeholder={t(
                  "editor.imageCaption",
                  "Image caption (optional)",
                )}
                value={
                  content.content.type === "image"
                    ? content.content.caption || ""
                    : ""
                }
                onChange={(e) =>
                  onUpdate({
                    ...content,
                    content: {
                      type: "image",
                      url:
                        content.content.type === "image"
                          ? content.content.url
                          : "",
                      title:
                        content.content.type === "image"
                          ? content.content.title || ""
                          : "",
                      caption: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        );

      case "video":
        return (
          <div className="space-y-4">
            {content.content.type === "video" && content.content.url ? (
              <div className="relative">
                <video
                  src={content.content.url}
                  controls
                  className="w-full max-h-96 rounded-lg"
                >
                  <track kind="captions" label="English" srcLang="en" />
                  Your browser does not support the video tag.
                </video>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-2 right-2"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {t("common.change", "Change")}
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400"
                onClick={() => fileInputRef.current?.click()}
              >
                <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">
                  {t("editor.uploadVideo", "Click to upload a video")}
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder={t("editor.videoTitle", "Video title (optional)")}
                value={
                  content.content.type === "video"
                    ? content.content.title || ""
                    : ""
                }
                onChange={(e) =>
                  onUpdate({
                    ...content,
                    content: {
                      type: "video",
                      url:
                        content.content.type === "video"
                          ? content.content.url
                          : "",
                      title: e.target.value,
                      caption:
                        content.content.type === "video"
                          ? content.content.caption || ""
                          : "",
                    },
                  })
                }
              />
              <Input
                placeholder={t(
                  "editor.videoCaption",
                  "Video caption (optional)",
                )}
                value={
                  content.content.type === "video"
                    ? content.content.caption || ""
                    : ""
                }
                onChange={(e) =>
                  onUpdate({
                    ...content,
                    content: {
                      type: "video",
                      url:
                        content.content.type === "video"
                          ? content.content.url
                          : "",
                      title:
                        content.content.type === "video"
                          ? content.content.title || ""
                          : "",
                      caption: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        );

      case "audio":
        return (
          <div className="space-y-4">
            {content.content.type === "audio" && content.content.url ? (
              <div className="relative p-4 bg-gray-50 rounded-lg">
                <audio src={content.content.url} controls className="w-full">
                  <track kind="captions" label="English" srcLang="en" />
                  Your browser does not support the audio tag.
                </audio>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-2 right-2"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {t("common.change", "Change")}
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400"
                onClick={() => fileInputRef.current?.click()}
              >
                <Volume2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">
                  {t("editor.uploadAudio", "Click to upload an audio file")}
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder={t("editor.audioTitle", "Audio title (optional)")}
                value={
                  content.content.type === "audio"
                    ? content.content.title || ""
                    : ""
                }
                onChange={(e) =>
                  onUpdate({
                    ...content,
                    content: {
                      type: "audio",
                      url:
                        content.content.type === "audio"
                          ? content.content.url
                          : "",
                      title: e.target.value,
                      caption:
                        content.content.type === "audio"
                          ? content.content.caption || ""
                          : "",
                    },
                  })
                }
              />
              <Input
                placeholder={t(
                  "editor.audioCaption",
                  "Audio caption (optional)",
                )}
                value={
                  content.content.type === "audio"
                    ? content.content.caption || ""
                    : ""
                }
                onChange={(e) =>
                  onUpdate({
                    ...content,
                    content: {
                      type: "audio",
                      url:
                        content.content.type === "audio"
                          ? content.content.url
                          : "",
                      title:
                        content.content.type === "audio"
                          ? content.content.title || ""
                          : "",
                      caption: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        );

      default:
        return (
          <div>
            {t("editor.unsupportedContent", "Unsupported content type")}
          </div>
        );
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
            {content.type === "text" && <Type className="h-4 w-4" />}
            {content.type === "image" && <Image className="h-4 w-4" />}
            {content.type === "video" && <Video className="h-4 w-4" />}
            {content.type === "audio" && <Volume2 className="h-4 w-4" />}
            <span className="font-medium capitalize">
              {t(`editor.${content.type}`, content.type)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="h-6 w-6 p-0"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="h-6 w-6 p-0"
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>{renderEditor()}</CardContent>
    </Card>
  );
}

// Lesson Library Modal Component
interface LessonLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLesson: (lesson: Lesson, moduleIndex: number) => void;
  modules: Module[];
}

function LessonLibraryModal({
  isOpen,
  onClose,
  onSelectLesson,
  modules,
}: LessonLibraryModalProps) {
  const { t } = useTranslation();
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);

  // Sample lesson templates
  const lessonTemplates: Lesson[] = [
    {
      id: "template-1",
      title: "Introduction Template",
      description: "A template for course introductions",
      content: [
        {
          id: "content-1",
          type: "text",
          content: {
            type: "text",
            content:
              "<h2>Welcome!</h2><p>This is an introduction lesson template. Use this to welcome students to your course and set expectations.</p>",
          },
          order: 1,
        },
      ],
      duration: 10,
      order: 1,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "template-2",
      title: "Quiz Template",
      description: "A template for creating quizzes",
      content: [
        {
          id: "content-2",
          type: "text",
          content: {
            type: "text",
            content:
              "<h2>Knowledge Check</h2><p>Test your understanding with these questions:</p><ol><li>Question 1</li><li>Question 2</li><li>Question 3</li></ol>",
          },
          order: 1,
        },
      ],
      duration: 15,
      order: 2,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "template-3",
      title: "Summary Template",
      description: "A template for lesson summaries",
      content: [
        {
          id: "content-3",
          type: "text",
          content: {
            type: "text",
            content:
              "<h2>Key Takeaways</h2><p>Here are the main points from this lesson:</p><ul><li>Key point 1</li><li>Key point 2</li><li>Key point 3</li></ul><p><strong>Next:</strong> Continue to the next lesson.</p>",
          },
          order: 1,
        },
      ],
      duration: 5,
      order: 3,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "template-4",
      title: "Video Lesson Template",
      description: "A template for video-based lessons",
      content: [
        {
          id: "content-4",
          type: "text",
          content: {
            type: "text",
            content:
              "<h2>Video Lesson</h2><p>Watch the video below and take notes on the key concepts discussed.</p><p><em>Video will be embedded here</em></p><h3>Discussion Questions:</h3><ul><li>What was the main topic?</li><li>How does this relate to previous lessons?</li></ul>",
          },
          order: 1,
        },
      ],
      duration: 20,
      order: 4,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "template-5",
      title: "Assignment Template",
      description: "A template for assignments and exercises",
      content: [
        {
          id: "content-5",
          type: "text",
          content: {
            type: "text",
            content:
              "<h2>Assignment</h2><h3>Objective:</h3><p>Complete the following task to practice what you've learned.</p><h3>Instructions:</h3><ol><li>Step 1</li><li>Step 2</li><li>Step 3</li></ol><h3>Deliverables:</h3><ul><li>Item 1</li><li>Item 2</li></ul><p><strong>Due Date:</strong> [Date]</p>",
          },
          order: 1,
        },
      ],
      duration: 30,
      order: 5,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const handleLibraryDragStart = (e: React.DragEvent, lesson: Lesson) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        ...lesson,
        sourceType: "library",
      }),
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleAddLesson = (lesson: Lesson) => {
    onSelectLesson(lesson, selectedModuleIndex);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex">
        {/* Library Content */}
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Library className="h-5 w-5 text-purple-600" />
                Lesson Library
              </h2>
              <p className="text-gray-600 text-sm">
                Drag lessons to modules or click to add
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {lessonTemplates.map((lesson) => (
              <div
                key={lesson.id}
                draggable
                onDragStart={(e) => handleLibraryDragStart(e, lesson)}
                className="border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors cursor-move rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <GripVertical className="h-4 w-4 text-purple-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-purple-900">
                      {lesson.title}
                    </h3>
                    <p className="text-sm text-purple-700 mb-2">
                      {lesson.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-purple-600">
                      <span>{lesson.duration} minutes</span>
                      <span>{lesson.content.length} content blocks</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddLesson(lesson)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Module Selector */}
        <div className="w-64 bg-gray-50 border-l p-4">
          <h3 className="font-medium mb-3 text-gray-900">Add to Module:</h3>
          <div className="space-y-2">
            {modules.map((module, index) => (
              <button
                key={module.id}
                onClick={() => setSelectedModuleIndex(index)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedModuleIndex === index
                    ? "bg-blue-100 border-blue-300 text-blue-900"
                    : "bg-white border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div className="font-medium text-sm">{module.title}</div>
                <div className="text-xs text-gray-500">
                  {module.lessons.length} lessons
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Drag and drop types
type DragItem = {
  type: "module" | "lesson";
  id: string;
  moduleIndex?: number;
  lessonIndex?: number;
};

export function CourseEditor({
  courseId,
  onBack,
  onViewMode,
}: CourseEditorProps) {
  const { loadCourse, currentCourse, updateCourse } = useCourse();
  const { t } = useTranslation();
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [showLessonLibrary, setShowLessonLibrary] = useState(false);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<{
    moduleIndex?: number;
    lessonIndex?: number;
  } | null>(null);
  const hasInitializedLesson = useRef(false);

  useEffect(() => {
    loadCourse(courseId);
  }, [courseId, loadCourse]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: selectedLesson intentionally excluded
  useEffect(() => {
    if (currentCourse) {
      setEditingCourse({ ...currentCourse });

      // Only reset editing mode when the course actually changes (not when selectedLesson changes)
      if (!hasInitializedLesson.current) {
        setIsEditingContent(false);
      }

      // Auto-select first lesson if none is selected
      if (!selectedLesson) {
        // Find first available lesson
        let foundLesson = false;
        for (
          let moduleIdx = 0;
          moduleIdx < currentCourse.modules.length;
          moduleIdx++
        ) {
          const module = currentCourse.modules[moduleIdx];
          if (module.lessons.length > 0) {
            setSelectedLesson(module.lessons[0]);
            setCurrentModuleIndex(moduleIdx);
            setCurrentLessonIndex(0);
            foundLesson = true;
            break;
          }
        }

        hasInitializedLesson.current = true;
      }
    }
    // Note: selectedLesson is intentionally not in deps to avoid re-running when lesson selection changes
  }, [currentCourse]);

  const handleSave = async () => {
    if (!editingCourse) return;
    try {
      setIsSaving(true);
      await updateCourse(editingCourse);
    } catch (error) {
      console.error("Failed to save course:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const selectLesson = (
    lesson: Lesson,
    moduleIndex: number,
    lessonIndex: number,
  ) => {
    setSelectedLesson(lesson);
    setCurrentModuleIndex(moduleIndex);
    setCurrentLessonIndex(lessonIndex);
    setIsEditingContent(false);
  };

  const addModule = () => {
    if (!editingCourse) return;
    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: "New Module",
      description: "",
      lessons: [],
      order: editingCourse.modules.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setEditingCourse({
      ...editingCourse,
      modules: [...editingCourse.modules, newModule],
    });
  };

  const updateModuleName = (moduleIndex: number, newName: string) => {
    if (!editingCourse) return;

    const updatedModules = [...editingCourse.modules];
    updatedModules[moduleIndex].title = newName;

    setEditingCourse({
      ...editingCourse,
      modules: updatedModules,
    });
  };

  const deleteModule = (moduleIndex: number) => {
    if (!editingCourse) return;

    if (
      confirm(
        `Are you sure you want to delete "${editingCourse.modules[moduleIndex].title}" and all its lessons?`,
      )
    ) {
      const updatedModules = editingCourse.modules.filter(
        (_, index) => index !== moduleIndex,
      );

      // Update orders
      const reorderedModules = updatedModules.map((module, index) => ({
        ...module,
        order: index + 1,
      }));

      setEditingCourse({
        ...editingCourse,
        modules: reorderedModules,
      });

      // Reset selection if the selected lesson was in the deleted module
      if (currentModuleIndex === moduleIndex) {
        setSelectedLesson(null);
        setCurrentModuleIndex(0);
        setCurrentLessonIndex(0);
      } else if (currentModuleIndex > moduleIndex) {
        setCurrentModuleIndex(currentModuleIndex - 1);
      }
    }
  };

  const deleteLesson = (moduleIndex: number, lessonIndex: number) => {
    if (!editingCourse) return;

    const lesson = editingCourse.modules[moduleIndex].lessons[lessonIndex];
    if (confirm(`Are you sure you want to delete "${lesson.title}"?`)) {
      const updatedModules = [...editingCourse.modules];
      updatedModules[moduleIndex] = {
        ...updatedModules[moduleIndex],
        lessons: updatedModules[moduleIndex].lessons.filter(
          (_, index) => index !== lessonIndex,
        ),
      };

      // Update lesson orders
      updatedModules[moduleIndex].lessons = updatedModules[
        moduleIndex
      ].lessons.map((lesson, index) => ({
        ...lesson,
        order: index + 1,
      }));

      setEditingCourse({
        ...editingCourse,
        modules: updatedModules,
      });

      // Reset selection if the deleted lesson was selected
      if (
        currentModuleIndex === moduleIndex &&
        currentLessonIndex === lessonIndex
      ) {
        // Try to select another lesson in the same module
        if (updatedModules[moduleIndex].lessons.length > 0) {
          const newLessonIndex = Math.min(
            lessonIndex,
            updatedModules[moduleIndex].lessons.length - 1,
          );
          setSelectedLesson(
            updatedModules[moduleIndex].lessons[newLessonIndex],
          );
          setCurrentLessonIndex(newLessonIndex);
        } else {
          // No lessons left in this module, find first lesson in any module
          let newLesson = null;
          let newModuleIndex = 0;
          let newLessonIndex = 0;

          for (let i = 0; i < updatedModules.length; i++) {
            if (updatedModules[i].lessons.length > 0) {
              newLesson = updatedModules[i].lessons[0];
              newModuleIndex = i;
              newLessonIndex = 0;
              break;
            }
          }

          setSelectedLesson(newLesson);
          setCurrentModuleIndex(newModuleIndex);
          setCurrentLessonIndex(newLessonIndex);
        }
      } else if (
        currentModuleIndex === moduleIndex &&
        currentLessonIndex > lessonIndex
      ) {
        // Adjust the current lesson index if a lesson before it was deleted
        setCurrentLessonIndex(currentLessonIndex - 1);
      }
    }
  };

  const addLesson = (moduleIndex: number, lessonData?: Lesson) => {
    if (!editingCourse) return;
    const newLesson: Lesson = lessonData
      ? {
          ...lessonData,
          id: `lesson-${Date.now()}`,
          order: editingCourse.modules[moduleIndex].lessons.length + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      : {
          id: `lesson-${Date.now()}`,
          title: "New Lesson",
          description: "",
          content: [],
          duration: 15,
          order: editingCourse.modules[moduleIndex].lessons.length + 1,
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

    const updatedModules = [...editingCourse.modules];
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      lessons: [...updatedModules[moduleIndex].lessons, newLesson],
    };

    setEditingCourse({
      ...editingCourse,
      modules: updatedModules,
    });
  };

  const updateLessonName = (
    moduleIndex: number,
    lessonIndex: number,
    newName: string,
  ) => {
    if (!editingCourse) return;

    const updatedModules = [...editingCourse.modules];
    updatedModules[moduleIndex].lessons[lessonIndex].title = newName;

    setEditingCourse({
      ...editingCourse,
      modules: updatedModules,
    });

    // Update selected lesson if it's the one being edited
    if (
      selectedLesson &&
      selectedLesson.id === updatedModules[moduleIndex].lessons[lessonIndex].id
    ) {
      setSelectedLesson(updatedModules[moduleIndex].lessons[lessonIndex]);
    }
  };

  const calculateProgress = () => {
    if (!editingCourse) return 0;
    const totalLessons = editingCourse.modules.reduce(
      (total, module) => total + module.lessons.length,
      0,
    );
    const completedLessons = editingCourse.modules.reduce(
      (total, module) =>
        total + module.lessons.filter((lesson) => lesson.isCompleted).length,
      0,
    );
    return totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;
  };

  const addContentBlock = (type: "text" | "image" | "video" | "audio") => {
    if (!selectedLesson || !editingCourse) return;

    const newBlock: ContentBlock = {
      id: `content-${Date.now()}`,
      type,
      content:
        type === "text"
          ? { type: "text", content: "" }
          : { type, url: "", title: "", caption: "" },
      order: selectedLesson.content.length + 1,
    };

    const updatedLesson: Lesson = {
      ...selectedLesson,
      content: [...selectedLesson.content, newBlock],
      updatedAt: new Date(),
    };

    updateLessonInCourse(updatedLesson);
  };

  const updateContentBlock = (blockId: string, updatedBlock: ContentBlock) => {
    if (!selectedLesson) return;

    const updatedLesson: Lesson = {
      ...selectedLesson,
      content: selectedLesson.content.map((block) =>
        block.id === blockId ? updatedBlock : block,
      ),
      updatedAt: new Date(),
    };

    updateLessonInCourse(updatedLesson);
  };

  const deleteContentBlock = (blockId: string) => {
    if (!selectedLesson) return;

    const updatedLesson: Lesson = {
      ...selectedLesson,
      content: selectedLesson.content.filter((block) => block.id !== blockId),
      updatedAt: new Date(),
    };

    updateLessonInCourse(updatedLesson);
  };

  const moveContentBlock = (blockId: string, direction: "up" | "down") => {
    if (!selectedLesson) return;

    const currentIndex = selectedLesson.content.findIndex(
      (block) => block.id === blockId,
    );
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= selectedLesson.content.length) return;

    const reorderedContent = [...selectedLesson.content];
    const [movedBlock] = reorderedContent.splice(currentIndex, 1);
    reorderedContent.splice(newIndex, 0, movedBlock);

    const updatedContent = reorderedContent.map((block, index) => ({
      ...block,
      order: index + 1,
    }));

    const updatedLesson: Lesson = {
      ...selectedLesson,
      content: updatedContent,
      updatedAt: new Date(),
    };

    updateLessonInCourse(updatedLesson);
  };

  // Enhanced content block drag and drop
  const handleContentBlockDragStart = (
    e: React.DragEvent,
    blockId: string,
    blockIndex: number,
  ) => {
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        type: "content-block",
        blockId,
        blockIndex,
      }),
    );
    e.dataTransfer.effectAllowed = "move";
    (e.target as HTMLElement).style.opacity = "0.5";
  };

  const handleContentBlockDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
  };

  const handleContentBlockDragOver = (
    e: React.DragEvent,
    targetIndex: number,
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleContentBlockDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();

    try {
      const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));

      if (dragData.type === "content-block" && selectedLesson) {
        const { blockIndex } = dragData;

        if (blockIndex === targetIndex) return;

        const reorderedContent = [...selectedLesson.content];
        const [movedBlock] = reorderedContent.splice(blockIndex, 1);
        reorderedContent.splice(targetIndex, 0, movedBlock);

        const updatedContent = reorderedContent.map((block, index) => ({
          ...block,
          order: index + 1,
        }));

        const updatedLesson: Lesson = {
          ...selectedLesson,
          content: updatedContent,
          updatedAt: new Date(),
        };

        updateLessonInCourse(updatedLesson);
      }
    } catch (error) {
      console.error("Error handling content block drop:", error);
    }
  };

  const updateLessonInCourse = (updatedLesson: Lesson) => {
    if (!editingCourse) return;

    const updatedModules = editingCourse.modules.map((module, moduleIndex) => {
      if (moduleIndex === currentModuleIndex) {
        return {
          ...module,
          lessons: module.lessons.map((lesson, lessonIndex) =>
            lessonIndex === currentLessonIndex ? updatedLesson : lesson,
          ),
          updatedAt: new Date(),
        };
      }
      return module;
    });

    const updatedCourse = {
      ...editingCourse,
      modules: updatedModules,
      updatedAt: new Date(),
    };

    setEditingCourse(updatedCourse);
    setSelectedLesson(updatedLesson);
  };

  // Enhanced drag and drop handlers
  const handleDragStart = (
    e: React.DragEvent,
    type: "module" | "lesson",
    moduleIndex: number,
    lessonIndex?: number,
  ) => {
    if (!editingCourse) return;

    const dragData: DragItem = {
      type,
      id:
        type === "module"
          ? editingCourse.modules[moduleIndex].id
          : lessonIndex !== undefined
            ? editingCourse.modules[moduleIndex].lessons[lessonIndex].id
            : "",
      moduleIndex,
      lessonIndex,
    };

    setDraggedItem(dragData);
    e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = "move";

    // Add visual feedback
    (e.target as HTMLElement).style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (
    e: React.DragEvent,
    moduleIndex: number,
    lessonIndex?: number,
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex({ moduleIndex, lessonIndex });
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (
    e: React.DragEvent,
    targetModuleIndex: number,
    targetLessonIndex?: number,
  ) => {
    e.preventDefault();
    setDragOverIndex(null);

    try {
      // First try to get data from lesson library
      const libraryData = e.dataTransfer.getData("application/json");
      if (libraryData) {
        const parsedData = JSON.parse(libraryData);
        if (parsedData.sourceType === "library") {
          addLesson(targetModuleIndex, parsedData);
          return;
        }
      }

      // Handle internal drag and drop
      const internalData = e.dataTransfer.getData("text/plain");
      if (internalData && draggedItem) {
        const dragData = JSON.parse(internalData);

        if (
          dragData.type === "lesson" &&
          draggedItem.moduleIndex !== undefined &&
          draggedItem.lessonIndex !== undefined
        ) {
          moveLesson(
            draggedItem.moduleIndex,
            draggedItem.lessonIndex,
            targetModuleIndex,
            targetLessonIndex,
          );
        } else if (
          dragData.type === "module" &&
          draggedItem.moduleIndex !== undefined
        ) {
          moveModule(draggedItem.moduleIndex, targetModuleIndex);
        }
      }
    } catch (error) {
      console.error("Error handling drop:", error);
    }

    setDraggedItem(null);
  };

  const moveLesson = (
    fromModuleIndex: number,
    fromLessonIndex: number,
    toModuleIndex: number,
    toLessonIndex?: number,
  ) => {
    if (!editingCourse) return;

    const updatedModules = [...editingCourse.modules];
    const lessonToMove =
      updatedModules[fromModuleIndex].lessons[fromLessonIndex];

    // Remove from source
    updatedModules[fromModuleIndex].lessons.splice(fromLessonIndex, 1);

    // Add to target
    const targetIndex =
      toLessonIndex !== undefined
        ? toLessonIndex
        : updatedModules[toModuleIndex].lessons.length;
    updatedModules[toModuleIndex].lessons.splice(targetIndex, 0, lessonToMove);

    // Update orders for both affected modules
    updatedModules[fromModuleIndex].lessons.forEach((lesson, index) => {
      lesson.order = index + 1;
    });
    updatedModules[toModuleIndex].lessons.forEach((lesson, index) => {
      lesson.order = index + 1;
    });

    setEditingCourse({
      ...editingCourse,
      modules: updatedModules,
    });
  };

  const moveModule = (fromIndex: number, toIndex: number) => {
    if (!editingCourse || fromIndex === toIndex) return;

    const updatedModules = [...editingCourse.modules];
    const moduleToMove = updatedModules[fromIndex];

    // Remove from source
    updatedModules.splice(fromIndex, 1);

    // Add to target
    updatedModules.splice(toIndex, 0, moduleToMove);

    // Update orders
    updatedModules.forEach((module, index) => {
      module.order = index + 1;
    });

    setEditingCourse({
      ...editingCourse,
      modules: updatedModules,
    });
  };

  const renderContent = (content: ContentBlock, isEditing = false) => {
    if (isEditing && content.type === "text") {
      return (
        <RichTextEditor
          value={content.content.type === "text" ? content.content.content : ""}
          onChange={(newContent) => {
            updateContentBlock(content.id, {
              ...content,
              content: { type: "text", content: newContent },
            });
          }}
          placeholder="Enter your content here..."
        />
      );
    }

    // Render content exactly like CourseViewer for view mode
    switch (content.type) {
      case "text":
        if (content.content.type === "text") {
          return (
            <div
              className="prose max-w-none"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: Content is from trusted course data
              dangerouslySetInnerHTML={{ __html: content.content.content }}
            />
          );
        }
        break;
      case "image":
        if (content.content.type === "image") {
          return (
            <div className="my-4">
              <img
                src={content.content.url}
                alt={content.content.title || "Course image"}
                className="w-full rounded-lg shadow-sm"
              />
              {content.content.caption && (
                <p className="text-sm text-gray-600 mt-2 italic">{content.content.caption}</p>
              )}
            </div>
          );
        }
        break;
      case "video":
        if (content.content.type === "video") {
          return (
            <div className="my-4">
              <video
                controls
                className="w-full rounded-lg shadow-sm"
                src={content.content.url}
              >
                <track kind="captions" label="English" srcLang="en" />
                Your browser does not support the video tag.
              </video>
              {content.content.caption && (
                <p className="text-sm text-gray-600 mt-2 italic">{content.content.caption}</p>
              )}
            </div>
          );
        }
        break;
      case "audio":
        if (content.content.type === "audio") {
          return (
            <div className="my-4">
              <audio
                controls
                className="w-full"
                src={content.content.url}
              >
                <track kind="captions" label="English" srcLang="en" />
                Your browser does not support the audio tag.
              </audio>
              {content.content.caption && (
                <p className="text-sm text-gray-600 mt-2 italic">{content.content.caption}</p>
              )}
            </div>
          );
        }
        break;
      default:
        return <div>Unsupported content type</div>;
    }
    return <div>Invalid content configuration</div>;
  };

  if (!editingCourse) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p>{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")} to {t("courses.title")}
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLessonLibrary(true)}
              >
                <Library className="h-4 w-4 mr-2" />
                Lesson Library
              </Button>
              <Button variant="outline" size="sm" onClick={onViewMode}>
                <Eye className="h-4 w-4 mr-2" />
                {t("courses.view")}
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? t("common.loading") : t("common.save")}
              </Button>
              <Badge className="bg-blue-100 text-blue-800">Edit Mode</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{editingCourse.title}</CardTitle>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("courses.progress")}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Course Modules */}
                {editingCourse.modules.map((module, moduleIndex) => (
                  <div
                    key={module.id}
                    className={`space-y-2 ${
                      dragOverIndex?.moduleIndex === moduleIndex &&
                      dragOverIndex?.lessonIndex === undefined
                        ? "bg-blue-50 border-2 border-blue-300 rounded-lg p-2"
                        : ""
                    }`}
                    onDragOver={(e) => handleDragOver(e, moduleIndex)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, moduleIndex)}
                  >
                    <div
                      className="flex items-center justify-between cursor-move"
                      draggable
                      onDragStart={(e) =>
                        handleDragStart(e, "module", moduleIndex)
                      }
                      onDragEnd={handleDragEnd}
                    >
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <GripVertical className="h-3 w-3 text-gray-400" />
                        <BookOpen className="h-4 w-4" />
                        <EditableText
                          value={module.title}
                          onChange={(newName) =>
                            updateModuleName(moduleIndex, newName)
                          }
                          placeholder="Module Title"
                        />
                      </h4>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => addLesson(moduleIndex)}
                          className="h-6 w-6 p-0"
                          title="Add lesson"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteModule(moduleIndex)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          title="Delete module"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 ml-6">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          className={`group w-full p-2 rounded text-sm flex items-center gap-2 hover:bg-gray-100 transition-colors cursor-move ${
                            selectedLesson?.id === lesson.id
                              ? "bg-blue-50 border-l-2 border-blue-500"
                              : ""
                          } ${
                            dragOverIndex?.moduleIndex === moduleIndex &&
                            dragOverIndex?.lessonIndex === lessonIndex
                              ? "bg-blue-100 border border-blue-300"
                              : ""
                          }`}
                          draggable
                          onDragStart={(e) =>
                            handleDragStart(
                              e,
                              "lesson",
                              moduleIndex,
                              lessonIndex,
                            )
                          }
                          onDragEnd={handleDragEnd}
                          onClick={() =>
                            selectLesson(lesson, moduleIndex, lessonIndex)
                          }
                          onDragOver={(e) =>
                            handleDragOver(e, moduleIndex, lessonIndex)
                          }
                          onDragLeave={handleDragLeave}
                          onDrop={(e) =>
                            handleDrop(e, moduleIndex, lessonIndex)
                          }
                        >
                          <GripVertical className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                          <Edit className="h-3 w-3 text-blue-500 flex-shrink-0" />
                          <EditableText
                            value={lesson.title}
                            onChange={(newName) =>
                              updateLessonName(
                                moduleIndex,
                                lessonIndex,
                                newName,
                              )
                            }
                            placeholder="Lesson Title"
                            className="flex-1"
                          />
                          <div className="flex items-center gap-1 text-gray-500">
                            <FileText className="h-3 w-3" />
                            <span className="text-xs">
                              {lesson.content.length}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLesson(moduleIndex, lessonIndex);
                              }}
                              className="h-4 w-4 p-0 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
                              title="Delete lesson"
                            >
                              <Trash2 className="h-2 w-2" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Add Module Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addModule}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedLesson ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">
                        {selectedLesson.title}
                      </CardTitle>
                      <p className="text-gray-600 mt-1">
                        {selectedLesson.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditingContent(!isEditingContent)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {isEditingContent ? "View" : "Edit"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedLesson.content.length > 0 ? (
                    <div className="space-y-4">
                      {isEditingContent
                        ? // Edit mode with full content block editors
                          selectedLesson.content
                            .sort((a, b) => a.order - b.order)
                            .map((content, index) => (
                              <div
                                key={content.id}
                                draggable
                                onDragStart={(e) =>
                                  handleContentBlockDragStart(
                                    e,
                                    content.id,
                                    index,
                                  )
                                }
                                onDragEnd={handleContentBlockDragEnd}
                                onDragOver={(e) =>
                                  handleContentBlockDragOver(e, index)
                                }
                                onDrop={(e) => handleContentBlockDrop(e, index)}
                                className="transition-opacity duration-200"
                              >
                                <ContentBlockEditor
                                  content={content}
                                  onUpdate={(updatedContent) =>
                                    updateContentBlock(
                                      content.id,
                                      updatedContent,
                                    )
                                  }
                                  onDelete={() =>
                                    deleteContentBlock(content.id)
                                  }
                                  onMoveUp={() =>
                                    moveContentBlock(content.id, "up")
                                  }
                                  onMoveDown={() =>
                                    moveContentBlock(content.id, "down")
                                  }
                                  canMoveUp={index > 0}
                                  canMoveDown={
                                    index < selectedLesson.content.length - 1
                                  }
                                />
                              </div>
                            ))
                        : // View mode with clean rendering - only show content with actual data
                          selectedLesson.content
                            .sort((a, b) => a.order - b.order)
                            .filter((content) => {
                              // Filter out empty content blocks in view mode
                              if (content.type === 'text') {
                                return content.content.type === 'text' && content.content.content.trim() !== '';
                              }
                              // For media types, only show if URL exists
                              return content.content.type !== 'text' && content.content.url;
                            })
                            .map((content) => (
                              <div key={content.id}>
                                {renderContent(content, false)}
                              </div>
                            ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No content in this lesson yet.</p>
                      <p className="text-sm">
                        Add some content blocks to get started.
                      </p>
                    </div>
                  )}

                  {/* Add Content Controls */}
                  {isEditingContent && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mt-6">
                      <h3 className="text-sm font-medium mb-3 text-center">
                        {t("editor.addContent", "Add Content")}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Button
                          variant="outline"
                          onClick={() => addContentBlock("text")}
                          className="flex flex-col items-center gap-2 h-16 text-xs"
                        >
                          <Type className="h-5 w-5 text-blue-500" />
                          Text
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => addContentBlock("image")}
                          className="flex flex-col items-center gap-2 h-16 text-xs"
                        >
                          <Image className="h-5 w-5 text-green-500" />
                          Image
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => addContentBlock("video")}
                          className="flex flex-col items-center gap-2 h-16 text-xs"
                        >
                          <Video className="h-5 w-5 text-red-500" />
                          Video
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => addContentBlock("audio")}
                          className="flex flex-col items-center gap-2 h-16 text-xs"
                        >
                          <Volume2 className="h-5 w-5 text-purple-500" />
                          Audio
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {t("editor.selectLesson", "Select a Lesson")}
                    </h3>
                    <p className="text-gray-600">
                      {t(
                        "editor.selectLessonDesc",
                        "Choose a lesson from the sidebar to start editing",
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Lesson Library Modal */}
      <LessonLibraryModal
        isOpen={showLessonLibrary}
        onClose={() => setShowLessonLibrary(false)}
        onSelectLesson={(lesson, moduleIndex) => {
          addLesson(moduleIndex, lesson);
          setShowLessonLibrary(false);
        }}
        modules={editingCourse.modules}
      />
    </div>
  );
}
