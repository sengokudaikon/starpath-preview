export interface NavItem {
    name: string;
    path: string;
    description: string;
    icon: string; // We'll use heroicons
}

export type NavMode = "top" | "rail" | "bottom";
