use leptos::*;
use rand::prelude::IndexedRandom;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use wasm_bindgen::JsCast;
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UIPerformanceMetrics {
    list_animation_time: f64,
    modal_transition_time: f64,
    accordion_transition_time: f64,
    carousel_transition_time: f64,
    page_transition_time: f64,
    markdown_parse_time: f64,
    tooltip_render_time: f64,
    component_update_time: f64,
    hover_latency: f64,
    scroll_latency: f64,
    click_latency: f64,
    memory_usage: f64,
    frame_drops: i32,
    total_animations_played: i32,
    nodes_updated: i32,
    update_propagation_time: f64,
    hint_show_latency: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ItemData {
    id: String,
    name: String,
    item_type: String, // 'weapon' | 'armor' | 'spell' | 'feat' | 'item'
    level: i32,
    rarity: String, // 'common' | 'uncommon' | 'rare' | 'unique'
    traits: Vec<String>,
    description: String,
    markdown: String,
    price: Option<String>,
    requirements: Option<Vec<String>>,
    actions: String, // "1" | "2" | "3" | "reaction" | "free"
    related_items: Option<Vec<String>>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CategorySection {
    id: String,
    title: String,
    items: Vec<ItemData>,
    is_expanded: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GlossaryEntry {
    term: String,
    description: String,
    related_terms: Option<Vec<String>>,
    examples: Option<Vec<String>>,
}

#[component]
fn MetricsPanel(
    metrics: RwSignal<UIPerformanceMetrics>,
    is_collapsed: RwSignal<bool>,
) -> impl IntoView {
    view! {
        <div
            class="fixed top-4 right-4 bg-white rounded-lg shadow-lg transition-all duration-300 overflow-hidden"
            style=move || if is_collapsed.get() {
                "height: 48px; opacity: 0.8;"
            } else {
                "height: auto; opacity: 1;"
            }
        >
            <div class="p-4">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-semibold">Performance Metrics</h3>
                    <button 
                        class="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        on:click=move |_| is_collapsed.update(|v| *v = !*v)
                    >
                        <span class="material-symbols-outlined">
                            {move || if is_collapsed.get() { "expand_more" } else { "expand_less" }}
                        </span>
                    </button>
                </div>
                <div 
                    class="mt-4 space-y-2 transition-all duration-300"
                    style=move || if is_collapsed.get() { "display: none;" } else { "display: block;" }
                >
                <For
                    each=move || {
                        let m = metrics.get();
                        vec![
                            ("List Animation", m.list_animation_time),
                            ("Modal Transition", m.modal_transition_time),
                            ("Accordion Transition", m.accordion_transition_time),
                            ("Carousel Transition", m.carousel_transition_time),
                            ("Hover Latency", m.hover_latency),
                            ("Memory Usage", m.memory_usage),
                            ("Frame Drops", m.frame_drops as f64),
                            ("Nodes Updated", m.nodes_updated as f64),
                        ]
                    }
                    key=|(name, _)| name.to_string()
                    children=move |(name, value)| {
                        view! {
                            <div class="flex justify-between metric-item">
                                <span class="text-gray-600">{name}</span>
                                <span class="font-mono">
                                    {format!("{:.2}", value)}
                                    {if name.contains("Time") || name.contains("Latency") {
                                        "ms"
                                    } else {
                                        ""
                                    }}
                                </span>
                            </div>
                        }
                        }
                    />
                </div>
            </div>
        </div>
    }
}

#[component]
fn FeaturedCarousel(items: Signal<Vec<ItemData>>, on_select: Callback<ItemData>) -> impl IntoView {
    let current_index = create_rw_signal(0);
    let is_transitioning = create_rw_signal(false);

    let transition = move |direction: i32| {
        let start_time = window().performance().unwrap().now();
        is_transitioning.set(true);

        current_index.update(|idx| {
            let len = items.get().len();
            *idx = (((*idx as i32) + direction + (len as i32)) as usize) % len;
        });

        // Measure transition time
        request_animation_frame(move || {
            is_transitioning.set(false);
            // Report metric through context
            if let Some(metrics) = use_context::<RwSignal<UIPerformanceMetrics>>() {
                metrics.update(|m| {
                    m.carousel_transition_time = window().performance().unwrap().now() - start_time;
                });
            }
        });
    };

    view! {
        <div class="relative p-4 mb-8 bg-white rounded-lg shadow-lg featured-carousel">
            <button
                class="absolute left-2 top-1/2 p-2 bg-white rounded-full shadow-lg transition-colors transform -translate-y-1/2 hover:bg-gray-100 carousel-nav prev"
                disabled=move || is_transitioning.get()
                on:click=move |_| transition(-1)
            >
                <span class="material-symbols-outlined">chevron_left</span>
            </button>

            <div class="overflow-hidden carousel-content">
                {move || {
                    let current_idx = current_index.get();
                    let items_data = items.get();
                    if let Some(item) = items_data.get(current_idx).cloned() {
                        let item_clone = item.clone();
                        view! {
                            <div
                                class="p-4 cursor-pointer carousel-item"
                                on:click=move |_| on_select.call(item.clone())
                            >
                                <h3 class="mb-2 text-xl font-semibold">{&item_clone.name}</h3>
                                <p class="text-gray-600">{&item_clone.description}</p>
                            </div>
                        }
                    } else {
                        view! { <div>"No items available"</div> }
                    }
                }}
            </div>

            <button
                class="absolute right-2 top-1/2 p-2 bg-white rounded-full shadow-lg transition-colors transform -translate-y-1/2 hover:bg-gray-100 carousel-nav next"
                disabled=move || is_transitioning.get()
                on:click=move |_| transition(1)
            >
                <span class="material-symbols-outlined">chevron_right</span>
            </button>
        </div>
    }
}

#[component]
pub fn UIPerformanceBench() -> impl IntoView {
    let metrics = create_rw_signal(UIPerformanceMetrics {
        list_animation_time: 0.0,
        modal_transition_time: 0.0,
        accordion_transition_time: 0.0,
        carousel_transition_time: 0.0,
        page_transition_time: 0.0,
        markdown_parse_time: 0.0,
        tooltip_render_time: 0.0,
        component_update_time: 0.0,
        hover_latency: 0.0,
        scroll_latency: 0.0,
        click_latency: 0.0,
        memory_usage: 0.0,
        frame_drops: 0,
        total_animations_played: 0,
        nodes_updated: 0,
        update_propagation_time: 0.0,
        hint_show_latency: 0.0,
    });

    let is_metrics_panel_collapsed = create_rw_signal(false);
    let sections = create_rw_signal(generate_sample_data());
    let selected_item = create_rw_signal(None::<ItemData>);
    let active_hint = create_rw_signal(None::<(ItemData, (f64, f64))>);

    // Export controls for benchmarking
    provide_context(metrics);
    

    view! {
        <div class="ui-performance-benchmark">
            <MetricsPanel metrics=metrics is_collapsed=is_metrics_panel_collapsed />
            <FeaturedCarousel
                items=Signal::derive(move || {
                    sections.get().iter().flat_map(|s| s.items.clone()).take(5).collect::<Vec<_>>()
                })
                on_select=Callback::new(move |item| selected_item.set(Some(item)))
            />
            <ContentArea
                sections=sections
                on_item_select=Callback::new(move |item| selected_item.set(Some(item)))
                on_hint_show=Callback::new(move |(item, pos)| active_hint.set(Some((item, pos))))
            />
            <Show when=move || {
                selected_item.get().is_some()
            }>
                {move || {
                    let item = selected_item.get().unwrap();
                    view! {
                        <ItemModal
                            item=item
                            is_collapsed=is_metrics_panel_collapsed
                            on_close=Callback::new(move |_| selected_item.set(None))
                            on_find_item=Callback::new(move |name| {
                                sections
                                    .get()
                                    .iter()
                                    .flat_map(|s| s.items.clone())
                                    .find(|item| item.name == name)
                            })
                        />
                    }
                }}
            </Show>
            <Show when=move || {
                active_hint.get().is_some()
            }>
                {move || {
                    let (item, pos) = active_hint.get().unwrap();
                    let is_pinned = create_rw_signal(false);
                    view! {
                        <QuickView
                            item=item
                            position=pos
                            on_close=Callback::new(move |_| active_hint.set(None))
                            on_pin=Callback::new(move |_| {})
                            is_pinned=is_pinned
                            on_find_item=Callback::new(move |name| {
                                sections
                                    .get()
                                    .iter()
                                    .flat_map(|s| s.items.clone())
                                    .find(|item| item.name == name)
                            })
                            z_index=1000
                        />
                    }
                }}
            </Show>
        </div>
    }
}

#[component]
fn QuickView(
    item: ItemData,
    position: (f64, f64),
    on_close: Callback<()>,
    on_pin: Callback<()>,
    is_pinned: RwSignal<bool>,
    on_find_item: Callback<String, Option<ItemData>>,
    z_index: i32,
) -> impl IntoView {
    let pin_progress = create_rw_signal(0.0);
    let is_pinning = create_rw_signal(false);
    let is_ready = create_rw_signal(false);
    let hover_start = create_rw_signal(None::<f64>);

    // Animation frame for pin progress
    fn animate_pin_progress(
        hover_start: RwSignal<Option<f64>>,
        pin_progress: RwSignal<f64>,
        is_pinning: RwSignal<bool>,
        on_pin: Callback<()>,
    ) {
        if let Some(start_time) = hover_start.get() {
            let current_time = window().performance().unwrap().now();
            let progress = (((current_time - start_time) / 5000.0) * 100.0).min(100.0);
            pin_progress.set(progress);

            if progress < 100.0 {
                request_animation_frame(move ||
                    animate_pin_progress(hover_start, pin_progress, is_pinning, on_pin)
                );
            } else {
                is_pinning.set(false);
                on_pin.call(());
            }
        }
    }

    let start_pinning = move |_| {
        if !is_pinned.get() {
            is_pinning.set(true);
            hover_start.set(Some(window().performance().unwrap().now()));
            request_animation_frame(move ||
                animate_pin_progress(hover_start, pin_progress, is_pinning, on_pin)
            );
        }
    };

    let stop_pinning = move |_| {
        if !is_pinned.get() {
            is_pinning.set(false);
            hover_start.set(None);
            pin_progress.set(0.0);
        }
    };

    // Measure initial render time
    create_effect(move |_| {
        let start_time = window().performance().unwrap().now();
        request_animation_frame(move || {
            is_ready.set(true);
            if let Some(metrics) = use_context::<RwSignal<UIPerformanceMetrics>>() {
                metrics.update(|m| {
                    m.hint_show_latency = window().performance().unwrap().now() - start_time;
                });
            }
        });
    });

    let progress_icon = view! {
        <div
            class="absolute top-0 left-0 h-1 transition-all duration-100 bg-primary-500"
            style=move || format!("width: {}%", pin_progress.get())
        />
    };
    let closer = view! {
        <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-semibold">{&item.name}</h3>
            <button class="text-gray-500 hover:text-gray-700" on:click=move |_| on_close.call(())>
                <span class="material-symbols-outlined">"close"</span>
            </button>
        </div>
    };

    let elements = view! {
        <div class="flex flex-wrap gap-2">
            <For
                each=move || item.traits.clone()
                key=|elem| elem.to_owned()
                children=move |elem| {
                    view! { <span class="py-1 px-2 text-sm bg-gray-100 rounded">{elem}</span> }
                }
            ></For>
        </div>
    };
    let price = create_memo(move |_| item.price.clone());
    let paragraph_content = view! {
        <div class="space-y-2">
            {elements}
            <HighlightedText
                text=item.description.clone()
                on_find_item=on_find_item
                parent_pinned=is_pinned
                z_index=z_index
            /> <Show when=move || price.get().is_some()>
                <div class="text-sm text-gray-600">{"Price: "}{price.get().unwrap()}</div>
            </Show>
        </div>
    };
    let paragraph = view! { <div class="p-4">{closer} {paragraph_content}</div> };
    let pinner = view! {
        <div
            class="fixed bg-white rounded-lg shadow-xl quick-view-card"
            class:ready=move || is_ready.get()
            class:pinned=move || is_pinned.get()
            class:pinning=move || is_pinning.get()
            style=move || {
                format!("left: {}px; top: {}px; z-index: {};", position.0, position.1, z_index)
            }
            on:mouseenter=start_pinning
            on:mouseleave=stop_pinning
        >
            {progress_icon}
            {paragraph}
        </div>
    };
    view! { {pinner} }
}

#[component]
fn HighlightedText(
    text: String,
    on_find_item: Callback<String, Option<ItemData>>,
    parent_pinned: RwSignal<bool>,
    z_index: i32,
) -> impl IntoView {
    let active_hint = create_rw_signal(None::<(ItemData, (f64, f64), RwSignal<bool>)>);
    let active_glossary = create_rw_signal(None::<(GlossaryEntry, (f64, f64))>);
    let find_references = move |text: &str| {
        let mut parts = Vec::new();
        let mut last_pos = 0;
        let text_lower = text.to_lowercase();
        for (term, entry) in get_system_glossary().iter() {
            let mut start = 0;
            while let Some(pos) = text_lower[start..].find(term) {
                let abs_pos = start + pos;
                if last_pos < abs_pos {
                    parts.push(text[last_pos..abs_pos].to_string());
                }
                parts.push(format!("[[term]]{}", &text[abs_pos..abs_pos + term.len()]));
                last_pos = abs_pos + term.len();
                start = last_pos;
            }
        }
        let re = regex::Regex::new(r"\{([^}]+)}").unwrap();
        for cap in re.captures_iter(text) {
            let m = cap.get(0).unwrap();
            if last_pos < m.start() {
                parts.push(text[last_pos..m.start()].to_string());
            }
            parts.push(format!("{{item}}{}", cap.get(1).unwrap().as_str()));
            last_pos = m.end();
        }

        if last_pos < text.len() {
            parts.push(text[last_pos..].to_string());
        }

        parts
    };

    let calculate_hint_position = move |element: &web_sys::Element| {
        let rect = element.get_bounding_client_rect();
        let window_height = window().inner_height().unwrap().as_f64().unwrap();
        let hint_height = 150.0;
        let padding = 10.0;

        // Position above by default
        let mut y = rect.top() - hint_height - padding;
        
        // If not enough space above, position below
        if y < padding {
            y = rect.bottom() + padding;
        }

        // If would go off bottom of screen, position above instead
        if y + hint_height > window_height - padding {
            y = rect.top() - hint_height - padding;
        }

        (rect.left(), y)
    };

    view! {
        <>
            <span class="highlighted-text">
                <For
                    each=move || find_references(&text)
                    key=|part| part.to_owned()
                    children=move |part| {
                        if part.starts_with("{item}") {
                            let item_name = part[6..].to_string();
                            let display_name = item_name.clone();
                            view! {
                                <span
                                    class="reference item"
                                    on:mouseenter=move |e| {
                                        if parent_pinned.get() {
                                            if let Some(item) = on_find_item.call(item_name.clone()) {
                                                if let Some(target) = e
                                                    .target()
                                                    .and_then(|t| t.dyn_into::<web_sys::Element>().ok())
                                                {
                                                    let pos = calculate_hint_position(&target);
                                                    let is_pinned = create_rw_signal(false);
                                                    active_hint.set(Some((item, pos, is_pinned)));
                                                }
                                            }
                                        }
                                    }
                                >
                                    {display_name}
                                </span>
                            }
                        } else if part.starts_with("[[term]]") {
                            let term = part[7..].to_lowercase();
                            let term_clone = term.clone();
                            view! {
                                <span
                                    class="reference term"
                                    on:mouseenter=move |e| {
                                        if parent_pinned.get() {
                                            if let Some(entry) = get_system_glossary().get(&term) {
                                                if let Some(target) = e
                                                    .target()
                                                    .and_then(|t| t.dyn_into::<web_sys::Element>().ok())
                                                {
                                                    let pos = calculate_hint_position(&target);
                                                    active_glossary.set(Some((entry.clone(), pos)));
                                                }
                                            }
                                        }
                                    }
                                >
                                    {get_system_glossary()
                                        .get(&term_clone)
                                        .map(|e| e.term.clone())
                                        .unwrap_or_else(|| term_clone.to_string())}
                                </span>
                            }
                        } else {
                            view! { <span>{part}</span> }
                        }
                    }
                />
            </span>

            // Nested QuickView
            <Show when=move || {
                active_hint.get().is_some()
            }>
                {move || {
                    let (item, pos, is_pinned) = active_hint.get().unwrap();
                    view! {
                        <QuickView
                            item=item
                            position=pos
                            on_close=Callback::new(move |_| active_hint.set(None))
                            on_pin=Callback::new(move |_| {})
                            is_pinned=is_pinned
                            on_find_item=on_find_item
                            z_index=z_index + 1
                        />
                    }
                }}
            </Show>
        </>
    }
}

#[component]
fn ContentArea(
    sections: RwSignal<Vec<CategorySection>>,
    on_item_select: Callback<ItemData>,
    on_hint_show: Callback<(ItemData, (f64, f64))>,
) -> impl IntoView {
    let toggle_section = move |section_id: String| {
        let start_time = window().performance().unwrap().now();
        sections.update(|sections| {
            for section in sections.iter_mut() {
                if section.id == section_id {
                    section.is_expanded = !section.is_expanded;
                }
            }
        });

        if let Some(metrics) = use_context::<RwSignal<UIPerformanceMetrics>>() {
            request_animation_frame(move || {
                metrics.update(|m| {
                    m.accordion_transition_time = window().performance().unwrap().now() - start_time;
                });
            });
        }
    };

    let find_item = move |name: String| -> Option<ItemData> {
        sections.get()
            .iter()
            .flat_map(|s| s.items.clone())
            .find(|item| item.name == name)
    };

    view! {
        <div class="space-y-4 p-4">
            <For
                each=move || sections.get()
                key=|section| section.id.clone()
                children=move |section: CategorySection| {
                    let section_id = create_memo(move |_| section.id.clone());
                    let is_expanded = create_memo(move |_| {
                        sections.get()
                            .iter()
                            .find(|s| s.id == section_id.get())
                            .map(|s| s.is_expanded)
                            .unwrap_or(false)
                    });
                    view! {
                        <div class="bg-white rounded-lg shadow-md overflow-hidden">
                            <button
                                class="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                                on:click=move |_| toggle_section(section_id.get().clone())
                            >
                                <h2 class="text-xl font-semibold">{&section.title}</h2>
                                <span class="material-symbols-outlined">
                                    {move || {
                                        if is_expanded.get() {
                                            "expand_less"
                                        } else {
                                            "expand_more"
                                        }
                                    }}
                                </span>
                            </button>

                            <div
                            class="transition-all duration-300 ease-in-out"
                            style=move || if is_expanded.get() {
                                "max-height: 2000px; opacity: 1;"
                            } else {
                                    "max-height: 0; opacity: 0;"
                                }
                            >
                                <div class="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
                                    <For
                                        each=move || section.items.clone()
                                        key=|item| item.id.clone()
                                        children=move |item: ItemData| {
                                            let item_clone1 = item.clone();
                                            let item_clone2 = item.clone();
                                            view! {
                                                <div
                                                    class="p-4 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer relative"
                                                    on:click=move |_| on_item_select.call(item.clone())
                                                    on:mouseenter=move |e| {
                                                        if let Some(target) = e
                                                            .target()
                                                            .and_then(|t| t.dyn_into::<web_sys::Element>().ok())
                                                        {
                                                            let rect = target.get_bounding_client_rect();
                                                            on_hint_show
                                                                .call((item_clone1.clone(), (rect.left(), rect.top())));
                                                        }
                                                    }
                                                >
                                                    <h3 class="mb-2 text-lg font-semibold">
                                                        {&item_clone2.name}
                                                    </h3>
                                                    <div class="flex flex-wrap gap-2 mb-3">

                                                    <HighlightedText
                                                        text=item_clone2.description
                                                        on_find_item=Callback::new(move |name| find_item(name))
                                                        parent_pinned=create_rw_signal(true)
                                                        z_index=1
                                                    />
                                                    </div>
                                                </div>
                                            }
                                        }
                                    ></For>
                                </div>
                            </div>
                        </div>
                    }
                }
            ></For>
        </div>
    }
}

fn generate_sample_data() -> Vec<CategorySection> {
    let categories = vec!["Weapons", "Armor", "Spells", "Feats", "Items"];
    let traits = vec![
        "magical", "rare", "cursed", "blessed", "martial", "finesse", "agile",
        "deadly", "forceful", "reach", "thrown", "versatile", "backswing", "fatal"
    ];

    categories.into_iter().map(|cat| {
        CategorySection {
            id: Uuid::new_v4().to_string(),
            title: cat.to_string(),
            is_expanded: false,
            items: (0..10).map(|i| {
                let random_traits: Vec<String> = traits
                    .choose_multiple(&mut rand::thread_rng(), 3)
                    .map(|&t| t.to_string())
                    .collect();

                ItemData {
                    id: Uuid::new_v4().to_string(),
                    name: format!("{} {}", cat, i + 1),
                    item_type: cat.to_lowercase(),
                    level: (js_sys::Math::random() * 20.0) as i32 + 1,
                    rarity: ["common", "uncommon", "rare", "unique"]
                        [(js_sys::Math::random() * 4.0) as usize]
                        .to_string(),
                    traits: random_traits,
                    description: format!(
                        "A powerful {0} that enhances your [Strength] and can be used with {{Shield Block}}. 
                         This {0} is particularly effective against {{Magic Weapon}}.", 
                        cat.to_lowercase()
                    ),
                    markdown: String::new(), // Add markdown content if needed
                    price: Some(format!("{}gp", (js_sys::Math::random() * 1000.0) as i32)),
                    requirements: Some(vec!["Strength 14".to_string()]),
                    actions: ["1", "2", "3", "reaction", "free"]
                        [(js_sys::Math::random() * 5.0) as usize]
                        .to_string(),
                    related_items: Some(vec![]),
                }
            }).collect(),
        }
    }).collect()
}

#[component]
fn ItemModal(
    item: ItemData,
    is_collapsed: RwSignal<bool>,
    on_close: Callback<()>,
    on_find_item: Callback<String, Option<ItemData>>,
) -> impl IntoView {
    let start_time = window().performance().unwrap().now();
    let is_entering = create_rw_signal(true);

    create_effect(move |_| {
        if let Some(metrics) = use_context::<RwSignal<UIPerformanceMetrics>>() {
            request_animation_frame(move || {
                metrics.update(|m| {
                    m.modal_transition_time = window().performance().unwrap().now() - start_time;
                });
            });
        }
    });
    let requirements = create_memo(move |_| item.requirements.clone());
    let price = create_memo(move |_| item.price.clone());
    view! {
        <div class="overflow-y-auto fixed inset-0 z-50" on:click=move |_| on_close.call(())>
            <div class="flex justify-center items-center px-4 min-h-screen">
                // Backdrop
                <div
                    class="fixed inset-0 bg-black transition-opacity duration-300"
                    class=("opacity-50", move || !is_entering.get())
                    class=("opacity-0", move || is_entering.get())
                    aria-hidden="true"
                />

                <div
                    class="relative w-full max-w-2xl bg-white rounded-lg shadow-xl modal-content"
                    class:entering=move || is_entering.get()
                    class:entered=move || !is_entering.get()
                    class:collapsed=move || is_collapsed.get()
                    on:click=move |e| e.stop_propagation()
                >
                    <div class="flex justify-between items-start p-6">
                        <h2 class="text-2xl font-semibold">{&item.name}</h2>
                        <div class="flex space-x-2">
                            <button
                                class="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                on:click=move |_| is_collapsed.update(|v| *v = !*v)
                                aria-label=move || {
                                    if is_collapsed.get() { "Expand details" } else { "Collapse details" }
                                }
                            >
                                <span class="material-symbols-outlined">
                                    {move || if is_collapsed.get() { "expand_more" } else { "expand_less" }}
                                </span>
                            </button>
                            <button
                                class="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                on:click=move |_| on_close.call(())
                                aria-label="Close"
                            >
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>

                    <div class="space-y-4 p-6 pt-0">
                        <div class="flex flex-wrap gap-2">
                            <For
                                each=move || item.traits.clone()
                                key=|elem| elem.to_owned()
                                children=move |elem| {
                                    view! {
                                        <span class="py-1 px-2 text-sm bg-gray-100 rounded">
                                            {elem}
                                        </span>
                                    }
                                }
                            ></For>
                        </div>

                        <div class="prose">
                            <HighlightedText
                                text=item.description.clone()
                                on_find_item=on_find_item
                                parent_pinned=create_rw_signal(true)
                                z_index=100
                            />
                        </div>

                        <Show when=move || requirements.get().is_some()>
                            <div class="requirements">
                                <h3 class="text-lg font-semibold">Requirements</h3>
                                <ul class="pl-5 list-disc">
                                    <For
                                        each=move || requirements.get().clone().unwrap_or_default()
                                        key=|req| req.to_owned()
                                        children=move |req| view! { <li>{req}</li> }
                                    ></For>
                                </ul>
                            </div>
                        </Show>

                        <Show when=move || price.get().is_some()>
                            <div class="text-sm text-gray-600">
                                {"Price: "}{price.get().unwrap()}
                            </div>
                        </Show>
                    </div>
                </div>
            </div>
        </div>
    }
}

use std::sync::OnceLock;
use std::collections::HashMap;

static SYSTEM_GLOSSARY: OnceLock<HashMap<String, GlossaryEntry>> = OnceLock::new();

fn get_system_glossary() -> &'static HashMap<String, GlossaryEntry> {
    SYSTEM_GLOSSARY.get_or_init(|| {
        let mut m = HashMap::new();
        m.insert(
            "strength".to_string(),
            GlossaryEntry {
                term: "Strength".to_string(),
                description: "A measure of physical power. Affects carrying capacity, melee damage, and certain skill checks.".to_string(),
                related_terms: Some(vec!["Athletics".to_string()]),
                examples: Some(vec![
                    "Required for heavy armor".to_string(),
                    "Used for climbing checks".to_string(),
                ]),
            },
        );
        m.insert(
            "dexterity".to_string(),
            GlossaryEntry {
                term: "Dexterity".to_string(),
                description: "Represents agility and reflexes. Affects accuracy, defense, and movement.".to_string(),
                related_terms: Some(vec!["Acrobatics".to_string(), "Stealth".to_string()]),
                examples: Some(vec![
                    "Used for ranged attacks".to_string(),
                    "Determines Reflex saves".to_string(),
                ]),
            },
        );
        m
    })
}

#[component]
fn GlossaryQuickView(
    entry: GlossaryEntry,
    position: (f64, f64),
    on_close: Callback<()>,
    z_index: i32,
) -> impl IntoView {
    let is_ready = create_rw_signal(false);
    let entry = store_value(entry); // Store the entry value

    create_effect(move |_| {
        request_animation_frame(move || {
            is_ready.set(true);
        });
    });

    view! {
        <div
            class="fixed bg-white rounded-lg shadow-xl quick-view-card"
            class:ready=move || is_ready.get()
            style=move || {
                format!("left: {}px; top: {}px; z-index: {};", position.0, position.1, z_index)
            }
        >
            <div class="p-4">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-lg font-semibold">{move || entry.get_value().term.clone()}</h3>
                    <button
                        class="text-gray-500 hover:text-gray-700"
                        on:click=move |_| on_close.call(())
                    >
                        <span class="material-symbols-outlined">"close"</span>
                    </button>
                </div>

                <div class="space-y-4">
                    <p>{move || entry.get_value().description.clone()}</p>

                    <Show when=move || {
                        let examples = entry.get_value().examples.clone();
                        examples.is_some()
                    }>
                        <div class="examples">
                            <h4 class="font-semibold">Examples:</h4>
                            <ul class="pl-5 list-disc">
                                <For
                                    each=move || {
                                        entry.get_value().examples.clone().unwrap_or_default()
                                    }
                                    key=|example| example.clone()
                                    children=move |example| view! { <li>{example}</li> }
                                ></For>
                            </ul>
                        </div>
                    </Show>

                    <Show when=move || entry.get_value().related_terms.is_some()>
                        <div class="related-terms">
                            <h4 class="font-semibold">Related:</h4>
                            <div class="flex flex-wrap gap-2">
                                <For
                                    each=move || {
                                        entry.get_value().related_terms.clone().unwrap_or_default()
                                    }
                                    key=|term| term.clone()
                                    children=move |term| {
                                        view! {
                                            <span class="py-1 px-2 text-sm bg-gray-100 rounded">
                                                {term}
                                            </span>
                                        }
                                    }
                                ></For>
                            </div>
                        </div>
                    </Show>
                </div>
            </div>
        </div>
    }
}