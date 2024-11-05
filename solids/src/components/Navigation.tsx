import { createSignal, createEffect, Show, type Component } from "solid-js";
import { TopNav } from "./TopNav.tsx";
import { NavRail } from "./NavRail.tsx";
import { BottomNav } from "./BottomNav.tsx";
import type { NavItem, NavMode } from "./types";
import type { JSX } from "solid-js";

const BREAKPOINTS = {
    small: 640,
    medium: 1024
} as const;
interface NavigationProps {
    items: NavItem[];
    children: JSX.Element;
}
export const Navigation: Component<NavigationProps> = (props) => {
    const [navMode, setNavMode] = createSignal<NavMode>("top");

    const [isRailExpanded, setRailExpanded] = createSignal(false);

    createEffect(() => {
        const updateNavMode = () => {
            const width = window.innerWidth;
            if (width >= BREAKPOINTS.medium) {
                setNavMode('top');
            } else if (width >= BREAKPOINTS.small) {
                setNavMode('rail');
            } else {
                setNavMode('bottom');
            }
        };

        updateNavMode();
        window.addEventListener('resize', updateNavMode);
        return () => window.removeEventListener('resize', updateNavMode);
    });

    return (
        <>
            <Show when={navMode() === 'top'}>
                <TopNav items={props.items} />
            </Show>
            <Show when={navMode() === 'rail'}>
                <NavRail 
                    items={props.items}
                    isExpanded={isRailExpanded()}
                    onToggle={() => setRailExpanded(prev => !prev)}
                />
            </Show>
            <Show when={navMode() === 'bottom'}>
                <BottomNav items={props.items} />
            </Show>
            <main class={`content ${navMode()}-nav-active`}>
                {props.children}
            </main>
        </>
    );
};