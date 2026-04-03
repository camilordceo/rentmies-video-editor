"use client";

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  EditorState,
  EditorTool,
  Project,
  Scene,
  TextElement,
  MediaElement,
  CaptionSegment,
  CaptionStyle,
  TransitionType,
} from "./types";

// ----- Actions -----

type Action =
  | { type: "SET_PROJECT"; project: Project }
  | { type: "SELECT_SCENE"; sceneId: string | null }
  | { type: "SELECT_ELEMENT"; elementId: string | null; elementType: "text" | "media" | "caption" | null }
  | { type: "SET_FRAME"; frame: number }
  | { type: "SET_PLAYING"; playing: boolean }
  | { type: "SET_TOOL"; tool: EditorTool }
  | { type: "SET_ZOOM"; zoom: number }
  | { type: "ADD_SCENE"; scene: Scene }
  | { type: "UPDATE_SCENE"; sceneId: string; updates: Partial<Scene> }
  | { type: "DELETE_SCENE"; sceneId: string }
  | { type: "REORDER_SCENES"; sceneIds: string[] }
  | { type: "ADD_TEXT_ELEMENT"; sceneId: string; element: TextElement }
  | { type: "UPDATE_TEXT_ELEMENT"; sceneId: string; elementId: string; updates: Partial<TextElement> }
  | { type: "DELETE_TEXT_ELEMENT"; sceneId: string; elementId: string }
  | { type: "ADD_MEDIA_ELEMENT"; sceneId: string; element: MediaElement }
  | { type: "UPDATE_MEDIA_ELEMENT"; sceneId: string; elementId: string; updates: Partial<MediaElement> }
  | { type: "DELETE_MEDIA_ELEMENT"; sceneId: string; elementId: string }
  | { type: "SET_CAPTIONS"; sceneId: string; captions: CaptionSegment[] }
  | { type: "UPDATE_CAPTION"; sceneId: string; captionId: string; updates: Partial<CaptionSegment> }
  | { type: "DELETE_CAPTION"; sceneId: string; captionId: string }
  | { type: "SET_CAPTION_STYLE"; sceneId: string; style: Partial<CaptionStyle> }
  | { type: "SET_TRANSITION"; sceneId: string; transition: TransitionType; durationFrames: number }
  | { type: "UPDATE_PROJECT_META"; updates: Partial<Pick<Project, "name" | "description" | "status">> };

// ----- Reducer -----

function updateScene(state: EditorState, sceneId: string, updater: (scene: Scene) => Scene): EditorState {
  return {
    ...state,
    project: {
      ...state.project,
      updatedAt: new Date().toISOString(),
      scenes: state.project.scenes.map((s) => (s.id === sceneId ? updater(s) : s)),
    },
  };
}

function editorReducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case "SET_PROJECT":
      return { ...state, project: action.project, selectedSceneId: action.project.scenes[0]?.id ?? null };

    case "SELECT_SCENE":
      return { ...state, selectedSceneId: action.sceneId, selectedElementId: null, selectedElementType: null };

    case "SELECT_ELEMENT":
      return { ...state, selectedElementId: action.elementId, selectedElementType: action.elementType };

    case "SET_FRAME":
      return { ...state, currentFrame: action.frame };

    case "SET_PLAYING":
      return { ...state, isPlaying: action.playing };

    case "SET_TOOL":
      return { ...state, activeTool: action.tool };

    case "SET_ZOOM":
      return { ...state, zoom: action.zoom };

    case "ADD_SCENE":
      return {
        ...state,
        project: {
          ...state.project,
          updatedAt: new Date().toISOString(),
          scenes: [...state.project.scenes, action.scene],
        },
        selectedSceneId: action.scene.id,
      };

    case "UPDATE_SCENE":
      return updateScene(state, action.sceneId, (s) => ({ ...s, ...action.updates }));

    case "DELETE_SCENE": {
      const newScenes = state.project.scenes.filter((s) => s.id !== action.sceneId);
      return {
        ...state,
        project: { ...state.project, updatedAt: new Date().toISOString(), scenes: newScenes },
        selectedSceneId: state.selectedSceneId === action.sceneId ? (newScenes[0]?.id ?? null) : state.selectedSceneId,
      };
    }

    case "REORDER_SCENES": {
      const sceneMap = new Map(state.project.scenes.map((s) => [s.id, s]));
      const reordered = action.sceneIds.map((id) => sceneMap.get(id)!).filter(Boolean);
      return {
        ...state,
        project: { ...state.project, updatedAt: new Date().toISOString(), scenes: reordered },
      };
    }

    case "ADD_TEXT_ELEMENT":
      return updateScene(state, action.sceneId, (s) => ({
        ...s,
        textElements: [...s.textElements, action.element],
      }));

    case "UPDATE_TEXT_ELEMENT":
      return updateScene(state, action.sceneId, (s) => ({
        ...s,
        textElements: s.textElements.map((el) =>
          el.id === action.elementId ? { ...el, ...action.updates } : el
        ),
      }));

    case "DELETE_TEXT_ELEMENT":
      return updateScene(state, action.sceneId, (s) => ({
        ...s,
        textElements: s.textElements.filter((el) => el.id !== action.elementId),
      }));

    case "ADD_MEDIA_ELEMENT":
      return updateScene(state, action.sceneId, (s) => ({
        ...s,
        mediaElements: [...s.mediaElements, action.element],
      }));

    case "UPDATE_MEDIA_ELEMENT":
      return updateScene(state, action.sceneId, (s) => ({
        ...s,
        mediaElements: s.mediaElements.map((el) =>
          el.id === action.elementId ? { ...el, ...action.updates } : el
        ),
      }));

    case "DELETE_MEDIA_ELEMENT":
      return updateScene(state, action.sceneId, (s) => ({
        ...s,
        mediaElements: s.mediaElements.filter((el) => el.id !== action.elementId),
      }));

    case "SET_CAPTIONS":
      return updateScene(state, action.sceneId, (s) => ({
        ...s,
        captions: action.captions,
      }));

    case "UPDATE_CAPTION":
      return updateScene(state, action.sceneId, (s) => ({
        ...s,
        captions: s.captions.map((c) =>
          c.id === action.captionId ? { ...c, ...action.updates } : c
        ),
      }));

    case "DELETE_CAPTION":
      return updateScene(state, action.sceneId, (s) => ({
        ...s,
        captions: s.captions.filter((c) => c.id !== action.captionId),
      }));

    case "SET_CAPTION_STYLE":
      return updateScene(state, action.sceneId, (s) => ({
        ...s,
        captionStyle: { ...s.captionStyle, ...action.style },
      }));

    case "SET_TRANSITION":
      return updateScene(state, action.sceneId, (s) => ({
        ...s,
        transition: action.transition,
        transitionDurationFrames: action.durationFrames,
      }));

    case "UPDATE_PROJECT_META":
      return {
        ...state,
        project: { ...state.project, ...action.updates, updatedAt: new Date().toISOString() },
      };

    default:
      return state;
  }
}

// ----- Default state factory -----

export function createDefaultEditorState(project: Project): EditorState {
  return {
    project,
    selectedSceneId: project.scenes[0]?.id ?? null,
    selectedElementId: null,
    selectedElementType: null,
    currentFrame: 0,
    isPlaying: false,
    activeTool: "select",
    zoom: 1,
  };
}

// ----- Context -----

const EditorStateContext = createContext<EditorState | null>(null);
const EditorDispatchContext = createContext<Dispatch<Action> | null>(null);

export function EditorProvider({
  children,
  initialProject,
}: {
  children: ReactNode;
  initialProject: Project;
}) {
  const [state, dispatch] = useReducer(editorReducer, createDefaultEditorState(initialProject));

  return React.createElement(
    EditorStateContext.Provider,
    { value: state },
    React.createElement(EditorDispatchContext.Provider, { value: dispatch }, children)
  );
}

export function useEditorState(): EditorState {
  const ctx = useContext(EditorStateContext);
  if (!ctx) throw new Error("useEditorState must be used within EditorProvider");
  return ctx;
}

export function useEditorDispatch(): Dispatch<Action> {
  const ctx = useContext(EditorDispatchContext);
  if (!ctx) throw new Error("useEditorDispatch must be used within EditorProvider");
  return ctx;
}

/** Convenience: returns both state and dispatch. */
export function useEditor() {
  return { state: useEditorState(), dispatch: useEditorDispatch() };
}
