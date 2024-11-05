import { For } from "solid-js";

import type { Component } from "solid-js";
import type { NavItem } from "./types";

export const NavRail: Component<{
    items: NavItem[];
    isExpanded: boolean;
    onToggle: () => void;
}> = (props) => {
    return (
        <nav class={`nav-rail ${props.isExpanded ? 'expanded' : ''}`}>
            <button class="nav-rail-toggle" onClick={props.onToggle}>
                {props.isExpanded ? '◄' : '►'}
            </button>
            <div class="nav-rail-content">
                <For each={props.items}>
                    {item => (
                        <a 
                            href={item.path}
                            class="nav-rail-item"
                            title={props.isExpanded ? undefined : item.name}
                        >
                            <span class="nav-icon" innerHTML={item.icon} />
                            <span class="nav-label">{item.name}</span>
                        </a>
                    )}
                </For>
            </div>
        </nav>
    );
};