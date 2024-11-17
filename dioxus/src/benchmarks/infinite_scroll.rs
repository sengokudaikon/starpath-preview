#![allow(non_snake_case)]

use dioxus::prelude::*;
use dioxus::web::WebEventExt;
use dioxus_logger::tracing;
use futures_util::stream::StreamExt;
use js_sys::Promise;
use serde::{Deserialize, Serialize};
use serde_wasm_bindgen::{from_value, to_value};
use uuid::Uuid;
use wasm_bindgen::closure::Closure;
use wasm_bindgen::{JsCast, JsValue};
use web_sys::{window, IntersectionObserver, IntersectionObserverEntry};

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
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
            comments: (js_sys::Math::random() * 50.0) as usize,
            timestamp: "2023-04-01T12:00:00Z".to_string(),
        }
    }
}

fn load_more_posts() -> Vec<Post> {
    (0..10).map(|_| Post::generate_mock()).collect()
}

#[derive(Serialize, Deserialize)]
struct AppProps {}

pub fn App() -> Element {
    let mut posts = use_signal(Vec::<Post>::new);
    let mut loading = use_signal(|| false);
    let mut error = use_signal(|| None::<String>);

    use_future(move || async move {
        load_more_posts_to_state(&mut posts, &mut loading, &mut error).await;
    });

    let load_more = use_coroutine(|mut rx: UnboundedReceiver<Option<()>>| async move {
        while let Some(_) = rx.next().await {
            load_more_posts_to_state(&mut posts, &mut loading, &mut error).await;
        }
    });

    rsx! {
        div {
            class: "container",
            h1 { "Infinite Scroll Example" }
            ul {
                {posts.read().iter().map(|post| rsx!(li { key: "{post.id}",  PostCard { post: post.clone()  }  }))}
            }
            if *loading.read() {
                span { "Loading..." }
            } else if let Some(err) = error.read().clone() {
                span { class: "error",  }
            }
            div {
                onmounted: move |evt| {
                    let elem = evt.web_event();


                    let callback = Closure::wrap(Box::new(move |entries: js_sys::Array| {
                        for entry in entries.iter() {
                            let entry: IntersectionObserverEntry = entry.into();

                            if entry.is_intersecting() {
                                load_more.send(Some(()))
                            };
                        }
                    }) as Box<dyn FnMut(js_sys::Array)>);



                    let observer = IntersectionObserver
                        ::new(callback.as_ref().unchecked_ref())
                        .unwrap();

                    observer.observe(elem);
                    callback.forget();

                },
                "END"
            }
        }
    }
}

async fn load_more_posts_to_state(
    mut posts: &mut Signal<Vec<Post>>,
    mut loading: &mut Signal<bool>,
    mut error: &mut Signal<Option<String>>,
) {
    loading.set(true);
    error.set(None); // Clear any previous errors

    let window = window().expect("should have a window");

    // Simulate network delay with random failures
    let timeout = wasm_bindgen_futures::JsFuture::from(Promise::new(&mut |resolve, reject| {
        let closure = Closure::once_into_js(move || {
            let new_posts = load_more_posts();

            let values = serde_json::to_value(new_posts).unwrap();

            resolve.call1(&JsValue::NULL, &to_value(&values).unwrap());
        });

        window
            .set_timeout_with_callback_and_timeout_and_arguments_0(closure.unchecked_ref(), 1000)
            .expect("should register timeout");
    }));

    match timeout.await {
        Ok(new_posts) => {
            let new_posts: Vec<Post> = serde_json::from_value(
                from_value(new_posts).expect("Failed to convert JsValue to serde_json::Value"),
            )
            .expect("aboba");
            let mut current_items = posts.write();
            current_items.extend(new_posts);
        }
        Err(_) => {
            loading.set(false);
            error.set(Some("Failed to load posts. Please try again.".to_string()));
        }
    };

    loading.set(false);
}

#[derive(PartialEq, Props, Clone)]
struct PostCardProps {
    post: Post,
}

fn PostCard(props: PostCardProps) -> Element {
    let PostCardProps { post } = props;

    rsx! {
        div { class: "post-card",
            h2 { "{post.author}" }
            p { "{post.content}" }
            button {
                onclick: |_| println!("Like clicked"),
                class: "like-button",
                if post.likes > 0 {
                    span { "favorite" }
                } else {
                    span { "favorite_border" }
                }
                "{post.likes}"
            }
            div {
                span { "chat_bubble_outline" }
                span { "{post.comments}" }
            }
        }
    }
}
