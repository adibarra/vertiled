import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createTheme,
  ThemeProvider,
} from "@mui/material";
import _ from "lodash";
import produce from "immer";
import {
  ActionType,
  addCursorOnNewLayers,
  Coordinates,
  Cursor,
  extractCursor,
  Rectangle,
  tileSize,
} from "vertiled-shared";
import { CursorContent } from "vertiled-shared/src";
import { useImageStore } from "./image-store";
import {
  addSelectionToTilesets,
  SelectionTilesetInfo,
  useSelection,
} from "./useSelection";
import { useUnilog } from "./useUnilog";
import { useWindowSize } from "./useWindowSize";
import { TilemapDisplay } from "./components/TilemapDisplay";
import { BottomControlBar } from "./components/BottomControlBar";
import { TopControlBar } from "./components/TopControlBar";
import { SidePanel } from "./components/SidePanel";

const serverOrigin = process.env.NODE_ENV === "development" ? `${window.location.hostname}:8088` : window.location.host;
const wsServerURL = `${window.location.protocol === "https:" ? "wss" : "ws"}://${serverOrigin}`;
const imageStoreURL = `//${serverOrigin}/world`;

const MAIN_CANVAS_ID = "mainCanvas";

enum EditingMode {
  Clone = "Clone",
  Erase = "Erase",
}

function App() {
  const theme = createTheme({
    palette: {
      primary: {
        main: '#3f51b5',
      },
      secondary: {
        main: '#f50057',
      },
    },
  });

  const {
    state,
    userId,
    runAction,
    startUndoGroup,
    endUndoGroup,
    tryUndo,
  } = useUnilog(wsServerURL);
  const myState = state.users.find((u) => u.id === userId);

  const [editingMode, setEditingMode] = useState(EditingMode.Clone);

  const [selectedTileSet, setSelectedTileSet] = useState<number>(0);

  const imageStore = useImageStore(imageStoreURL);
  useEffect(() => {
    for (const tileset of state.world.tilesets) {
      if (!tileset.image) {
        console.warn(`Tileset ${tileset.name} did not have an image property`);
        continue;
      }
      imageStore.getImage(tileset.image);
    }
  }, [state.world.tilesets, imageStore]);
  const imageStoreAssetCache = imageStore.assetCache;

  const [tilesetsForGlTiled, selectionTilesetInfo] = useMemo(() => {
    let selectionTilesetInfo: SelectionTilesetInfo;
    const tilesets = produce(state.world.tilesets, (tilesets) => {
      selectionTilesetInfo = addSelectionToTilesets(tilesets, imageStore);
      for (const tileset of tilesets) {
        if (tileset.image && !imageStoreAssetCache[tileset.image]) {
          tileset.image = "";
        }
      }
    });
    return [tilesets, selectionTilesetInfo!];
  }, [state.world.tilesets, imageStore, imageStoreAssetCache]);

  const {
    makeSelectionLayer,
    handleStartSelect,
    handleMoveSelect,
    handleEndSelect,
  } = useSelection(selectionTilesetInfo);

  const [selectedLayerIds, setSelectedLayerIds] = useState<number[]>([]);
  useEffect(() => {
    if (!selectedLayerIds.length && state.world.layers.length) {
      setSelectedLayerIds((selectedLayerIds) => {
        if (!selectedLayerIds.length && state.world.layers.length) {
          return [_.last(state.world.layers)!.id];
        } else {
          return selectedLayerIds;
        }
      });
    }
  }, [selectedLayerIds, state.world.layers]);
  const defaultLayerId = _.last(selectedLayerIds);

  const selectionLayer = makeSelectionLayer(
    state.world.layers,
    myState?.selection,
    state.users
      .map((u) => u.selection)
      .filter((v) => v)
      .map((v) => v!),
  );

  let worldForGlTiled = {
    ...state.world,
    layers: [...state.world.layers],
    tilesets: tilesetsForGlTiled,
  };
  if (selectionLayer) {
    worldForGlTiled.layers.push(selectionLayer);
  }
  if (defaultLayerId) {
    const addCursor = (cursor: Cursor, highlightGid: number) => {
      worldForGlTiled.layers = addCursorOnNewLayers(
        worldForGlTiled.layers,
        cursor,
        defaultLayerId,
        highlightGid,
      );
    };
    for (const user of state.users) {
      if (user.id !== userId && user.cursor) {
        addCursor(user.cursor, selectionTilesetInfo.othersSelectionTileId);
      }
    }
    if (myState?.cursor) {
      addCursor(myState.cursor, selectionTilesetInfo.mySelectionTileId);
    }
  }
  worldForGlTiled.layers = worldForGlTiled.layers.filter((layer) => layer.visible);

  const windowSize = useWindowSize();
  const drawerWidth = 300;

  const setSelection = (selection: Rectangle | undefined) => {
    runAction((userId) => ({
      type: ActionType.SetSelection,
      userId,
      selection,
    }));
  };

  const setLayerVisibility = useCallback(
    (layerId: number, visibility: boolean) => {
      runAction(() => ({
        type: ActionType.SetLayerVisibility,
        layerId,
        visibility,
      }));
    }, [runAction]
  );

  const setCursor = useCallback(
    (cursor: Cursor) => {
      runAction((userId) => ({
        type: ActionType.SetCursor,
        userId,
        cursor,
      }));
    }, [runAction]
  );

  const onTileSetListSetCursor = useCallback(
    (cursor: Cursor) => {
      setEditingMode(EditingMode.Clone);
      setCursor(cursor);
    }, [setCursor]
  );

  useEffect(() => {
    if (!userId) return;
    const user = state.users.find((u) => u.id === userId);
    const cursor = user?.cursor;
    if (!cursor) return;

    if (
      cursor.contents.length === 1 &&
      selectedLayerIds.length === 1 &&
      cursor.contents[0].layerId !== selectedLayerIds[0]
    ) {
      // If there is only one layer in cursor and one layer selected, we paste it onto that selected layer
      const modifiedContent: CursorContent = {
        ...cursor.contents[0],
        layerId: selectedLayerIds[0],
      };
      runAction((userId) => ({
        type: ActionType.SetCursor,
        cursor: { ...cursor, contents: [modifiedContent] },
        userId,
      }));
    }
  }, [runAction, selectedLayerIds, state.users, userId]);

  const pointerDownRef = useRef<{ button: number }>();
  const panStartRef = useRef<{ down: Coordinates; originalOffset: Coordinates; }>();
  const [panOffset, setPanOffset] = useState<Coordinates>({ x: 0, y: 0 });

  const DEFAULT_ZOOM_LEVEL = 2;
  const ZOOM_LEVELS = [0.5, 1, 2, 4, 8];
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM_LEVEL);
  const zoomIn = (zoomX: number, zoomY: number, times: number=1) => {
    for (let i = 1; i < times+1; i++) {
      setPanOffset((prev) => {
        const zoom = ZOOM_LEVELS[zoomLevel + i] * tileSize;
        return {
          x: prev.x + zoomX * (windowSize.width-drawerWidth)  / zoom,
          y: prev.y + zoomY * windowSize.height / zoom,
        };
      });
      setZoomLevel((prev) => prev + 1);
    }
  }
  const zoomOut = (zoomX: number, zoomY: number, times: number=1) => {
    for (let i = 0; i < times; i++) {
      setPanOffset((prev) => {
        const zoom = -ZOOM_LEVELS[zoomLevel - i] * tileSize;
        return {
          x: prev.x + zoomX * (windowSize.width-drawerWidth)  / zoom,
          y: prev.y + zoomY * windowSize.height / zoom,
        };
      });
      setZoomLevel((prev) => prev - 1);
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <SidePanel
        state={state}
        userId={userId}
        selectedLayerIds={selectedLayerIds}
        setSelectedLayerIds={setSelectedLayerIds}
        setLayerVisibility={setLayerVisibility}
        setSelectedTileSet={setSelectedTileSet}
        selectedTileSet={selectedTileSet}
        imageStore={imageStore}
        onTileSetListSetCursor={onTileSetListSetCursor}
      />
      <TilemapDisplay
        zoomFactor={ZOOM_LEVELS[zoomLevel]}
        id={MAIN_CANVAS_ID}
        imageStore={imageStore}
        tilemap={worldForGlTiled}
        width={windowSize.width - drawerWidth}
        height={windowSize.height}
        offset={panOffset}
        tileSize={tileSize}
        onWheel={(e) => {
          e.stopPropagation();
          const scrollDelta = (e.deltaY < 0 ? 1 : -1);
          if (_.clamp(zoomLevel + scrollDelta, 0, ZOOM_LEVELS.length - 1) === zoomLevel) return;
          // adjust pan offset so that the zoom is centered on the mouse position
          const zoomX = e.clientX / (windowSize.width-drawerWidth);
          const zoomY = e.clientY / windowSize.height;
          scrollDelta > 0 ? zoomIn(zoomX, zoomY) : zoomOut(zoomX, zoomY);
        }}
        onPointerDown={(c, ev, nonOffsetCoordinates) => {
          ev.preventDefault();
          if (pointerDownRef.current) return;
          switch (ev.button) {
            case 0: // left click
              switch (editingMode) {
                case EditingMode.Clone:
                  startUndoGroup();
                  const cursor = myState?.cursor;
                  const defaultLayerId = _.last(selectedLayerIds);
                  if (cursor && defaultLayerId !== undefined) {
                    runAction((userId) => ({
                      type: ActionType.PasteFromCursor,
                      userId,
                      defaultLayerId,
                    }));
                  }
                  break;
                case EditingMode.Erase:
                  startUndoGroup();
                  runAction(() => ({
                    type: ActionType.FillRectangle,
                    layerIds: selectedLayerIds,
                    rectangle: { x: c.x, y: c.y, width: 1, height: 1 },
                    tileId: 0,
                  }));
                  break;
              }
              break;
            case 1: // middle click
              panStartRef.current = {
                down: nonOffsetCoordinates,
                originalOffset: panOffset,
              };
              break;
            case 2: // right click
              switch (editingMode) {
                case EditingMode.Clone:
                  handleStartSelect(c, setSelection);
                  break;
                case EditingMode.Erase:
                  handleStartSelect(c, setSelection);
                  break;
              }
              break;
          }
          pointerDownRef.current = { button: ev.button };
        }}
        onPointerUp={(c, ev) => {
          ev.preventDefault();
          if (!pointerDownRef.current) return;
          switch (pointerDownRef.current.button) {
            case 0: // left click
              switch (editingMode) {
                case EditingMode.Clone:
                  endUndoGroup();
                  break;
                case EditingMode.Erase:
                  endUndoGroup();
                  break;
              }
              break;
            case 1: // middle click
              break;
            case 2: // right click
              switch (editingMode) {
                case EditingMode.Clone:
                  handleEndSelect(setSelection);
                  const selection = myState?.selection;
                  if (selection && selection.width >= 1 && selection.height >= 1) {
                    const cursor = extractCursor(state.world, selection);
                    cursor.contents = cursor.contents.filter((c) => c.layerId === undefined || selectedLayerIds.includes(c.layerId));
                    setCursor(cursor);
                  }
                  break;
                case EditingMode.Erase:
                  const rectangleToErase = myState?.selection;
                  if (rectangleToErase) {
                    startUndoGroup();
                    runAction(() => ({
                      type: ActionType.FillRectangle,
                      layerIds: selectedLayerIds,
                      rectangle: rectangleToErase,
                      tileId: 0,
                    }));
                    endUndoGroup();
                  }
                  handleEndSelect(setSelection);
                  break;
              }
              break;
          }
          pointerDownRef.current = undefined;
          panStartRef.current = undefined;
        }}
        onPointerMove={(c, ev, nonOffsetCoordinates) => {
          if (panStartRef.current) {
            setPanOffset({
              x: panStartRef.current.originalOffset.x + panStartRef.current.down.x - nonOffsetCoordinates.x,
              y: panStartRef.current.originalOffset.y + panStartRef.current.down.y - nonOffsetCoordinates.y,
            });
          } else {
            switch (editingMode) {
              case EditingMode.Clone:
                handleMoveSelect(c, myState?.selection, setSelection);
                const oldCursor = myState?.cursor;
                if (oldCursor) {
                  const newFrameStart: Coordinates = {
                    x: c.x - (oldCursor.initialFrame.width - 1),
                    y: c.y - (oldCursor.initialFrame.height - 1),
                  };
                  if (
                    newFrameStart.x !== oldCursor.frame.x ||
                    newFrameStart.y !== oldCursor.frame.y
                  ) {
                    runAction((userId) => ({
                      type: ActionType.SetCursorOffset,
                      userId,
                      offset: newFrameStart,
                    }));
                    if (pointerDownRef.current) {
                      const defaultLayerId = _.last(selectedLayerIds);
                      if (defaultLayerId !== undefined) {
                        runAction((userId) => ({
                          type: ActionType.PasteFromCursor,
                          userId,
                          defaultLayerId,
                        }));
                      }
                    }
                  }
                }
                break;
              case EditingMode.Erase:
                if (pointerDownRef.current?.button === 0) {
                  runAction(() => ({
                    type: ActionType.FillRectangle,
                    layerIds: selectedLayerIds,
                    rectangle: { x: c.x, y: c.y, width: 1, height: 1 },
                    tileId: 0,
                  }));
                  setSelection({ x: c.x, y: c.y, width: 1, height: 1 });
                } else if (pointerDownRef.current?.button === 2) {
                  handleMoveSelect(c, myState?.selection, setSelection);
                } else if (!pointerDownRef.current) {
                  setSelection({ x: c.x, y: c.y, width: 1, height: 1 });
                }
                break;
            }
              
          }
        }}
      />
      <TopControlBar
        state={state}
        userId={userId}
        runAction={runAction}
        setEditingMode={setEditingMode}
      />
      <BottomControlBar
        defaultZoomLevel={DEFAULT_ZOOM_LEVEL}
        zoomLevel={zoomLevel}
        zoomLevels={ZOOM_LEVELS}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        tryUndo={tryUndo}
      />
    </ThemeProvider>
  );
}

export default App;