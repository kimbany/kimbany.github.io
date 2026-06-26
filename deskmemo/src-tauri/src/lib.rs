// DeskMemo — Tauri 2.x backend
//
// M0 scope:
//   - frameless, always-on-top board window (configured in tauri.conf.json)
//   - tray icon with menu, app keeps running in tray after window close
//   - global shortcuts: Ctrl+Alt+N (new note), Ctrl+Alt+Home (toggle board)
//
// The frontend (src/) receives a "new-note" event when Ctrl+Alt+N fires.

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};

const BOARD_LABEL: &str = "board";

/// Show + focus the board window, creating nothing (it is declared in config).
fn show_board(app: &tauri::AppHandle) {
    if let Some(win) = app.get_webview_window(BOARD_LABEL) {
        let _ = win.show();
        let _ = win.unminimize();
        let _ = win.set_focus();
    }
}

/// Toggle board visibility (hide if visible, show+focus otherwise).
fn toggle_board(app: &tauri::AppHandle) {
    if let Some(win) = app.get_webview_window(BOARD_LABEL) {
        match win.is_visible() {
            Ok(true) => {
                let _ = win.hide();
            }
            _ => show_board(app),
        }
    }
}

/// Ask the frontend to create a new note, bringing the board forward first.
fn trigger_new_note(app: &tauri::AppHandle) {
    show_board(app);
    let _ = app.emit("new-note", ());
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_notification::init());

    // Global shortcuts are desktop-only.
    #[cfg(desktop)]
    {
        use tauri_plugin_global_shortcut::ShortcutState;

        builder = builder.plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state != ShortcutState::Pressed {
                        return;
                    }
                    // Compare against freshly-built Shortcut values rather than
                    // relying on a particular string formatting.
                    if *shortcut == new_note_shortcut() {
                        trigger_new_note(app);
                    } else if *shortcut == toggle_shortcut() {
                        toggle_board(app);
                    }
                })
                .build(),
        );
    }

    builder
        .setup(|app| {
            #[cfg(desktop)]
            register_shortcuts(app.handle())?;
            build_tray(app.handle())?;
            Ok(())
        })
        // Closing the window hides it instead of quitting — DeskMemo lives in the tray.
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == BOARD_LABEL {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running DeskMemo");
}

// Shortcut definitions (CLAUDE.md §6). Built on demand so both the handler
// (above) and registration (below) share one source of truth. Made
// configurable in a later milestone.
#[cfg(desktop)]
fn new_note_shortcut() -> tauri_plugin_global_shortcut::Shortcut {
    use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut};
    Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyN)
}

#[cfg(desktop)]
fn toggle_shortcut() -> tauri_plugin_global_shortcut::Shortcut {
    use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut};
    Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::Home)
}

#[cfg(desktop)]
fn register_shortcuts(app: &tauri::AppHandle) -> tauri::Result<()> {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;

    for sc in [new_note_shortcut(), toggle_shortcut()] {
        if let Err(e) = app.global_shortcut().register(sc) {
            eprintln!("failed to register shortcut: {e}");
        }
    }
    Ok(())
}

fn build_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    let new_note = MenuItem::with_id(app, "new_note", "새 메모", true, Some("Ctrl+Alt+N"))?;
    let toggle = MenuItem::with_id(app, "toggle", "보드 보이기/숨기기", true, Some("Ctrl+Alt+Home"))?;
    let sep = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "종료", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&new_note, &toggle, &sep, &quit])?;

    TrayIconBuilder::with_id("main")
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("DeskMemo")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "new_note" => trigger_new_note(app),
            "toggle" => toggle_board(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            // Left click on the tray icon toggles the board.
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                toggle_board(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}
