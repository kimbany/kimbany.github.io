// =====================================================================
// lib.rs - Tauri 앱 빌더 + 플러그인 등록
// ---------------------------------------------------------------------
// Rust 쪽은 거의 건드릴 일 없음: 창 관리, 글로벌 단축키, 스토어 플러그인 정도.
// 위장/계산/채팅 로직은 전부 프론트엔드(JS).
// =====================================================================

mod commands;
mod shortcuts;
mod window;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            shortcuts::register_panic_shortcut(app)?;
            window::wire_focus_events(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![commands::ping])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
