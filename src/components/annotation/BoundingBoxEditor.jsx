import React, { useState, useRef } from 'react';
import { Box, Slider, Typography, Grid } from '@mui/material';
import { annotationAPI } from '../../services/api';

const BoundingBoxEditor = ({ annotation, onUpdate }) => {
    const [coordinates, setCoordinates] = useState({
        x_min: annotation.x_min,
        y_min: annotation.y_min,
        x_max: annotation.x_max,
        y_max: annotation.y_max
    });

    const debounceTimeout = useRef(null);

    // Mettre à jour les coordonnées avec debounce
    const updateCoordinates = (newCoordinates) => {
        setCoordinates(newCoordinates);
        
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {
            annotationAPI.updateBoundingBox(annotation.id, newCoordinates)
                .then(() => {
                    if (onUpdate) onUpdate(newCoordinates);
                })
                .catch(error => {
                    console.error('Erreur lors de la mise à jour:', error);
                });
        }, 500);
    };

    // Gérer les changements de slider
    const handleSliderChange = (coord) => (event, value) => {
        const newCoordinates = { ...coordinates, [coord]: value };
        
        // Validation basique
        if (coord === 'x_min' && value >= coordinates.x_max) return;
        if (coord === 'x_max' && value <= coordinates.x_min) return;
        if (coord === 'y_min' && value >= coordinates.y_max) return;
        if (coord === 'y_max' && value <= coordinates.y_min) return;
        
        updateCoordinates(newCoordinates);
    };

    return (
        <Box sx={{ width: '100%', padding: 2 }}>
            <Typography variant="h6" gutterBottom>
                Modifier la boîte englobante
            </Typography>

            <Grid container spacing={2}>
                <Grid size={12}>
                    <Typography>X Min: {coordinates.x_min.toFixed(3)}</Typography>
                    <Slider
                        value={coordinates.x_min}
                        onChange={handleSliderChange('x_min')}
                        min={0}
                        max={1}
                        step={0.001}
                    />
                </Grid>
                
                <Grid size={12}>
                    <Typography>X Max: {coordinates.x_max.toFixed(3)}</Typography>
                    <Slider
                        value={coordinates.x_max}
                        onChange={handleSliderChange('x_max')}
                        min={0}
                        max={1}
                        step={0.001}
                    />
                </Grid>
                
                <Grid size={12}>
                    <Typography>Y Min: {coordinates.y_min.toFixed(3)}</Typography>
                    <Slider
                        value={coordinates.y_min}
                        onChange={handleSliderChange('y_min')}
                        min={0}
                        max={1}
                        step={0.001}
                    />
                </Grid>
                
                <Grid size={12}>
                    <Typography>Y Max: {coordinates.y_max.toFixed(3)}</Typography>
                    <Slider
                        value={coordinates.y_max}
                        onChange={handleSliderChange('y_max')}
                        min={0}
                        max={1}
                        step={0.001}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default BoundingBoxEditor;