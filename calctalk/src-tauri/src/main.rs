// CalcTalk - Tauri 엔트리.
// 실제 로직은 lib.rs(calctalk_lib)에 두고 여기선 호출만.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    calctalk_lib::run();
}
