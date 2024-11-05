// src/components/App.tsx
import { createSignal, type Component } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import "../styles/App.css";
import AstroLogo from "../assets/Astro.svg";
import TauriLogo from "../assets/Tauri.svg";
import SolidLogo from "../assets/Solid.svg";
import "../styles/App.css";
import { Navigation } from "./Navigation";
import type { NavItem } from "./types";
const benchmarks: NavItem[] = [
    {
        name: "Mandelbrot Set",
        path: "/benchmark",
        description:
            "Test computational and rendering performance with the Mandelbrot set.",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 3a9 9 0 0 1 9 9 9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 9-9m0 4a5 5 0 0 0-5 5 5 5 0 0 0 5 5 5 5 0 0 0 5-5 5 5 0 0 0-5-5Z"/></svg>'

    },
    {
        name: "Infinite Scroll",
        path: "/infinite-scroll",
        description:
            "Test PWA-like infinite scroll performance with dynamic content.",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 3v18m8-18v18M4 9h16M4 15h16"/></svg>',
    },
    {
        name: "Component Tree",
        path: "/component-tree",
        description:
            "Test nested reactivity and signal propagation in complex component hierarchies.",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v18M3 12h18M12 8l4 4-4 4m-5-8l-4 4 4 4"/></svg>',
    },
    {
        name: "UI Performance",
        path: "/ui-performance",
        description:
            "Comprehensive UI benchmark testing animations, transitions, hover states, and complex interactions.",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
    },
] as const;
const App: Component = () => {
    const [greetMsg, setGreetMsg] = createSignal("");
    const [name, setName] = createSignal("");

    const greet = async () => {
        try {
            const result = await invoke("greet", { name: name() });
            setGreetMsg(result as string);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Navigation items={benchmarks}>
            <div class="container">
                <h1>Welcome to Tauri + Solid + Astro</h1>

                <div class="row">
                    <a href="https://astro.build" target="_blank">
                        <img
                            src={AstroLogo.src}
                            class="logo astro"
                            alt="Astro logo"
                        />
                    </a>
                    <a href="https://tauri.app" target="_blank">
                        <img
                            src={TauriLogo.src}
                            class="logo tauri"
                            alt="Tauri logo"
                        />
                    </a>
                    <a href="https://solidjs.com" target="_blank">
                        <img
                            src={SolidLogo.src}
                            class="logo solid"
                            alt="Solid logo"
                        />
                    </a>
                </div>

                <div class="benchmarks-grid">
                    {benchmarks.map((bench) => (
                        <div class="benchmark-card">
                            <div
                                class="benchmark-icon"
                                innerHTML={bench.icon}
                            />
                            <h3>{bench.name}</h3>
                            <p>{bench.description}</p>
                            <a href={bench.path} class="benchmark-button">
                                Run Benchmark
                            </a>
                        </div>
                    ))}
                </div>
                <form
                    class="row"
                    onSubmit={(e) => {
                        e.preventDefault();
                        greet();
                    }}
                >
                    <input
                        id="greet-input"
                        onChange={(e) => setName(e.currentTarget.value)}
                        placeholder="Enter a name..."
                    />
                    <button type="submit">Greet</button>
                </form>
                <p>{greetMsg()}</p>
            </div>
        </Navigation>
    );
};

export default App;
