import {
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  ListSubheader,
  Tooltip,
} from "@mui/material";
import { ILayer } from "gl-tiled";
import { last, reverse } from "lodash";
import React from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { isLayerRegular } from "vertiled-shared";

interface Props {
  layers: ILayer[];
  selectedLayerIds: number[];
  setSelectedLayerIds: (selectedLayerIds: number[]) => void;
  onToggleVisibility: (layerId: number, v: boolean) => void;
}

function _LayerList({
  layers,
  selectedLayerIds,
  setSelectedLayerIds,
  onToggleVisibility,
}: Props) {
  return (
    <div>
      <List
        subheader={<ListSubheader disableSticky>Layer</ListSubheader>}
        dense
      >
        {reverse(layers).map((layer, i) => (
          <ListItem
            button
            dense
            selected={selectedLayerIds.includes(layer.id)}
            key={layer.id}
            onClick={(ev) => {
              if (ev.ctrlKey || ev.metaKey) {
                const newSelectedLayerIds = selectedLayerIds.filter(
                  (id) => id !== layer.id,
                );
                if (!selectedLayerIds.includes(layer.id)) {
                  newSelectedLayerIds.push(layer.id);
                }
                setSelectedLayerIds(newSelectedLayerIds);
              } else {
                setSelectedLayerIds([layer.id]);
              }
            }}
          >
            <ListItemText
              primary={layer.name + (isLayerRegular(layer) ? "" : " (special)")}
              style={
                layer.id === last(selectedLayerIds)
                  ? { textDecoration: "underline" }
                  : undefined
              }
            />
            <Tooltip title="Toggle visibility" aria-label="Toggle visibility">
              <ListItemSecondaryAction
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(layer.id, !layer.visible);
                }}
              >
                <IconButton
                  edge="end"
                  aria-label="Toggle visibility"
                  size="small"
                >
                  {layer.visible ? <FiEye /> : <FiEyeOff />}
                </IconButton>
              </ListItemSecondaryAction>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    </div>
  );
}

export const LayerList = React.memo(_LayerList);
