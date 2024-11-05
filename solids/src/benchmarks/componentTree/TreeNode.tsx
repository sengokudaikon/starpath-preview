// src/benchmarks/componentTree/TreeNode.tsx
import { createSignal, createEffect, For, type Component } from "solid-js";
import type { NodeData } from "./types";

interface TreeNodeProps {
    data: NodeData;
    onUpdate: (path: string[], value: number) => void;
}

export const TreeNode: Component<TreeNodeProps> = (props) => {
    const [value, setValue] = createSignal(props.data.value);
    const [isHighlighted, setHighlighted] = createSignal(false);

    createEffect(() => {
        if (value() !== props.data.value) {
            setHighlighted(true);
            setTimeout(() => setHighlighted(false), 500);
        }
    });

    const updateValue = () => {
        const newValue = value() + Math.random() * 10 - 5;
        setValue(newValue);
        props.onUpdate(props.data.path, newValue);
    };

    return (
        <div 
            class="tree-node" 
            style={{ 
                "margin-left": `${props.data.depth * 20}px`,
                "background-color": isHighlighted() ? "#fef3c7" : "white",
                "transition": "background-color 0.3s"
            }}
        >
            <div class="node-content">
                <span class="node-value">{value().toFixed(2)}</span>
                <button onClick={updateValue}>Update</button>
            </div>
            <div class="node-children">
                <For each={props.data.children}>
                    {(child) => (
                        <TreeNode 
                            data={child} 
                            onUpdate={props.onUpdate}
                        />
                    )}
                </For>
            </div>
        </div>
    );
};