import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { throttle } from 'lodash';

const DiamondOverlay = ({
    diamondSize = 60,
    baseOpacity = 0.03,
    hoverOpacity = 1,
    pulseOpacity = 1, // Typically higher than hoverOpacity
    pulseInterval = 1000, // How often to initiate new pulses
    numPulsingDiamonds = 3, // How many new diamonds to "press" each interval
    pulseDuration = 2000, // How long a diamond stays bright ("pressed") in ms
    pulseStagger = 600, // Stagger delay between diamonds in the same pulse batch (ms)
    hoverRadius = 200,
    diamondColor = 'rgba(200, 220, 255, 0.8)',
    transitionDuration = '10s', // CSS transition speed for opacity changes
}) => {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [mousePos, setMousePos] = useState(null);
    const svgRef = useRef(null);

    const [activePulseDiamondIds, setActivePulseDiamondIds] = useState(new Set());
    const activePulseDiamondIdsRef = useRef(activePulseDiamondIds); // Ref for interval access
    const pulseTimeoutRefs = useRef(new Map()); // To store setTimeout IDs for individual pulses

    useEffect(() => {
        activePulseDiamondIdsRef.current = activePulseDiamondIds;
    }, [activePulseDiamondIds]);

    useEffect(() => {
        const svgElement = svgRef.current;
        if (!svgElement) return;

        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setDimensions({ width, height });
            }
        });
        resizeObserver.observe(svgElement);
        return () => resizeObserver.disconnect();
    }, []);

    const diamonds = useMemo(() => {
        // ... (diamond generation logic remains the same)
        if (!dimensions.width || !dimensions.height) return [];
        const S = diamondSize;
        const diamondList = [];
        const numCols = Math.ceil(dimensions.width / S) + 2;
        const numRows = Math.ceil(dimensions.height / S) + 2;
        for (let r = -1; r < numRows; r++) {
            for (let c = -1; c < numCols; c++) {
                if ((r + c) % 2 !== 0) continue;
                const cx = c * S;
                const cy = r * S;
                if (cx < -S*2 || cx > dimensions.width + S*2 || cy < -S*2 || cy > dimensions.height + S*2) {
                    continue;
                }
                const pathD = `M${cx},${cy - S} L${cx + S},${cy} L${cx},${cy + S} L${cx - S},${cy} Z`;
                diamondList.push({ id: `d-${r}-${c}`, path: pathD, cx, cy });
            }
        }
        return diamondList;
    }, [dimensions, diamondSize]);

    const handleMouseMove = useCallback(throttle((event) => {
        if (svgRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            setMousePos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
        }
    }, 50), []);

    const handleMouseLeave = useCallback(() => {
        setMousePos(null);
    }, []);

    // New Pulsing effect for "tactile" feel
    useEffect(() => {
        if (diamonds.length === 0 || numPulsingDiamonds === 0 || pulseInterval <= 0) return;

        const intervalId = setInterval(() => {
            const currentActiveIds = activePulseDiamondIdsRef.current;
            const availableDiamonds = diamonds.filter(d => !currentActiveIds.has(d.id));

            if (availableDiamonds.length === 0) return;

            for (let i = 0; i < numPulsingDiamonds; i++) {
                if (availableDiamonds.length === 0) break;

                const randomIndex = Math.floor(Math.random() * availableDiamonds.length);
                const diamondToPulse = availableDiamonds.splice(randomIndex, 1)[0];

                // Stagger the activation of each diamond in this batch
                const activationDelay = i * pulseStagger;

                setTimeout(() => {
                    // Clear any existing timeout for this diamond (safety, unlikely needed with filtering)
                    if (pulseTimeoutRefs.current.has(diamondToPulse.id)) {
                        clearTimeout(pulseTimeoutRefs.current.get(diamondToPulse.id));
                    }

                    // Add to active pulses
                    setActivePulseDiamondIds(prevIds => {
                        const newIds = new Set(prevIds);
                        newIds.add(diamondToPulse.id);
                        return newIds;
                    });

                    // Schedule removal
                    const timerId = setTimeout(() => {
                        setActivePulseDiamondIds(prevIds => {
                            const newIds = new Set(prevIds);
                            newIds.delete(diamondToPulse.id);
                            return newIds;
                        });
                        pulseTimeoutRefs.current.delete(diamondToPulse.id);
                    }, pulseDuration);
                    pulseTimeoutRefs.current.set(diamondToPulse.id, timerId);
                }, activationDelay);
            }
        }, pulseInterval);

        return () => {
            clearInterval(intervalId);
            pulseTimeoutRefs.current.forEach(timerId => clearTimeout(timerId));
            pulseTimeoutRefs.current.clear();
        };
    }, [diamonds, numPulsingDiamonds, pulseInterval, pulseDuration, pulseStagger]); // Dependencies for interval setup

    return (
        <svg
            ref={svgRef}
            width="100%"
            height="100%"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
        >
            {diamonds.map(diamond => {
                const isPulsing = activePulseDiamondIds.has(diamond.id);
                let currentOpacity = baseOpacity;

                // Calculate hover effect first
                let hoverEffectOpacity = baseOpacity;
                if (mousePos) {
                    const dist = Math.sqrt(
                        Math.pow(diamond.cx - mousePos.x, 2) +
                        Math.pow(diamond.cy - mousePos.y, 2)
                    );
                    if (dist < hoverRadius) {
                        const proximityFactor = Math.max(0, 1 - dist / hoverRadius);
                        hoverEffectOpacity = baseOpacity + (hoverOpacity - baseOpacity) * proximityFactor * proximityFactor;
                    }
                }
                currentOpacity = hoverEffectOpacity;

                // If pulsing, it takes precedence or uses the higher pulseOpacity
                if (isPulsing) {
                    currentOpacity = pulseOpacity;
                }
                // When isPulsing becomes false, it will revert to hoverEffectOpacity or baseOpacity
                // The CSS transition handles the smooth change.

                return (
                    <path
                        key={diamond.id}
                        d={diamond.path}
                        fill={diamondColor}
                        fillOpacity={currentOpacity}
                        style={{ transition: `fill-opacity ${transitionDuration} ease-out` }}
                    />
                );
            })}
        </svg>
    );
};

export default DiamondOverlay;