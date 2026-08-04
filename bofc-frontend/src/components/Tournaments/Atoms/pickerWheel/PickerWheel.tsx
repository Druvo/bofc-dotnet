import React, { useEffect, useState, useRef, useCallback } from "react";

interface WheelComponentProps {
    segments: string[];
    segColors: string[];
    onFinished: (segment: string) => void;
    primaryColor?: string;
    contrastColor?: string;
    buttonText?: string;
    isOnlyOnce?: boolean;
    size?: number;
    upDuration?: number;
    downDuration?: number;
    fontFamily?: string;
    maxHeight?: number;
    maxWidth?: number;
    centerImageSrc?: string;
    fontSize?: number;
    wheelBackground?: string;
}

const PickerWheel: React.FC<WheelComponentProps> = ({
    segments,
    segColors,
    onFinished,
    primaryColor = "black",
    contrastColor = "white",
    buttonText = "Spin",
    isOnlyOnce = false,
    size = 150,
    upDuration = 100,
    downDuration = 600,
    fontFamily = "proxima-nova",
    maxHeight = 400,
    maxWidth = 400,
    centerImageSrc,
    fontSize = 20,
    wheelBackground = "linear-gradient(135deg, #4a5568 0%, #2d3748 100%)",
}) => {
    const [isFinished, setFinished] = useState(false);
    const [currentSegment, setCurrentSegment] = useState<string>(segments[0]);
    const isStartedRef = useRef<boolean>(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);
    const timerHandleRef = useRef<number | null>(null);

    const angleCurrentRef = useRef<number>(0);
    const angleDeltaRef = useRef<number>(0);
    const spinStartRef = useRef<number>(0);
    const framesRef = useRef<number>(0);

    const centerX = maxWidth / 2;
    const centerY = maxHeight / 2;

    const timerDelay = segments.length;
    const maxSpeed = Math.PI / segments.length;
    const upTime = segments.length * upDuration;
    const downTime = segments.length * downDuration;

    const wheelInit = useCallback(() => {
        if (canvasRef.current) {
            canvasContextRef.current = canvasRef.current.getContext("2d");
            canvasRef.current.width = maxWidth;
            canvasRef.current.height = maxHeight;
        }
        wheelDraw();
    }, [maxWidth, maxHeight]);

    useEffect(() => {
        wheelInit();
        return () => {
            if (timerHandleRef.current) {
                clearInterval(timerHandleRef.current);
            }
        };
    }, [wheelInit]);

    useEffect(() => {
        wheelDraw();
    }, [segments, segColors]);

    const spin = () => {
        if (segments.length < 2) return; // Disable spin if less than 2 segments
        if (!isStartedRef.current && (!isOnlyOnce || !isFinished)) {
            isStartedRef.current = true;
            setFinished(false);
            if (!timerHandleRef.current) {
                spinStartRef.current = new Date().getTime();
                framesRef.current = 0;
                timerHandleRef.current = window.setInterval(
                    onTimerTick,
                    timerDelay
                );
            }
        }
    };

    const onTimerTick = () => {
        framesRef.current++;
        draw();
        const duration = new Date().getTime() - spinStartRef.current;
        const totalTime = upTime + downTime;
        let progress = Math.min(duration / totalTime, 1);
        let finished = false;

        // Smooth ease-in-out velocity calculation
        // This creates a realistic wheel spin: slow start -> fast middle -> slow end
        let velocity: number;
        if (progress < 0.5) {
            // Acceleration phase - starts slow, gets faster
            velocity = 32 * progress * progress * progress;
        } else {
            // Deceleration phase - slows down smoothly
            const p = 1 - progress;
            velocity = 32 * p * p * p;
        }

        // Apply velocity to rotation speed
        angleDeltaRef.current = maxSpeed * velocity;
        angleCurrentRef.current += angleDeltaRef.current;

        const segmentIndex = getSegmentIndex();
        const winningSegment = segments[segmentIndex];
        setCurrentSegment(winningSegment);

        if (progress >= 1) {
            finished = true;
        }

        if (finished) {
            setFinished(true);
            onFinished(winningSegment);
            if (timerHandleRef.current) {
                clearInterval(timerHandleRef.current);
                timerHandleRef.current = null;
            }
            angleDeltaRef.current = 0;
            isStartedRef.current = false;
        }
    };

    const getSegmentIndex = () => {
        const change = angleCurrentRef.current + Math.PI / 2;
        const normalizedAngle = change % (Math.PI * 2);
        const segmentAngle = (Math.PI * 2) / segments.length;
        let index = Math.floor(normalizedAngle / segmentAngle);
        index = segments.length - 1 - index;
        if (index < 0) index = segments.length - 1;
        return index;
    };

    const wheelDraw = () => {
        clear();
        drawWheel();
        drawNeedle();
    };

    const draw = () => {
        clear();
        drawWheel();
        drawNeedle();
    };

    const drawSegment = (key: number, lastAngle: number, angle: number) => {
        const ctx = canvasContextRef.current;
        const value = segments[key];
        if (!ctx) return;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, size, lastAngle, angle, false);
        ctx.lineTo(centerX, centerY);
        ctx.closePath();

        // Create gradient for each segment
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size);
        gradient.addColorStop(0, segColors[key]);
        gradient.addColorStop(1, adjustColorBrightness(segColors[key], -20));
        ctx.fillStyle = gradient;
        ctx.fill();

        // Add subtle border between segments
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((lastAngle + angle) / 2);

        // Enhanced text shadow for better readability
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        ctx.fillStyle = contrastColor;
        ctx.font = `bold ${fontSize}px ${fontFamily}`;

        // Split text into multiple lines if too long
        const maxCharsPerLine = 10;
        const words = value.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        words.forEach(word => {
            if ((currentLine + word).length > maxCharsPerLine && currentLine.length > 0) {
                lines.push(currentLine.trim());
                currentLine = word + ' ';
            } else {
                currentLine += word + ' ';
            }
        });
        if (currentLine.length > 0) {
            lines.push(currentLine.trim());
        }

        // Limit to 2 lines
        const displayLines = lines.slice(0, 2);
        const lineHeight = fontSize + 4;
        const startY = displayLines.length === 1 ? 0 : -(lineHeight / 2);

        displayLines.forEach((line, index) => {
            ctx.fillText(line.substr(0, 12), size / 2 + 20, startY + (index * lineHeight));
        });

        ctx.restore();
    };

    // Helper function to adjust color brightness
    const adjustColorBrightness = (color: string, amount: number): string => {
        const num = parseInt(color.replace("#", ""), 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + amount));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
        const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
        return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    };

    const drawWheel = () => {
        const ctx = canvasContextRef.current;
        if (!ctx) return;

        const len = segments.length;
        let lastAngle = angleCurrentRef.current;
        const PI2 = Math.PI * 2;
        ctx.lineWidth = 1;
        ctx.strokeStyle = primaryColor;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.font = `1em ${fontFamily}`;

        for (let i = 1; i <= len; i++) {
            const angle = PI2 * (i / len) + angleCurrentRef.current;
            drawSegment(i - 1, lastAngle, angle);
            lastAngle = angle;
        }

        // Draw center circle with image or text - enhanced design
        if (centerImageSrc) {
            const img = new Image();
            img.src = centerImageSrc;

            // Outer circle with gradient
            const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 60);
            centerGradient.addColorStop(0, "#ffffff");
            centerGradient.addColorStop(1, "#f0f0f0");

            ctx.beginPath();
            ctx.arc(centerX, centerY, 60, 0, PI2, false);
            ctx.closePath();
            ctx.fillStyle = centerGradient;
            ctx.fill();

            // Border for center circle
            ctx.lineWidth = 5;
            ctx.strokeStyle = "#333";
            ctx.stroke();

            // Inner shadow effect
            ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            ctx.font = `bold 1em ${fontFamily}`;
            ctx.fillStyle = contrastColor;
            ctx.textAlign = "center";
            ctx.drawImage(img, centerX - 45, centerY - 45, 90, 90);
        } else {
            // Gradient background for center button
            const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 50);
            centerGradient.addColorStop(0, "#4CAF50");
            centerGradient.addColorStop(1, "#2E7D32");

            ctx.beginPath();
            ctx.arc(centerX, centerY, 50, 0, PI2, false);
            ctx.closePath();
            ctx.fillStyle = centerGradient;
            ctx.fill();

            ctx.lineWidth = 5;
            ctx.strokeStyle = "#fff";
            ctx.stroke();

            // Text with shadow
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            ctx.font = `bold 1.2em ${fontFamily}`;
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ctx.fillText(buttonText, centerX, centerY + 5);
        }

        // Enhanced outer border with shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;

        ctx.beginPath();
        ctx.arc(centerX, centerY, size, 0, PI2, false);
        ctx.closePath();
        ctx.lineWidth = 8;
        ctx.strokeStyle = "#333";
        ctx.stroke();

        // Inner border for depth
        ctx.shadowColor = "transparent";
        ctx.beginPath();
        ctx.arc(centerX, centerY, size - 4, 0, PI2, false);
        ctx.closePath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.stroke();
    };

    const drawNeedle = () => {
        const ctx = canvasContextRef.current;
        if (!ctx) return;

        ctx.save();

        // Position indicator at the top of the wheel (12 o'clock position)
        const needleBaseY = centerY - size - 30; // Base above the wheel
        const needlePointY = centerY - size + 10; // Point touching the wheel rim
        const needleWidth = 25; // Width of the indicator
        const needleOffsetX = 0; // Horizontal offset
        const needleOffsetY = 25; // Vertical offset

        // Draw a large, highly visible red arrow/triangle
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;

        // Main triangle body pointing down to the wheel
        ctx.fillStyle = "#FF0000";
        ctx.beginPath();
        ctx.moveTo(centerX + needleOffsetX - needleWidth, needleBaseY + needleOffsetY); // Left top corner
        ctx.lineTo(centerX + needleOffsetX + needleWidth, needleBaseY + needleOffsetY); // Right top corner
        ctx.lineTo(centerX + needleOffsetX, needlePointY + needleOffsetY); // Sharp point touching wheel
        ctx.closePath();
        ctx.fill();

        // Thick white border for maximum contrast
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.restore();
    };

    const clear = () => {
        const ctx = canvasContextRef.current;
        if (ctx) {
            ctx.clearRect(0, 0, maxWidth, maxHeight);
        }
    };

    return (
        <div id="wheel" style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            background: wheelBackground,
            borderRadius: "20px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
        }}>
            <canvas
                ref={canvasRef}
                onClick={spin}
                style={{
                    pointerEvents: isFinished && isOnlyOnce ? "none" : "auto",
                    opacity: isFinished && isOnlyOnce ? 0.5 : 1,
                    cursor: isFinished && isOnlyOnce ? "default" : "pointer",
                    borderRadius: "50%",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                }}
            />
        </div>
    );
};

export default PickerWheel;
