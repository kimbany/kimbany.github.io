"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface State {
  error: Error | null;
}

/** 페이지 단위 에러 격리 — 한 화면 오류로 앱 전체가 멈추지 않게 한다 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card px-6 py-16 text-center">
        <AlertTriangle className="size-8 text-warning" />
        <h2 className="mt-3 text-base font-semibold">화면을 표시하는 중 문제가 발생했습니다</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{this.state.error.message}</p>
        <Button className="mt-5" variant="outline" onClick={() => this.setState({ error: null })}>
          다시 시도
        </Button>
      </div>
    );
  }
}
