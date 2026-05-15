# 케이브맨(Caveman) 설치 가이드

[JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) — Claude Code 및 30종 이상의 AI 에이전트에서 출력 토큰을 약 75% 줄여주는 압축 스킬.

## 무엇을 설치하나?

기본 설치 시 자동 감지된 에이전트에 다음 항목들이 들어갑니다.

- **Claude Code 플러그인** — `caveman` 플러그인이 마켓플레이스에서 설치됨
- **Claude Code 훅(hooks)** — SessionStart / UserPromptSubmit / statusline이 `~/.claude/settings.json`에 병합됨
- **caveman-shrink MCP** — 업스트림 MCP 서버의 툴 설명을 압축해주는 프록시
- **Codex CLI / Cursor / Windsurf 등** — 감지되면 `npx skills add`로 자동 연동

## 사전 요구사항

- Node.js 18 이상
- `curl`, `bash` (macOS / Linux / WSL / Git Bash)
- Claude Code, Codex CLI 등 대상 에이전트가 이미 설치되어 있어야 자동 감지됨

## 설치

### macOS / Linux / WSL / Git Bash

```sh
curl -fsSL https://raw.githubusercontent.com/JuliusBrussee/caveman/main/install.sh | bash
```

### Windows PowerShell

```powershell
irm https://raw.githubusercontent.com/JuliusBrussee/caveman/main/install.ps1 | iex
```

### 먼저 무엇이 설치될지 확인 (dry-run)

```sh
curl -fsSL https://raw.githubusercontent.com/JuliusBrussee/caveman/main/install.sh | bash -s -- --dry-run
```

실행되는 모든 명령과 파일 경로를 미리 보여주고, 실제로는 아무것도 쓰지 않습니다.

## 자주 쓰는 옵션

`bash -s --` 뒤에 플래그를 그대로 넘기면 됩니다.

| 플래그 | 설명 |
| --- | --- |
| `--dry-run` | 실제 설치 없이 실행 내역만 출력 |
| `--all` | 훅 + 레포별 룰 파일 + MCP shrink 전부 활성화 |
| `--minimal` | 플러그인/확장만 설치 (훅·MCP 제외) |
| `--with-hooks` / `--no-hooks` | Claude Code 훅 설치 토글 (기본 ON) |
| `--with-mcp-shrink` / `--no-mcp-shrink` | caveman-shrink MCP 등록 토글 (기본 ON) |
| `--with-init` | 현재 레포에 Cursor/Windsurf/AGENTS.md 등 룰 파일 작성 |
| `--only <agent>` | 특정 에이전트만 설치 (반복 가능) |
| `--force` | 이미 설치돼 있어도 재실행 |
| `--config-dir <경로>` | `~/.claude` 대신 사용할 설정 디렉터리 |
| `--non-interactive` | 프롬프트 없이 기본값으로 진행 |
| `--list` | 지원 에이전트 매트릭스 출력 |
| `--uninstall` (`-u`) | 머신에서 caveman 제거 |
| `--help` (`-h`) | 사용법 출력 |

예) 레포에 들어가서 풀세트 설치:

```sh
cd ~/my-project
curl -fsSL https://raw.githubusercontent.com/JuliusBrussee/caveman/main/install.sh | bash -s -- --all --with-init
```

## 설치 후 사용

- Claude Code 세션에서 `/caveman` 슬래시 명령 실행
- 또는 아무 세션에서나 "caveman mode" 라고 입력하면 활성화
- 모드: `lite` / `full` (기본) / `ultra` / `wenyan` (고전 중국어)
- 부가 명령: `/caveman-commit`, `/caveman-review`, `/caveman-stats`, `/caveman-compress`

## 제거

```sh
npx -y github:JuliusBrussee/caveman -- --uninstall
```

## 참고

- 저장소: https://github.com/JuliusBrussee/caveman
- 수동 설치 가이드: 저장소 내 `INSTALL.md`
