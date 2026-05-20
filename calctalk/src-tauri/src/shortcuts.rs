// =====================================================================
// shortcuts.rs - 글로벌 단축키 (패닉)
// ---------------------------------------------------------------------
// Ctrl+Q(윈도우) / Cmd+Q(맥)를 글로벌로 등록해서, 앱에 포커스가 없어도
// 즉시 위장 복귀 이벤트("panic")를 프론트엔드로 emit.
// (포커스가 있을 때의 ESC/Ctrl+Q는 JS panic.js가 직접 처리)
// =====================================================================

use tauri::{App, Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

pub fn register_panic_shortcut(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    // CmdOrCtrl + Q
    let panic_shortcut = Shortcut::new(Some(Modifiers::SUPER | Modifiers::CONTROL), Code::KeyQ);
    let handle = app.handle().clone();

    app.global_shortcut().on_shortcut(panic_shortcut, move |_app, _scut, event| {
        if event.state() == ShortcutState::Pressed {
            if let Some(win) = handle.get_webview_window("main") {
                let _ = win.emit("panic", ());
            }
        }
    })?;

    Ok(())
}
