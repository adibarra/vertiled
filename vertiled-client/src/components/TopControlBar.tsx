import { Box, Button, ButtonGroup } from "@mui/material";
import { BiMenu, BiCopy, BiEraser } from "react-icons/bi";
import { CgEditFlipH, CgEditFlipV } from "react-icons/cg";

import { State, mirrorCursor, MirrorDirection, ActionType } from "vertiled-shared";

enum EditingMode {
  Clone = "Clone",
  Erase = "Erase",
}

interface Props {
  state: State;
  userId: string | undefined;
  runAction: any;
  editingMode: EditingMode;
  setEditingMode: (mode: EditingMode) => void;
}
  
export const TopControlBar: React.FC<Props> = ({
  state,
  userId,
  runAction,
  editingMode,
  setEditingMode,
}) => {
  return (
    <div style={{ position:'absolute', left:0, top:0, display:'flex', flexDirection:'row' }}>
      <Box m={2} mr={1}>
        <ButtonGroup
          size="small"
          variant="contained"
          aria-label="Menu"
        >
          <Button
            aria-label="menu"
            onClick={() => {}}
            title="Menu"
          >
            <BiMenu size='20px'/>ㅤ
          </Button>
        </ButtonGroup>
      </Box>
      <Box m={2} ml={0} mr={1}>
        <ButtonGroup
          size="small"
          variant="contained"
          aria-label="Drawing Controls"
        >
          <Button
            startIcon={<BiCopy/>}
            onClick={() => {setEditingMode(EditingMode.Clone)}}
            variant={editingMode === EditingMode.Clone ? "contained" : "outlined"}
            title="Clone"
          >
            Clone
          </Button>
          <Button
            startIcon={<BiEraser/>}
            onClick={() => {setEditingMode(EditingMode.Erase)}}
            variant={editingMode === EditingMode.Erase ? "contained" : "outlined"}
            title="Erase"
          >
            Erase
          </Button>
        </ButtonGroup>
      </Box>
      <Box m={2} ml={0} mr={1}>
        <ButtonGroup
          size="small"
          variant="contained"
          aria-label="Drawing Controls"
        >
          <Button
            disabled={!state.users.find((u) => u.id === userId)?.cursor}
            startIcon={<CgEditFlipH/>}
            onClick={() => {
              if (!userId) return;
              const cursor = state.users.find((u) => u.id === userId)?.cursor;
              if (!cursor) return;
              runAction((userId: string) => {
                return {
                  type: ActionType.SetCursor,
                  userId,
                  cursor: mirrorCursor(cursor, MirrorDirection.Horizontal),
                };
              });
            }}
            title="Flip Horizontal"
          >
            Flip H.
          </Button>
          <Button
            disabled={!state.users.find((u) => u.id === userId)?.cursor}
            startIcon={<CgEditFlipV/>}
            onClick={() => {
              if (!userId) return;
              const cursor = state.users.find((u) => u.id === userId)?.cursor;
              if (!cursor) return;
              runAction((userId: any) => {
                return {
                  type: ActionType.SetCursor,
                  userId,
                  cursor: mirrorCursor(cursor, MirrorDirection.Vertical),
                };
              });
            }}
            title="Flip Vertical"
          >
            Flip V.
          </Button>
        </ButtonGroup>
      </Box>
    </div>
  );
}
