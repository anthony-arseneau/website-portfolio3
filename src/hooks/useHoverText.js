import { useState } from 'react';

export function useHoverText() {
    const [showTextarea, setShowTextarea] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [hoverText, setHoverText] = useState('');

    const handleMouseMove = (e, text) => {
        setShowTextarea(true);
        setHoverText(text);
        setPosition({ x: e.pageX + 15, y: e.pageY + 15 });
    };

    const handleMouseLeave = () => {
        setShowTextarea(false);
    };

    return {
        showTextarea,
        position,
        hoverText,
        handleMouseMove,
        handleMouseLeave
    };
}
