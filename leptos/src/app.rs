use crate::benchmarks::{
    component_tree::ComponentTreeBench,
    infinite_scroll::InfiniteScrollBench,
    ui_performance::UIPerformanceBench,
};
use ev::Event;
use leptos::leptos_dom::ev::SubmitEvent;
use leptos::*;
use leptos_use::use_media_query;
use serde::{ Deserialize, Serialize };
use strum::IntoEnumIterator;
use wasm_bindgen::prelude::*;
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = ["window", "__TAURI__", "core"])]
    async fn invoke(cmd: &str, args: JsValue) -> JsValue;
}

#[derive(Serialize, Deserialize)]
struct GreetArgs<'a> {
    name: &'a str,
}

#[component]
pub fn App() -> impl IntoView {
    let name = create_rw_signal(String::new());
    let active_item = create_rw_signal(NavItem::ComponentTree);
    let nav_expanded = create_rw_signal(false);
    let sheet_open = create_rw_signal(false);
    let greet_msg = create_rw_signal(String::new());

    let is_large = use_media_query("(min-width: 1024px)");
    let is_medium = use_media_query("(min-width: 768px)");

    let update_name = move |ev: Event| {
        let v = event_target_value(&ev);
        name.set(v);
    };

    let greet = move |ev: SubmitEvent| {
        ev.prevent_default();
        spawn_local(async move {
            let name = name.get_untracked();
            if name.is_empty() {
                return;
            }

            let args = serde_wasm_bindgen::to_value(&(GreetArgs { name: &name })).unwrap();
            // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
            let new_msg = invoke("greet", args).await.as_string().unwrap();
            greet_msg.set(new_msg);
        });
    };

    view! {
        <link
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
            rel="stylesheet"
        />
        <Show
            when=move || is_large.get()
            fallback=move || {
                view! {
                    <Show
                        when=move || is_medium.get()
                        fallback=move || {
                            view! {
                                <>
                                    <button
                                        class="fixed right-4 bottom-4 z-50 p-4 text-white rounded-full shadow-lg bg-primary-500"
                                        on:click=move |_| sheet_open.set(true)
                                    >
                                        <span class="material-symbols-outlined">menu</span>
                                    </button>
                                    <BottomSheet active_item=active_item is_open=sheet_open />
                                </>
                            }
                        }
                    >
                        <NavRail active_item=active_item is_expanded=nav_expanded />
                    </Show>
                }
            }
        >
            <TopNavBar active_item=active_item />
        </Show>
        <main class=move || {
            let mut classes = vec!["min-h-screen bg-gray-50 transition-all duration-300"];
            if is_large.get() {
                classes.push("pt-16");
            } else if is_medium.get() {
                if nav_expanded.get() {
                    classes.push("ml-60");
                } else {
                    classes.push("ml-18");
                }
            }
            classes.join(" ")
        }>
            {move || match active_item.get() {
                NavItem::ComponentTree => view! { <ComponentTreeBench /> },
                NavItem::InfiniteScroll => view! { <InfiniteScrollBench /> },
                NavItem::UIPerformance => view! { <UIPerformanceBench /> },
            }}
        </main>
    }
}

#[derive(Clone, strum::EnumIter, PartialEq, Debug, Copy)]
enum NavItem {
    ComponentTree,
    InfiniteScroll,
    UIPerformance,
}

impl NavItem {
    fn to_string(&self) -> &'static str {
        match self {
            NavItem::ComponentTree => "Component Tree",
            NavItem::InfiniteScroll => "Infinite Scroll",
            NavItem::UIPerformance => "UI Performance",
        }
    }

    fn to_icon(&self) -> &'static str {
        match self {
            NavItem::ComponentTree => "account_tree",
            NavItem::InfiniteScroll => "all_inclusive",
            NavItem::UIPerformance => "speed",
        }
    }
}

#[component]
fn TopNavBar(active_item: RwSignal<NavItem>) -> impl IntoView {
    view! {
        <nav class="flex fixed top-0 right-0 left-0 z-50 justify-between items-center px-4 h-16 bg-white shadow-md">
            <div class="flex items-center space-x-2">
                <span class="text-2xl material-symbols-outlined">speed</span>
                <h1 class="text-xl font-semibold">Leptos Benchmarks</h1>
            </div>
            <div class="flex space-x-4">
                {NavItem::iter()
                    .map(|item| {
                        let item = item.clone();
                        view! {
                            <button
                                class="flex items-center py-2 px-4 space-x-2 rounded-lg transition-colors duration-200"
                                class=(
                                    "bg-primary-100 text-primary-900",
                                    move || active_item.get() == item.clone(),
                                )
                                on:click=move |_| active_item.set(item.clone())
                            >
                                <span class="material-symbols-outlined">
                                    {item.clone().to_icon()}
                                </span>
                                <span>{item.clone().to_string()}</span>
                            </button>
                        }
                    })
                    .collect_view()}
            </div>
        </nav>
    }
}

#[component]
fn NavRail(active_item: RwSignal<NavItem>, is_expanded: RwSignal<bool>) -> impl IntoView {
    view! {
        <nav
            class="flex fixed top-0 bottom-0 left-0 z-50 flex-col items-center py-4 bg-white shadow-md transition-all duration-300"
            style:width=move || if is_expanded.get() { "240px" } else { "72px" }
        >
            <button
                class="p-2 mb-8 rounded-full transition-colors hover:bg-gray-100"
                on:click=move |_| is_expanded.update(|e| *e = !*e)
            >
                <span class="material-symbols-outlined">
                    {move || if is_expanded.get() { "chevron_left" } else { "chevron_right" }}
                </span>
            </button>
            {NavItem::iter()
                .map(|item| {
                    let item = item.clone();
                    view! {
                        <button
                            class="flex items-center py-3 px-4 space-x-4 w-full transition-colors duration-200"
                            class=(
                                "bg-primary-100 text-primary-900",
                                move || active_item.get() == item,
                            )
                            on:click=move |_| active_item.set(item.clone())
                        >
                            <span class="material-symbols-outlined">{item.clone().to_icon()}</span>
                            <Show when=move || is_expanded.get()>
                                <span>{item.clone().to_string()}</span>
                            </Show>
                        </button>
                    }
                })
                .collect_view()}
        </nav>
    }
}
#[component]
fn BottomSheet(active_item: RwSignal<NavItem>, is_open: RwSignal<bool>) -> impl IntoView {
    let sheet_position = create_rw_signal(0.0);
    let start_y = create_rw_signal(0.0);
    let current_y = create_rw_signal(0.0);
    let is_dragging = create_rw_signal(false);
    let window_height = window().inner_height().unwrap().as_f64().unwrap();
    let max_height = window_height * 0.8;

    let handle_touch_start = move |ev: ev::TouchEvent| {
        if let Some(touch) = ev.touches().get(0) {
            start_y.set(touch.client_y() as f64);
            current_y.set(touch.client_y() as f64);
            is_dragging.set(true);
        }
    };

    let handle_touch_move = move |ev: ev::TouchEvent| {
        if !is_dragging.get() {
            return;
        }

        if let Some(touch) = ev.touches().get(0) {
            current_y.set(touch.client_y() as f64);
            let delta = start_y.get() - current_y.get();
            
            // Allow negative delta for pull-down to close
            let new_position = (-50f64).max(delta.min(max_height));
            sheet_position.set(new_position);
        }
    };

    let handle_touch_end = move |_| {
        is_dragging.set(false);
        
        if sheet_position.get() < -20.0 {
            // Pull-down threshold to close
            sheet_position.set(0.0);
            is_open.set(false);
        } else if sheet_position.get() > max_height * 0.4 {
            sheet_position.set(max_height);
            is_open.set(true);
        } else {
            sheet_position.set(0.0);
            is_open.set(false);
        }
    };
    let items = NavItem::iter().collect::<Vec<_>>();
    view! {
        <>
            // Backdrop
            <div
                class="bottom-sheet-overlay"
                class:active=(move || sheet_position.get() > 0.0)
                style=move || format!(
                    "opacity: {};",
                    (sheet_position.get() / max_height).max(0.0)
                )
                on:click=move |_| {
                    sheet_position.set(0.0);
                    is_open.set(false);
                }
            />

            // Bottom Sheet
            <div
                class="bottom-sheet"
                style=move || format!(
                    "transform: translateY(calc(100% - {}px));",
                    if is_open.get() { max_height } else { sheet_position.get() }
                )
                on:touchstart=handle_touch_start
                on:touchmove=handle_touch_move
                on:touchend=handle_touch_end
            >
                <div class="bottom-sheet-handle" />
                <div class="bottom-sheet-content">
                    <For
                        each=move || items.clone()
                        key=|item| *item as usize
                        children=move |item: NavItem| {
                            view! {
                                <button
                                    class="flex items-center w-full p-4 space-x-4 rounded-lg transition-colors"
                                    class=("bg-primary-100 text-primary-900", move || active_item.get() == item)
                                    on:click=move |_| {
                                        active_item.set(item);
                                        is_open.set(false);
                                    }
                                >
                                    <span class="material-symbols-outlined">{item.to_icon()}</span>
                                    <div class="flex flex-col items-start">
                                        <span class="font-medium">{item.to_string()}</span>
                                        <span class="text-sm text-gray-500">
                                            {"View "}{item.to_string().to_lowercase()}{" benchmark"}
                                        </span>
                                    </div>
                                </button>
                            }
                        }>
                    </For>
                </div>
            </div>
        </>
    }
}