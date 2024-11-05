// src/benchmarks/mandelbrot/MandelbrotBench.tsx
import { createSignal, createEffect, onCleanup } from "solid-js";

interface WorkerFallback {
    postMessage: (data: any) => void;
    terminate: () => void;
    onmessage: ((e: { data: any }) => void) | null;
    onerror: ((e: ErrorEvent) => void) | null; // Add onerror handler
}
// Add Web Worker support for Mandelbrot calculation
const createMandelbrotWorker = () => {
    const workerCode = `
        const MAX_ITERATIONS = 500;
    
    function calculateMandelbrotPoint(x0, y0) {
        let x = 0;
        let y = 0;
        let iteration = 0;

        while (x * x + y * y <= 4 && iteration < MAX_ITERATIONS) {
            const xTemp = x * x - y * y + x0;
            y = 2 * x * y + y0;
            x = xTemp;
            iteration++;
        }

        return iteration === MAX_ITERATIONS;
    }
    function hslToRgb(h, s, l) {
        h = h % 360;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;

        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }

        return [
            Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((b + m) * 255)
        ];
    }
        self.onmessage = function(e) {
        console.log("Worker received message:", e.data);  // Debug log
        const { width, height, scale, offsetX, offsetY } = e.data;
        const result = new Uint8ClampedArray(width * height * 4);

        let setPoints = 0;  // Debug counter
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const x0 = (x - width / 2) * scale + offsetX;
                const y0 = (y - height / 2) * scale + offsetY;
                
                const belongsToSet = calculateMandelbrotPoint(x0, y0);
                const idx = (y * width + x) * 4;
                
                if (belongsToSet) {
                    result[idx] = result[idx + 1] = result[idx + 2] = 0;
                } else {
                    const hue = (x0 + y0) * 180;
                    const [r, g, b] = hslToRgb(hue, 0.8, 0.5);
                    result[idx] = r;
                    result[idx + 1] = g;
                    result[idx + 2] = b;
                }
                result[idx + 3] = 255;
            }
        }
        console.log("Worker finished calculation. Points in set:", setPoints);  // Debug log
        self.postMessage({ result }, [result.buffer]);
    };
`;
    try {
        if (typeof window !== "undefined" && "Worker" in window) {
            const blob = new Blob([workerCode], {
                type: "application/javascript",
            });
            return new Worker(URL.createObjectURL(blob));
        } else {
            console.warn(
                "Web Workers not available, falling back to synchronous calculation"
            );
            const fallbackWorker: WorkerFallback = {
                postMessage(data: any) {
                    const { width, height, scale, offsetX, offsetY } = data;
                    const result = new Uint8ClampedArray(width * height * 4);

                    for (let x = 0; x < width; x++) {
                        for (let y = 0; y < height; y++) {
                            const x0 = (x - width / 2) * scale + offsetX;
                            const y0 = (y - height / 2) * scale + offsetY;

                            const belongsToSet = calculateMandelbrotPoint(
                                x0,
                                y0
                            );
                            const idx = (y * width + x) * 4;

                            if (belongsToSet) {
                                result[idx] =
                                    result[idx + 1] =
                                    result[idx + 2] =
                                        0;
                            } else {
                                const hue = (x0 + y0) * 180;
                                const [r, g, b] = hslToRgb(hue, 0.8, 0.5);
                                result[idx] = r ?? 0;
                                result[idx + 1] = g ?? 0;
                                result[idx + 2] = b ?? 0;
                            }
                            result[idx + 3] = 255;
                        }
                    }

                    if (
                        typeof this !== "undefined" &&
                        this.onmessage !== null
                    ) {
                        this.onmessage({ data: { result } });
                    }
                },
                terminate: () => {
                    // No-op for the fallback
                },
                onmessage: null,
                onerror: null,
            };
            return fallbackWorker;
        }
    } catch (error) {
        console.error("Error creating worker:", error);
        throw error;
    }
};
const MAX_ITERATIONS = 500;
const calculateMandelbrotPoint = (x0: number, y0: number) => {
    let x = 0;
    let y = 0;
    let iteration = 0;

    while (x * x + y * y <= 4 && iteration < MAX_ITERATIONS) {
        const xTemp = x * x - y * y + x0;
        y = 2 * x * y + y0;
        x = xTemp;
        iteration++;
    }

    return iteration === MAX_ITERATIONS;
};
const hslToRgb = (h: number, s: number, l: number) => {
    h = h % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0,
        g = 0,
        b = 0;

    if (h < 60) {
        r = c;
        g = x;
        b = 0;
    } else if (h < 120) {
        r = x;
        g = c;
        b = 0;
    } else if (h < 180) {
        r = 0;
        g = c;
        b = x;
    } else if (h < 240) {
        r = 0;
        g = x;
        b = c;
    } else if (h < 300) {
        r = x;
        g = 0;
        b = c;
    } else {
        r = c;
        g = 0;
        b = x;
    }

    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255),
    ];
};

export const MandelbrotBench = () => {
    console.log("MandelbrotBench component mounting"); // Debug log

    const [zoom, setZoom] = createSignal(0.5); // Start more zoomed out
    const [position, setPosition] = createSignal({ x: -0.5, y: 0 });
    const [canvasRef, setCanvasRef] = createSignal<HTMLCanvasElement>();
    const [renderTime, setRenderTime] = createSignal(0);
    const [worker] = createSignal(createMandelbrotWorker());
    createEffect(() => {
        console.log("Canvas effect running"); // Debug log
        const canvas = canvasRef();
        if (!canvas) {
            console.log("No canvas reference"); // Debug log
            return;
        }
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            console.log("No canvas context"); // Debug log
            return;
        }
        // Move the controls setup here
        (window as any).__mandelbrotControls = {
            setZoom,
            setPosition,
            getRenderTime: () => renderTime(),
        };
    });
    const drawMandelbrot = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number
    ) => {
        const startTime = performance.now();
        const scale = 4 / Math.min(width, height) / zoom();
        const offsetX = position().x;
        const offsetY = position().y;

        const currentWorker = worker();
        currentWorker.onmessage = (e: {
            data: { result: Uint8ClampedArray };
        }) => {
            console.log("Received worker response"); // Debug log
            try {
                const imageData = new ImageData(
                    new Uint8ClampedArray(e.data.result),
                    width,
                    height
                );
                ctx.putImageData(imageData, 0, 0);

                const endTime = performance.now();
                setRenderTime(endTime - startTime);
            } catch (error) {
                console.error("Error rendering image data:", error);
            }
        };

        currentWorker.onerror = (error: ErrorEvent) => {
            console.error("Worker error:", error);
        };

        currentWorker.postMessage({
            width,
            height,
            scale,
            offsetX,
            offsetY,
        });

        currentWorker.onmessage = (e: {
            data: { result: Uint8ClampedArray };
        }) => {
            const imageData = new ImageData(
                new Uint8ClampedArray(e.data.result),
                width,
                height
            );
            ctx.putImageData(imageData, 0, 0);

            const endTime = performance.now();
            setRenderTime(endTime - startTime);
        };
    };

    createEffect(() => {
        const canvas = canvasRef();
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrame: number;
        let isRendering = false;

        const render = () => {
            if (!isRendering) {
                isRendering = true;
                try {
                    drawMandelbrot(ctx, canvas.width, canvas.height);
                } catch (error) {
                    console.error("Error in render loop:", error);
                } finally {
                    isRendering = false;
                }
            }
            animationFrame = requestAnimationFrame(render);
        };

        render();

        onCleanup(() => {
            cancelAnimationFrame(animationFrame);
            worker()?.terminate();
        });
    });

    // Export state controls for benchmarking
    (window as any).__mandelbrotControls = {
        setZoom,
        setPosition,
        getRenderTime: () => renderTime(),
    };

    return (
        <div
            class="mandelbrot-container"
            style={{
                width: "800px",
                height: "600px",
                position: "relative",
                margin: "0 auto",
            }}
        >
            <canvas
                ref={setCanvasRef}
                width={800}
                height={600}
                style={{
                    border: "1px solid #ccc",
                    background: "#000",
                }}
                onWheel={(e) => {
                    e.preventDefault();
                    setZoom((z) => z * (e.deltaY > 0 ? 0.9 : 1.1));
                }}
                onMouseMove={(e) => {
                    if (e.buttons === 1) {
                        setPosition((p) => ({
                            x: p.x - e.movementX / (200 * zoom()),
                            y: p.y - e.movementY / (200 * zoom()),
                        }));
                    }
                }}
            />
            <div
                class="benchmark-info"
                style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    background: "rgba(0, 0, 0, 0.7)",
                    color: "white",
                    padding: "5px 10px",
                    "border-radius": "4px",
                    "font-family": "monospace",
                }}
            >
                Render time: {renderTime().toFixed(2)}ms
            </div>
        </div>
    );
};
