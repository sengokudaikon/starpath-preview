import { For, type Component } from "solid-js";
import type { NavItem } from "./types";

export const TopNav: Component<{ items: NavItem[] }> = (props) => (
    <nav class="top-nav">
        <ul>
            <li><a href="/" class="nav-item">Home</a></li>
            <For each={props.items}>
                {item => (
                    <li>
                        <a href={item.path} class="nav-item">
                            <span class="nav-icon" innerHTML={item.icon} />
                            {item.name}
                        </a>
                    </li>
                )}
            </For>
        </ul>
    </nav>
);