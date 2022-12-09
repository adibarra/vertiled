import {
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import { ITileset } from "gl-tiled";
import React, { useMemo, useState } from "react";
import {
  createTilemapForTilesetPreview,
  Cursor,
  extractCursor,
  isLayerRegular,
  Rectangle,
  tileSize,
} from "vertiled-shared";
import { ImageStore } from "../image-store";
import { addSelectionToTilesets, useSelection } from "../useSelection";
import { TilemapDisplay } from "./TilemapDisplay";

interface Props {
  tilesets: ITileset[];
  setSelectedTileSet: (tileset: number) => void;
  selectedTileSetIndex: number;
  imageStore: ImageStore;
  onSelectTiles: (cursor: Cursor) => void;
}

function _TileSetList({
  tilesets,
  selectedTileSetIndex,
  setSelectedTileSet,
  imageStore,
  onSelectTiles,
}: Props) {
  const selectedTileSet = tilesets[selectedTileSetIndex] as
    | ITileset
    | undefined;

  const [tilesetsForGlTiled, selectionTilesetInfo] = useMemo(() => {
    const tilesetsForGlTiled = [];
    if (selectedTileSet) {
      tilesetsForGlTiled.push(selectedTileSet);
    }
    const selectionTilesetInfo = addSelectionToTilesets(
      tilesetsForGlTiled,
      imageStore,
    );
    return [tilesetsForGlTiled, selectionTilesetInfo];
  }, [selectedTileSet, imageStore]);

  const {
    makeSelectionLayer,
    handleStartSelect,
    handleMoveSelect,
    handleEndSelect,
  } = useSelection(selectionTilesetInfo);

  const [selection, setSelection] = useState<Rectangle>();

  const tilemap = useMemo(() => {
    if (!selectedTileSet) {
      return undefined;
    }
    const tilemap = createTilemapForTilesetPreview(
      selectedTileSet,
      tilesetsForGlTiled,
    );
    const selectionLayer = makeSelectionLayer(tilemap.layers, selection, []);
    if (selectionLayer) {
      tilemap.layers.push(selectionLayer);
    }
    return tilemap;
  }, [selectedTileSet, tilesetsForGlTiled, selection, makeSelectionLayer]);

  const dataLayer =
    tilemap && isLayerRegular(tilemap.layers[0])
      ? tilemap.layers[0]
      : undefined;

  const PREVIEW_DISPLAY_SIZE = 270;

  const previewWidth = Math.max(
    (dataLayer?.width ?? 10) * 32,
    PREVIEW_DISPLAY_SIZE,
  );
  const previewHeight = Math.max(
    (dataLayer?.height ?? 10) * 32,
    PREVIEW_DISPLAY_SIZE,
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', width:'max-content' }}>
      <FormControl variant="outlined" style={{ margin: 2 }}>
        <InputLabel id="tilesets-select-label">Tileset</InputLabel>
        <Select
          labelId="tilesets-select-label"
          value={selectedTileSetIndex}
          onChange={(ev) => {
            setSelectedTileSet(ev.target.value as number);
          }}
          label="Tileset"
        >
          {tilesets.map((tileset, i) => (
            <MenuItem key={i} value={i}>
              {tileset.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <div style={{ height: 10 }} />
      {tilesets[selectedTileSetIndex] && (
        <div style={{ display: "flex", justifyContent: "center", width: "300px" }}>
          {tilemap && (
            <div style={{ height: PREVIEW_DISPLAY_SIZE, width: PREVIEW_DISPLAY_SIZE, overflow: "scroll" }}>
              <TilemapDisplay
                imageStore={imageStore}
                tilemap={tilemap}
                width={previewWidth}
                height={previewHeight}
                offset={{ x: 0, y: 0 }}
                tileSize={tileSize}
                onWheel={() => {}}
                onPointerDown={(c, ev) => {
                  if (ev.button === 0) {
                    ev.preventDefault();
                    handleStartSelect(c, setSelection);
                  }
                }}
                onPointerUp={(c, ev) => {
                  if (ev.button === 0) {
                    ev.preventDefault();
                    handleEndSelect(setSelection);
                    if (selection && selectedTileSet) {
                      const cursor = extractCursor(
                        createTilemapForTilesetPreview(selectedTileSet, [
                          selectedTileSet,
                        ]),
                        selection,
                      );
                      for (const item of cursor.contents) {
                        item.layerId = undefined;
                      }
                      onSelectTiles(cursor);
                    }
                  }
                }}
                onPointerMove={(c, ev) => {
                  handleMoveSelect(c, selection, setSelection);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const TileSetList = React.memo(_TileSetList);
