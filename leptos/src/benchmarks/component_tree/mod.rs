use leptos::*;
use serde::{ Deserialize, Serialize };
use uuid::Uuid;
use leptos::ev;
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NodeData {
    id: String,
    value: f64,
    depth: usize,
    path: Vec<String>,
    children: Vec<NodeData>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TreeMetrics {
    update_time: f64,
    propagation_time: f64,
    memory_usage: f64,
    nodes_updated: usize,
    total_nodes: usize,
    max_depth: usize,
}

impl NodeData {
    fn generate_tree(depth: usize, max_depth: usize, path: Vec<String>) -> Self {
        let id = Uuid::new_v4().to_string();
        let current_path = [path.clone(), vec![id.clone()]].concat();

        let children = if depth < max_depth {
            (0..std::cmp::max(1, 4 - depth))
                .map(|_| Self::generate_tree(depth + 1, max_depth, current_path.clone()))
                .collect()
        } else {
            vec![]
        };

        Self {
            id,
            value: js_sys::Math::random() * 100.0,
            depth,
            path: current_path,
            children,
        }
    }
}

#[component]
pub fn TreeNode(
    node: NodeData,
    #[prop(into)] on_update: Callback<(Vec<String>, f64)>
) -> impl IntoView {
    let (value, set_value) = create_signal(node.value);
    let (is_highlighted, set_highlighted) = create_signal(false);

    // Handle value updates with highlighting effect
    create_effect(move |_| {
        if value.get() != node.value {
            set_highlighted.set(true);
            set_timeout(move || set_highlighted.set(false), std::time::Duration::from_millis(500));
        }
    });

    let update_value = move |_| {
        let new_value = value.get() + (js_sys::Math::random() * 10.0 - 5.0);
        set_value.set(new_value);
        on_update.call((node.path.clone(), new_value));
    };

    view! {
        <div class="tree-node">
            <div
                class="node-content"
                class:highlighted=move || is_highlighted.get()
                class:updating=move || is_highlighted.get()
            >
                <div class="flex justify-between items-center">
                    <span class="font-mono text-lg node-value">
                        {move || format!("{:.2}", value.get())}
                    </span>
                    <button class="update-btn" on:click=update_value>
                        "Update"
                    </button>
                </div>
            </div>
            <div class="node-children">
                <For
                    each=move || node.children.clone()
                    key=|child| child.id.clone()
                    children=move |child| view! { <TreeNode node=child on_update=on_update /> }
                />
            </div>
        </div>
    }
}

#[component]
pub fn ComponentTreeBench() -> impl IntoView {
    let (tree, set_tree) = create_signal(NodeData::generate_tree(0, 5, vec![]));
    let (metrics, set_metrics) = create_signal(TreeMetrics {
        update_time: 0.0,
        propagation_time: 0.0,
        memory_usage: 0.0,
        nodes_updated: 0,
        total_nodes: 0,
        max_depth: 0,
    });

    // Analyze tree structure
    fn analyze_tree(node: &NodeData) -> (usize, usize) {
        let mut total_nodes = 1;
        let mut max_child_depth = 0;

        for child in node.children.iter() {
            let (child_nodes, child_depth) = analyze_tree(child);
            total_nodes += child_nodes;
            max_child_depth = max_child_depth.max(child_depth);
        }

        (total_nodes, max_child_depth + 1)
    }

    let handle_node_update = move |(path, new_value): (Vec<String>, f64)| {
        let start_time = window().performance().unwrap().now();
        let mut nodes_updated = 0;

        set_tree.update(|current_tree| {
            fn update_node_in_tree(
                node: &mut NodeData,
                path: &[String],
                new_value: f64,
                depth: usize,
                nodes_updated: &mut usize
            ) {
                if depth < path.len() && path[depth] == node.id {
                    *nodes_updated += 1;
                    if depth == path.len() - 1 {
                        node.value = new_value;
                    } else {
                        for child in &mut node.children {
                            update_node_in_tree(child, path, new_value, depth + 1, nodes_updated);
                        }
                    }
                }
            }

            update_node_in_tree(current_tree, &path, new_value, 0, &mut nodes_updated);
        });

        let update_time = window().performance().unwrap().now() - start_time;

        // Measure propagation and update metrics
        request_animation_frame(move || {
            let propagation_time = window().performance().unwrap().now() - start_time;
            let tree_value = tree.get();
            let (total_nodes, max_depth) = analyze_tree(&tree_value);

            set_metrics.update(|m| {
                m.update_time = update_time;
                m.propagation_time = propagation_time;
                m.nodes_updated = nodes_updated;
                m.total_nodes = total_nodes;
                m.max_depth = max_depth;
                m.memory_usage = js_sys
                    ::eval("performance.memory?.usedJSHeapSize || 0")
                    .unwrap()
                    .as_f64()
                    .unwrap_or(0.0);
            });
        });
    };

    // Export controls for benchmarking
    window_event_listener(ev::load, move |_| {
        js_sys
            ::eval(
                &format!(
                    "window.__componentTreeControls = {{
                getMetrics: () => ({:?}),
                triggerUpdate: (path, value) => ({:?}),
                getTree: () => ({:?}),
            }}",
                    serde_wasm_bindgen::to_value(&metrics.get()).unwrap(),
                    handle_node_update((vec![], 0.0)),
                    serde_wasm_bindgen::to_value(&tree.get()).unwrap()
                )
            )
            .unwrap();
    });

    create_effect(move |_| {
        let handle = set_interval(
            move || {
                let random_path = generate_random_path(&tree.get());
                handle_node_update((random_path, js_sys::Math::random() * 100.0));
            },
            std::time::Duration::from_millis(2000),
        );
    
        // Return the handle from the effect
        handle
    });


    view! {
        <div class="p-4 min-h-screen bg-gray-50">
            <div class="metrics-panel">
                <h2 class="mb-3 text-lg font-semibold text-gray-800">"Performance Metrics"</h2>
                <div class="space-y-2">
                    <div class="metric-item">
                        <span class="text-gray-600">"Update Time: "</span>
                        <span class="font-mono">
                            {move || format!("{:.2}ms", metrics.get().update_time)}
                        </span>
                    </div>
                    <div class="metric-item">
                        <span class="text-gray-600">"Propagation Time: "</span>
                        <span class="font-mono">
                            {move || format!("{:.2}ms", metrics.get().propagation_time)}
                        </span>
                    </div>
                    <div class="metric-item">
                        <span class="text-gray-600">"Nodes Updated: "</span>
                        <span class="font-mono">{move || metrics.get().nodes_updated}</span>
                    </div>
                    <div class="metric-item">
                        <span class="text-gray-600">"Total Nodes: "</span>
                        <span class="font-mono">{move || metrics.get().total_nodes}</span>
                    </div>
                    <div class="metric-item">
                        <span class="text-gray-600">"Max Depth: "</span>
                        <span class="font-mono">{move || metrics.get().max_depth}</span>
                    </div>
                    <div class="metric-item">
                        <span class="text-gray-600">"Memory Usage: "</span>
                        <span class="font-mono">
                            {move || {
                                format!("{:.2}MB", metrics.get().memory_usage / (1024.0 * 1024.0))
                            }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <div class="p-4 bg-white rounded-lg shadow-lg tree-container">
            <TreeNode node=(move || tree.get())() on_update=handle_node_update />
        </div>
    }
}

fn generate_random_path(node: &NodeData) -> Vec<String> {
    let mut path = vec![node.id.clone()];
    let mut current = node;
    
    while !current.children.is_empty() && js_sys::Math::random() > 0.3 {
        let idx = (js_sys::Math::random() * current.children.len() as f64) as usize;
        current = &current.children[idx];
        path.push(current.id.clone());
    }
    
    path
}

fn clear_interval(handle: i32) {
    let window = web_sys::window().unwrap();
    window.clear_interval_with_handle(handle);
}