import { Drawer, Divider, Box, Button, ListSubheader } from "@mui/material";
import { ILayer, ITileset } from "gl-tiled";
import downloadFile from "js-file-download";

import { Cursor, State } from "vertiled-shared";

import { ImageStore } from "../image-store";

import { LayerList } from "./LayerList";
import { TileSetList } from "./TileSetList";

interface Props {
  state: State;
  userId: string | undefined;
  selectedLayerIds: number[];
  setSelectedLayerIds: (ids: number[]) => void;
  setLayerVisibility: (id: number, visible: boolean) => void;
  setSelectedTileSet: (tileset: number) => void;
  selectedTileSet: number;
  imageStore: ImageStore;
  onTileSetListSetCursor: (cursor: Cursor) => void;
}
  
export const SidePanel: React.FC<Props> = ({
  state,
  userId,
  selectedLayerIds,
  setSelectedLayerIds,
  setLayerVisibility,
  setSelectedTileSet,
  selectedTileSet,
  imageStore,
  onTileSetListSetCursor,
}) => {
  return (
    <Drawer
      anchor="right"
      open={true}
      variant="persistent"
      sx={{ flexShrink: 1 }}
    >
      <LayerList
        selectedLayerIds={selectedLayerIds}
        setSelectedLayerIds={setSelectedLayerIds}
        layers={state.world.layers}
        onToggleVisibility={setLayerVisibility}
      />
      <Divider></Divider>
      <TileSetList
        tilesets={state.world.tilesets}
        imageStore={imageStore}
        setSelectedTileSet={setSelectedTileSet}
        selectedTileSetIndex={selectedTileSet}
        onSelectTiles={onTileSetListSetCursor}
      />
      <Divider />
      <ListSubheader disableSticky>Debug</ListSubheader>
      <Box px={2}>
        <div>Connected users: {state.users.length}</div>
        <div>UserId: {userId}</div>
        <Button
          onClick={() => downloadFile(JSON.stringify(state.world, null, 2),"main.json","application/json")}
        >
          Download as JSON
        </Button>
      </Box>
    </Drawer>
  );
}