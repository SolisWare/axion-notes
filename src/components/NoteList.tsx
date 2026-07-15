/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode, useRef } from "react";
import { closestCenter, DndContext, DragEndEvent, PointerSensor, PointerSensorOptions, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import { NoteType } from "../models/NoteType";
import { getNoteFontFamily, NoteFontPreference } from "../settings/NoteFontPreference";
import { NoteSizePreference } from "../settings/noteSizePreference";
import { getAppColors } from "../theme/AppColors";
import { getNoteColor } from "../theme/NoteColors";
import { SystemTheme } from "../theme/SystemTheme";
import { DateFormat } from "../utils/dt-formatter/DateFormat";
import { TimeFormat } from "../utils/dt-formatter/TimeFormat";
import Note from "./Note";
import styles from "./NoteList.module.css";

type NoteListProps = {
  theme: SystemTheme;
  notes: NoteType[];
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  noteFont: NoteFontPreference;
  noteSize: NoteSizePreference;
  showNoteTitles: boolean;
  showNoteFooters: boolean;
  handleDeleteNoteButton: (noteId: string) => void;
  handleDuplicateNote: (note: NoteType) => void;
  handleMoveNoteToBottom: (noteId: string) => void;
  handleMoveNoteToTop: (noteId: string) => void;
  handleNoteSave: (note: NoteType) => void;
  handleNoteReorder: (activeNoteId: string, overNoteId: string) => void;
}

type FoldedNoteContent = {
  body: string;
  title?: string;
};

type SortableNoteListItemProps = {
  children: ReactNode;
  id: string;
  isFolded: boolean;
};

const NOTE_EDITABLE_SELECTOR = "input, textarea, [contenteditable='true']";

function isFocusedEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  const editableTarget = target.closest(NOTE_EDITABLE_SELECTOR);

  if (!(editableTarget instanceof HTMLElement)) {
    return false;
  }

  const activeElement = editableTarget.ownerDocument.activeElement;

  return activeElement === editableTarget || editableTarget.contains(activeElement);
}

class NoteListPointerSensor extends PointerSensor {
  static activators = [{
    eventName: "onPointerDown" as const,
    handler: ({ nativeEvent: event }: ReactPointerEvent, { onActivation }: PointerSensorOptions) => {
      if (!event.isPrimary || event.button !== 0 || isFocusedEditableTarget(event.target)) {
        return false;
      }

      onActivation?.({ event });
      return true;
    }
  }];
}

function getFirstContentLine(note: NoteType): string {
  return note.content.split(/\r?\n/).find((line) => line.trim().length > 0)?.trim() ?? "";
}

function getFoldedNoteContent(note: NoteType, showNoteTitles: boolean): FoldedNoteContent {
  const isTitleHidden = note.isTitleHidden ?? !showNoteTitles;
  const title = note.title?.trim();
  const body = getFirstContentLine(note);

  if (!isTitleHidden && title) {
    return {
      title,
      body
    };
  }

  return { body };
}

function NoteList(props: NoteListProps) {
  const { t } = useTranslation();
  const foldedNoteIds = useRef<Set<string>>(new Set());
  const sensors = useSensors(useSensor(NoteListPointerSensor, {
    activationConstraint: {
      distance: 8
    }
  }));
  
  const appColors = getAppColors(props.theme);
  const noteFontFamily = getNoteFontFamily(props.noteFont);
  const noteListStyle = {
    "--note-list-text": appColors.NOTE_TEXT
  } as CSSProperties;
  const noteIds = props.notes.map((note) => note.id);

  function handleUnfoldNote(note: NoteType) {
    foldedNoteIds.current.delete(note.id);

    props.handleNoteSave({
      ...note,
      isFolded: false
    });
  }

  function handleFoldNote(note: NoteType) {
    foldedNoteIds.current.add(note.id);

    props.handleNoteSave({
      ...note,
      isFolded: true
    });
  }

  function handleExpandedNoteSave(note: NoteType) {
    props.handleNoteSave({
      ...note,
      isFolded: foldedNoteIds.current.has(note.id) ? true : note.isFolded
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) {
      return;
    }

    props.handleNoteReorder(String(event.active.id), String(event.over.id));
  }

  return (
    <div className={styles.wrapper} style={noteListStyle}>
      <DndContext
        autoScroll={false}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={noteIds} strategy={verticalListSortingStrategy}>
          <div className={styles.list}>
            {props.notes.map((note) => {
              const isFolded = note.isFolded ?? true;
              const foldedNoteContent = getFoldedNoteContent(note, props.showNoteTitles);

              if (isFolded) {
                return (
                  <SortableNoteListItem id={note.id} isFolded={isFolded} key={note.id}>
                    <div
                      className={styles.listItem}
                      style={{ backgroundColor: getNoteColor(note.bgcolor, props.theme) }}
                    >
                      <div className={styles.foldedNoteDragIndicator} aria-hidden="true" />
                      <div className={styles.listItemContent} style={{ fontFamily: noteFontFamily }}>
                        {foldedNoteContent.title && (
                          <span className={styles.listItemTitle}>{foldedNoteContent.title}</span>
                        )}
                        <span className={foldedNoteContent.title ? styles.listItemBody : styles.listItemBodyPrimary}>
                          {foldedNoteContent.body}
                        </span>
                      </div>
                      <button
                        aria-label={t("mainWindow.note.unfold")}
                        className={styles.unfoldButton}
                        onClick={() => handleUnfoldNote(note)}
                        title={t("mainWindow.note.unfold")}
                        type="button"
                      />
                    </div>
                  </SortableNoteListItem>
                );
              }

              return (
                <SortableNoteListItem id={note.id} isFolded={isFolded} key={note.id}>
                  <div className={styles.expandedListItem}>
                    <Note
                      theme={props.theme}
                      note={note}
                      dateFormat={props.dateFormat}
                      timeFormat={props.timeFormat}
                      noteFont={props.noteFont}
                      noteSize={NoteSizePreference.WIDE}
                      showNoteTitles={props.showNoteTitles}
                      showNoteFooters={props.showNoteFooters}
                      handleDeleteNoteButton={props.handleDeleteNoteButton}
                      handleDuplicateNote={props.handleDuplicateNote}
                      handleMoveNoteToBottom={props.handleMoveNoteToBottom}
                      handleMoveNoteToTop={props.handleMoveNoteToTop}
                      handleNoteSave={handleExpandedNoteSave}
                      style={{ marginBottom: 0 }}
                    />
                    <button
                      aria-label={t("mainWindow.note.fold")}
                      className={styles.foldButton}
                      onClick={() => handleFoldNote(note)}
                      title={t("mainWindow.note.fold")}
                      type="button"
                    />
                  </div>
                </SortableNoteListItem>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableNoteListItem(props: SortableNoteListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.id });

  return (
    <div
      className={props.isFolded ? styles.sortableFoldedItem : styles.sortableExpandedItem}
      ref={setNodeRef}
      style={{
        opacity: isDragging ? 0.72 : 1,
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 1 : undefined
      }}
      {...attributes}
      {...listeners}
    >
      {props.children}
    </div>
  );
}

export default NoteList;
