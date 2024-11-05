use leptos::*;
use serde::{ Deserialize, Serialize };
use uuid::Uuid;
use wasm_bindgen::prelude::Closure;
use wasm_bindgen::JsCast;
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Post {
    id: String,
    author: String,
    content: String,
    likes: usize,
    comments: usize,
    timestamp: String,
}

impl Post {
    fn generate_mock() -> Self {
        let id = Uuid::new_v4().to_string();
        Self {
            id,
            author: format!("User_{}", js_sys::Math::random() * 1000.0),
            content: format!("Random post content {}", js_sys::Math::random() * 100.0),
            likes: (js_sys::Math::random() * 1000.0) as usize,
            comments: (js_sys::Math::random() * 100.0) as usize,
            timestamp: "2024-02-14".to_string(), // We can make this more sophisticated later
        }
    }
}

#[component]
pub fn InfiniteScrollBench() -> impl IntoView {
    let posts = create_rw_signal(Vec::new());
    let loading = create_rw_signal(false);
    let error = create_rw_signal(None::<String>);
    let observer_target = create_node_ref::<html::Div>();

    // Load initial posts
    create_effect(move |_| {
        load_more_posts(posts, loading, error);
    });

    // Intersection observer for infinite scroll
    let load_more = move || {
        load_more_posts(posts, loading, error);
    };
    create_effect(move |_| {
        if let Some(el) = observer_target.get() {
            let callback = Closure::wrap(
                Box::new(move |entries: js_sys::Array, _observer: web_sys::IntersectionObserver| {
                    if entries.length() > 0 {
                        let entry: web_sys::IntersectionObserverEntry = entries
                            .get(0)
                            .unchecked_into();
                        if entry.is_intersecting() && !loading.get() {
                            load_more();
                        }
                    }
                }) as Box<dyn FnMut(js_sys::Array, web_sys::IntersectionObserver)>
            );

            let observer = web_sys::IntersectionObserver
                ::new(callback.as_ref().unchecked_ref())
                .unwrap();

            observer.observe(&el);
            callback.forget(); // Prevent callback from being dropped
        }
    });

    view! {
        <div class="p-4 mx-auto max-w-2xl infinite-scroll-container">
            <div class="space-y-4">
                <For
                    each=move || posts.get()
                    key=|post| post.id.clone()
                    children=move |post| {
                        view! { <PostCard post=post /> }
                    }
                />
            </div>

            // Loading indicator
            <Show
                when=move || loading.get()
                fallback=|| view! { <div class="py-4 text-center">"Load more"</div> }
            >
                <div class="flex justify-center py-4">
                    <div class="loading-spinner" />
                </div>
            </Show>

            // Error message
            <Show when=move || error.get().is_some()>
                <div class="py-4 text-center text-red-500">
                    {move || error.get().unwrap_or_default()}
                </div>
            </Show>

            // Intersection observer target
            <div _ref=observer_target class="h-4" />
        </div>
    }
}

#[component]
fn PostCard(post: Post) -> impl IntoView {
    let likes = create_rw_signal(post.likes);
    let liked = create_rw_signal(false);

    let toggle_like = move |_| {
        liked.update(|l| {
            *l = !*l;
        });
        likes.update(|count| {
            if liked.get() {
                *count += 1;
            } else {
                *count -= 1;
            }
        });
    };

    view! {
        <div class="p-4 space-y-3 bg-white rounded-lg shadow transition-all duration-300 hover:shadow-lg">
            <div class="flex items-center space-x-2">
                <div class="flex justify-center items-center w-10 h-10 bg-gray-200 rounded-full">
                    <span class="text-gray-500 material-symbols-outlined">person</span>
                </div>
                <div>
                    <div class="font-semibold">{&post.author}</div>
                    <div class="text-sm text-gray-500">{&post.timestamp}</div>
                </div>
            </div>

            <p class="text-gray-700">{&post.content}</p>

            <div class="flex items-center space-x-4">
                <button
                    class="like-button"
                    class:liked=move || liked.get()
                    on:click=toggle_like
                >
                    <span class="material-symbols-outlined">
                        {move || if liked.get() { "favorite" } else { "favorite_border" }}
                    </span>
                    <span>{move || likes.get()}</span>
                </button>

                <div class="flex items-center space-x-1">
                    <span class="material-symbols-outlined">chat_bubble_outline</span>
                    <span>{post.comments}</span>
                </div>
            </div>
        </div>
    }
}
fn load_more_posts(
    posts: RwSignal<Vec<Post>>,
    loading: RwSignal<bool>,
    error: RwSignal<Option<String>>
) {
    loading.set(true);
    error.set(None); // Clear any previous errors

    // Simulate network delay with random failures
    set_timeout(move || {
        // Simulate random network errors (1 in 10 chance)
        if js_sys::Math::random() < 0.1 {
            loading.set(false);
            error.set(Some("Failed to load posts. Please try again.".to_string()));
            return;
        }

        loading.set(false);

        // Generate new mock posts
        let new_posts: Vec<Post> = (0..10).map(|_| Post::generate_mock()).collect();

        posts.update(|current_posts| {
            current_posts.extend(new_posts);
        });
    }, std::time::Duration::from_millis(1000));
}