import { Box, Button, ButtonGroup } from "@mui/material";
import { FaRegClone } from "react-icons/fa";
import { BiMenu, BiEraser } from "react-icons/bi";
import { CgEditFlipH, CgEditFlipV } from "react-icons/cg";

import { State } from "vertiled-shared";

enum EditingMode {
  Clone = "Clone",
  Erase = "Erase",
}

interface Props {
  state: State;
  userId: string | undefined;
  setEditingMode: (mode: EditingMode) => void;
}
  
export const TopControlBar: React.FC<Props> = ({
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
          >
            <BiMenu size='20px'/>ㅤ
          </Button>
        </ButtonGroup>
      </Box>
      <Box m={2} ml={0}>
        <ButtonGroup
          size="small"
          variant="contained"
          aria-label="Drawing Controls"
        >
          <Button
            startIcon={<FaRegClone size='20px'/>}
            onClick={() => {setEditingMode(EditingMode.Clone)}}
          >
            Clone
          </Button>

          <Button
            startIcon={<BiEraser size='20px'/>}
            onClick={() => {setEditingMode(EditingMode.Erase)}}
          >
            Erase
          </Button>
        </ButtonGroup>
      </Box>
    </div>
  );
}
