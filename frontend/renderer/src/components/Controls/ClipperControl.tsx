import { FC, useEffect, useState, useCallback } from "react";
import { Components, World } from "@thatopen/components";
import * as OBC from "@thatopen/components";
import * as THREE from "three";
import { Paper, Box, Typography, Checkbox, TextField, Button, FormControlLabel } from "@mui/material";

interface ClipperControlProps {
  components: Components;
  world: World;
  container: HTMLElement; 
}

export const ClipperControl: FC<ClipperControlProps> = ({ components, world, container }) => {
  const clipper = components.get(OBC.Clipper);

  // États contrôlés pour les options du clipper
  const [enabled, setEnabled] = useState<boolean>(true);
  const [visible, setVisible] = useState<boolean>(true);
  const [color, setColor] = useState<string>("#a855ac");
  const [opacity, setOpacity] = useState<number>(0.2);
  const [size, setSize] = useState<number>(5);

  // Met à jour la configuration et force le rafraîchissement du clipper
  useEffect(() => {
    if (clipper) {
      clipper.config.enabled = enabled;
      clipper.config.visible = visible;
      clipper.config.color = new THREE.Color(color);
      clipper.config.opacity = opacity;
      clipper.config.size = size;
      console.debug("Configuration mise à jour :", { enabled, visible, color, opacity, size });
      
      // Force le rafraîchissement du plan de coupe
      if (clipper.config.visible && clipper.delete && clipper.create) {
        clipper.delete(world);
        clipper.create(world);
      }
    }
  }, [enabled, visible, color, opacity, size, clipper, world]);

  // Écouteurs globaux pour le double-clic et le clavier
  useEffect(() => {
    if (!components || !world || !container || !clipper) return;

    const handleDoubleClick = () => {
      if (clipper.config.enabled && clipper.create) {
        clipper.create(world);
        console.debug("Plan de coupe créé via double-clic.");
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.code === "Delete" || event.code === "Backspace") &&
        clipper.config.enabled &&
        clipper.delete
      ) {
        clipper.delete(world);
        console.log("Plan de coupe supprimé via clavier.");
      }
    };

    container.addEventListener("dblclick", handleDoubleClick);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("dblclick", handleDoubleClick);
      window.removeEventListener("keydown", handleKeyDown);
      if (clipper.dispose) clipper.dispose();
    };
  }, [components, world, container, clipper]);

  // Callback pour supprimer tous les plans de coupe
  const handleDeleteAll = useCallback(() => {
    if (clipper && clipper.deleteAll) {
      clipper.deleteAll();
      console.debug("Tous les plans de coupe ont été supprimés.");
    }
  }, [clipper]);

  return (
    <Paper elevation={3} sx={{ p: 2, m: 1, maxWidth: 300 }}>
      <Typography variant="h6" gutterBottom>
        Clipper Control
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2">Commands</Typography>
        <Typography variant="body2">Double-clic sur la scène : Créer un plan de coupe</Typography>
        <Typography variant="body2">Touche Delete/Backspace : Supprimer un plan de coupe</Typography>
      </Box>
      <Box>
        <Typography variant="subtitle2">Options</Typography>
        <TextField
          label="Planes Color"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          fullWidth
          margin="dense"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
          }
          label="Clipper enabled"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
            />
          }
          label="Clipper visible"
        />

        <TextField
          label="Planes opacity"
          type="number"
          value={opacity}
          inputProps={{ step: "0.01", min: "0.1", max: "1" }}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          fullWidth
          margin="dense"
        />
        <TextField
          label="Planes size"
          type="number"
          value={size}
          inputProps={{ step: "0.1", min: "2", max: "10" }}
          onChange={(e) => setSize(parseFloat(e.target.value))}
          fullWidth
          margin="dense"
        />
        <Button variant="contained" color="secondary" onClick={handleDeleteAll} sx={{ mt: 2 }}>
          Delete all
        </Button>
      </Box>
    </Paper>
  );
};