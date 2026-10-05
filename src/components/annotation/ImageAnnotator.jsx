import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import { Stage, Layer, Rect, Transformer, Image as KonvaImage, Group } from 'react-konva';
import { annotationAPI } from '../../services/api';

// Nouvelle fonction de validation
const validateAnnotations = (annotations) => {
  return annotations.every(
    (ann) => ann.label.trim() && ann.x_max > ann.x_min && ann.y_max > ann.y_min,
  );
};

const BoundingBox = ({ annotation, isSelected, onSelect, onChange, imageScale, stageRef }) => {
  const shapeRef = useRef();
  const transformerRef = useRef();

  useEffect(() => {
    if (isSelected && transformerRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // Définir la couleur en fonction du type d'annotation
  const boxColor = annotation.type === 'yolo' ? '#00ff00' : '#ff0000';
  const boxOpacity = annotation.type === 'yolo' ? 0.3 : 0.2;

  return (
    <>
      <Rect
        ref={shapeRef}
        x={annotation.x_min * imageScale.width}
        y={annotation.y_min * imageScale.height}
        width={(annotation.x_max - annotation.x_min) * imageScale.width}
        height={(annotation.y_max - annotation.y_min) * imageScale.height}
        fill={boxColor}
        opacity={boxOpacity}
        stroke={boxColor}
        strokeWidth={2}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          const node = e.target;
          const scaleX = 1 / imageScale.width;
          const scaleY = 1 / imageScale.height;

          onChange({
            ...annotation,
            x_min: node.x() * scaleX,
            y_min: node.y() * scaleY,
            x_max: (node.x() + node.width()) * scaleX,
            y_max: (node.y() + node.height()) * scaleY,
          });
        }}
        onTransformEnd={(e) => {
          const node = e.target;
          const scaleX = 1 / imageScale.width;
          const scaleY = 1 / imageScale.height;

          onChange({
            ...annotation,
            x_min: node.x() * scaleX,
            y_min: node.y() * scaleY,
            x_max: (node.x() + node.width()) * scaleX,
            y_max: (node.y() + node.height()) * scaleY,
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            return newBox;
          }}
        />
      )}
    </>
  );
};

const BoundingBoxEditor = ({ annotation, onUpdate }) => {
  const [label, setLabel] = useState(annotation.label || '');

  useEffect(() => {
    setLabel(annotation.label || '');
  }, [annotation]);

  const handleLabelChange = (e) => {
    const newLabel = e.target.value;
    setLabel(newLabel);
    onUpdate({
      ...annotation,
      label: newLabel,
    });
  };

  return (
    <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Typography variant="subtitle1" gutterBottom>
        Éditer l'annotation
      </Typography>
      <TextField
        fullWidth
        label="Label"
        value={label}
        onChange={handleLabelChange}
        margin="normal"
        size="small"
        placeholder="Entrez un label pour cette annotation"
      />
      <Typography variant="caption" color="textSecondary">
        Position: ({(annotation.x_min * 100).toFixed(1)}%, {(annotation.y_min * 100).toFixed(1)}%) -
        ({(annotation.x_max * 100).toFixed(1)}%, {(annotation.y_max * 100).toFixed(1)}%)
      </Typography>
    </Box>
  );
};

const ImageAnnotator = ({ image, onSave, existingAnnotations = [] }) => {
  const [annotations, setAnnotations] = useState(existingAnnotations);
  const [selectedId, setSelectedId] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [imageObj, setImageObj] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const stageRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = image.image_url;
    img.onload = () => {
      setImageObj(img);
      setImageLoaded(true);

      // Calculer l'échelle pour adapter l'image à la fenêtre
      const maxWidth = window.innerWidth * 0.8;
      const maxHeight = window.innerHeight * 0.6;
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
      setScale(scale);
    };
  }, [image]);

  const handleMouseDown = (e) => {
    if (!drawing) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const { x, y } = point;

    setStartPoint({ x, y });
  };

  const handleMouseMove = (e) => {
    if (!drawing || !startPoint) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const { x, y } = point;

    const width = x - startPoint.x;
    const height = y - startPoint.y;

    const annotation = {
      x_min: Math.min(startPoint.x, x) / (stage.width() * scale),
      y_min: Math.min(startPoint.y, y) / (stage.height() * scale),
      x_max: Math.max(startPoint.x, x) / (stage.width() * scale),
      y_max: Math.max(startPoint.y, y) / (stage.height() * scale),
      label: '',
    };

    // Mettre à jour la dernière annotation
    setAnnotations((prev) => {
      const newAnnotations = [...prev];
      newAnnotations[newAnnotations.length - 1] = annotation;
      return newAnnotations;
    });
  };

  const handleMouseUp = () => {
    if (!drawing) return;
    setDrawing(false);
    setStartPoint(null);
  };

  const startDrawing = () => {
    setDrawing(true);
    setAnnotations((prev) => [...prev, {}]);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(
        annotations.filter((ann) => ann.label && ann.x_max > ann.x_min && ann.y_max > ann.y_min),
      );
    }
  };

  if (!imageLoaded) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={startDrawing} disabled={drawing}>
          Dessiner une annotation
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={!annotations.length}
        >
          Sauvegarder les annotations
        </Button>
      </Box>

      <Stage
        width={imageObj.width * scale}
        height={imageObj.height * scale}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={stageRef}
      >
        <Layer ref={layerRef}>
          <KonvaImage
            image={imageObj}
            width={imageObj.width * scale}
            height={imageObj.height * scale}
          />
          {annotations.map((ann, i) => (
            <BoundingBox
              key={i}
              annotation={ann}
              isSelected={i === selectedId}
              onSelect={() => setSelectedId(i)}
              onChange={(newAnn) => {
                const newAnnotations = [...annotations];
                newAnnotations[i] = newAnn;
                setAnnotations(newAnnotations);
              }}
              imageScale={{ width: imageObj.width * scale, height: imageObj.height * scale }}
              stageRef={stageRef}
            />
          ))}
        </Layer>
      </Stage>

      <Box sx={{ mt: 2 }}>
        {selectedId !== null && (
          <BoundingBoxEditor
            annotation={annotations[selectedId]}
            onUpdate={(newAnn) => {
              const newAnnotations = [...annotations];
              newAnnotations[selectedId] = newAnn;
              setAnnotations(newAnnotations);
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default ImageAnnotator;
