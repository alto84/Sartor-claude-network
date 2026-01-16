"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  StickyNote,
  Plus,
  Trash2,
  Pin,
  Check,
  X,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  content: string;
  color: string;
  isPinned: boolean;
  createdAt: Date;
}

const noteColors = [
  { name: "Yellow", value: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800" },
  { name: "Pink", value: "bg-pink-100 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800" },
  { name: "Blue", value: "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800" },
  { name: "Green", value: "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800" },
  { name: "Purple", value: "bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800" },
  { name: "Orange", value: "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800" },
];

// Sample notes - in production this would come from your vault/data store
const sampleNotes: Note[] = [
  {
    id: "1",
    content: "Pick up groceries: milk, eggs, bread",
    color: noteColors[0].value,
    isPinned: true,
    createdAt: new Date(),
  },
  {
    id: "2",
    content: "Solar Inference LLC - follow up on CPA call",
    color: noteColors[1].value,
    isPinned: false,
    createdAt: new Date(),
  },
  {
    id: "3",
    content: "Vishala gymnastics pickup at 5:30pm",
    color: noteColors[2].value,
    isPinned: false,
    createdAt: new Date(),
  },
];

export function QuickNotesWidget() {
  const [notes, setNotes] = useState<Note[]>(sampleNotes);
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(noteColors[0].value);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isAdding && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAdding]);

  const addNote = () => {
    if (newNoteContent.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        content: newNoteContent.trim(),
        color: selectedColor,
        isPinned: false,
        createdAt: new Date(),
      };
      setNotes([newNote, ...notes]);
      setNewNoteContent("");
      setIsAdding(false);
      setSelectedColor(noteColors[0].value);
      // In production, sync to vault here
    }
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
    // In production, sync to vault here
  };

  const togglePin = (id: string) => {
    setNotes(
      notes.map((note) =>
        note.id === id ? { ...note, isPinned: !note.isPinned } : note
      )
    );
    // In production, sync to vault here
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewNoteContent("");
    setSelectedColor(noteColors[0].value);
    setShowColorPicker(false);
  };

  // Sort notes: pinned first, then by date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/50">
            <StickyNote className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle className="text-lg">Quick Notes</CardTitle>
        </div>
        {!isAdding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        {/* Add Note Form */}
        {isAdding && (
          <div
            className={cn(
              "mb-4 p-3 rounded-lg border-2 transition-all",
              selectedColor
            )}
          >
            <textarea
              ref={textareaRef}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Type your note..."
              className="w-full bg-transparent border-none resize-none focus:outline-none text-sm min-h-[60px] placeholder:text-muted-foreground/70"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  addNote();
                }
                if (e.key === "Escape") {
                  cancelAdd();
                }
              }}
            />
            <div className="flex items-center justify-between pt-2 border-t border-current/10">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="relative"
                >
                  <Palette className="h-4 w-4" />
                </Button>
                {showColorPicker && (
                  <div className="flex gap-1 ml-1">
                    {noteColors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => {
                          setSelectedColor(color.value);
                          setShowColorPicker(false);
                        }}
                        className={cn(
                          "w-5 h-5 rounded-full border-2 transition-transform hover:scale-110",
                          color.value,
                          selectedColor === color.value && "ring-2 ring-offset-1 ring-primary"
                        )}
                        title={color.name}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" onClick={cancelAdd}>
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={addNote}
                  disabled={!newNoteContent.trim()}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ctrl+Enter to save, Esc to cancel
            </p>
          </div>
        )}

        {/* Notes List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {sortedNotes.map((note, index) => (
            <div
              key={note.id}
              className={cn(
                "group p-3 rounded-lg border-2 transition-all duration-200",
                "hover:shadow-md hover:-translate-y-0.5",
                note.color
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm flex-1 whitespace-pre-wrap break-words">
                  {note.content}
                </p>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => togglePin(note.id)}
                    className="h-7 w-7"
                  >
                    <Pin
                      className={cn(
                        "h-3.5 w-3.5 transition-colors",
                        note.isPinned
                          ? "fill-current text-amber-600"
                          : "text-muted-foreground"
                      )}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteNote(note.id)}
                    className="h-7 w-7 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {note.isPinned && (
                <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <Pin className="h-3 w-3 fill-current" />
                  <span>Pinned</span>
                </div>
              )}
            </div>
          ))}

          {notes.length === 0 && !isAdding && (
            <div className="text-center py-8">
              <StickyNote className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mb-2">No notes yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(true)}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add your first note
              </Button>
            </div>
          )}
        </div>

        {/* Sync Status */}
        {notes.length > 0 && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {notes.length} note{notes.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Synced to vault
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
