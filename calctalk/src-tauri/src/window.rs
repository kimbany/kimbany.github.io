// =====================================================================
// window.rs - 창 관리 / 포커스 감지
// ---------------------------------------------------------------------
// 창 포커스 변화를 프론트엔드로 전달("focus-changed"). 자동 위장 타이머는
// 프론트엔드 panic.js가 가지고 있으므로, 여기선 OS 레벨 포커스 이벤트만 중계.
// (웹뷰의 window blur/focus로도 충분하지만, 더 신뢰성 있는 신호를 위해 중계)
// =====================================================================

use tauri::{App, Emitter, Manager, WindowEvent};

pub fn wire_focus_events(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(win) = app.get_webview_window("main") {
        let handle = win.clone();
        win.on_window_event(move |event| {
            if let WindowEvent::Focused(focused) = event {
                let _ = handle.emit("focus-changed", *focused);
            }
        });
    }
    Ok(())
}
