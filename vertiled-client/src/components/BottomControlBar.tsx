import { Box, Button, ButtonGroup } from "@mui/material";
import { BiPlus, BiMinus, BiUndo, BiRedo } from "react-icons/bi";

interface Props {
  defaultZoomLevel: number;
  zoomLevel: number;
  zoomLevels: number[];
  zoomIn: (zoomX: number, zoomY: number, times?: number) => void;
  zoomOut: (zoomX: number, zoomY: number, times?: number) => void;
  tryUndo: () => void;
}
  
export const BottomControlBar: React.FC<Props> = ({
  defaultZoomLevel,
  zoomLevel,
  zoomLevels,
  zoomIn,
  zoomOut,
  tryUndo,
}) => {
  return (
    <div style={{position:'absolute', left:'0', bottom:'0', display:'flex', flexDirection:'row'}}>
      <Box m={2} mr={1}>
        <ButtonGroup
          size="medium"
          variant="contained"
          aria-label="Zoom Controls"
        >
          <Button
            aria-label="Zoom Out"
            disabled={zoomLevel === 0}
            onClick={() => zoomOut(0.5, 0.5)}
          >
            <BiMinus size='20px'/>ㅤ
          </Button>
          <Button
            aria-label="Reset Zoom"
            onClick={() => {
              if (zoomLevel === defaultZoomLevel) return;
              const zoomedIn = zoomLevel > defaultZoomLevel;
              const times = Math.abs(zoomLevel - defaultZoomLevel);
              if (zoomedIn) zoomOut(0.5, 0.5, times);
              else zoomIn(0.5, 0.5, times);
            }}
          >
            {zoomLevels[zoomLevel]}x
          </Button>
          <Button
            aria-label="Zoom In"
            disabled={zoomLevel === zoomLevels.length - 1}
            onClick={() => zoomIn(0.5, 0.5)}
          >
            <BiPlus size='20px'/>ㅤ
          </Button>
        </ButtonGroup>
      </Box>
      <Box m={2} ml={0}>
        <ButtonGroup
          size="medium"
          variant="contained"
          aria-label="Undo Controls"
        >
          <Button
            aria-label="Undo"
            onClick={() => tryUndo()}
          >
           <BiUndo size='20px'/>ㅤ
          </Button>
          <Button
            aria-label="Redo"
            disabled
            onClick={() => {}}
          >
           <BiRedo size='20px'/>ㅤ
          </Button>
        </ButtonGroup>
      </Box>
    </div>
  );
}
