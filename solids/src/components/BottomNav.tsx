// src/components/BottomNav.tsx
import { For, createSignal, Show } from "solid-js";
import type { Component } from "solid-js";
import type { NavItem } from "./types";

export const BottomNav: Component<{ items: NavItem[] }> = (props) => {
    const [isSheetOpen, setSheetOpen] = createSignal(false);
    const [sheetPosition, setSheetPosition] = createSignal(0);
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
        const touch = e.touches[0];
        if (touch) {
            startY = touch.clientY;
            isDragging = true;
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!isDragging) return;

        const touch = e.touches[0];
        if (touch) {
            currentY = touch.clientY;
            const delta = startY - currentY;
            
            // Allow negative delta for pull-down to close
            const newPosition = Math.max(
                -50, // Allow some overflow for pull-down feedback
                Math.min(delta, window.innerHeight * 0.8)
            );

            setSheetPosition(newPosition);
        }
    };

    const handleTouchEnd = () => {
        isDragging = false;
        if (sheetPosition() < -20) {
            // Pull-down threshold to close
            setSheetPosition(0);
            setSheetOpen(false);
        } else if (sheetPosition() > window.innerHeight * 0.4) {
            setSheetPosition(window.innerHeight * 0.8);
            setSheetOpen(true);
        } else {
            setSheetPosition(0);
            setSheetOpen(false);
        }
    };

    return (
        <>
            <div class="bottom-nav-handle">
                <button
                    class="sheet-trigger"
                    onClick={() => setSheetOpen(prev => !prev)}
                >
                    <div class="handle-indicator" />
                </button>
            </div>

            <Show when={isSheetOpen() || sheetPosition() > 0}>
                <div
                    class="bottom-sheet-overlay"
                    style={{
                        opacity: Math.max(0, sheetPosition() / (window.innerHeight * 0.8))
                    }}
                    onClick={() => {
                        setSheetOpen(false);
                        setSheetPosition(0);
                    }}
                />
                <div
                    class="bottom-sheet"
                    style={{
                        transform: `translateY(calc(-${sheetPosition()}px))`,
                        transition: isDragging ? "none" : "transform 0.3s ease",
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div class="bottom-sheet-handle" />
                    <div class="bottom-sheet-content">
                        <For each={props.items}>
                            {(item) => (
                                <a href={item.path} class="sheet-item">
                                    <span
                                        class="nav-icon"
                                        innerHTML={item.icon}
                                    />
                                    <span class="sheet-item-content">
                                        <span class="sheet-item-title">
                                            {item.name}
                                        </span>
                                        <span class="sheet-item-description">
                                            {item.description}
                                        </span>
                                    </span>
                                </a>
                            )}
                        </For>
                    </div>
                </div>
            </Show>
        </>
    );
};