import { Drawer, Divider, Box, Button, ListSubheader, Typography } from "@mui/material";
import downloadFile from "js-file-download";
import { IoGridSharp } from "react-icons/io5";

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

  const drawerWidth = 300;

  return (
    <Drawer
      anchor="right"
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
        },
      }}
    >
      <Box p={1} mx={"auto"}>
        <Typography variant="h5" sx={{ display: "flex", alignItems: "center" }}>
          <IoGridSharp />&nbsp;<b>Vertiled</b>&nbsp;&nbsp;&nbsp;
        </Typography>
      </Box>
      <Divider />
      <LayerList
        selectedLayerIds={selectedLayerIds}
        setSelectedLayerIds={setSelectedLayerIds}
        layers={state.world.layers}
        onToggleVisibility={setLayerVisibility}
      />
      <Divider sx={{ mb: 2 }} />
      <TileSetList
        tilesets={state.world.tilesets}
        imageStore={imageStore}
        setSelectedTileSet={setSelectedTileSet}
        selectedTileSetIndex={selectedTileSet}
        onSelectTiles={onTileSetListSetCursor}
      />
      <div style={{ flexGrow: 1 }} />
      <Divider sx={{ mt: 2 }} />
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