"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import type { PlatformId } from "@/types/ad-data";
import { PLATFORM_LIST } from "@/lib/config/platforms";
import { getParser } from "@/lib/parsers";
import { SUPPORTED_EXTENSIONS } from "@/lib/parsers/file-reader";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

interface Props {
  platform: PlatformId;
  brand: string;
  brands: string[];
  loading: boolean;
  onPlatformChange: (p: PlatformId) => void;
  onBrandChange: (b: string) => void;
  onFile: (file: File) => void;
}

/** 플랫폼 · 브랜드 선택 + 파일 선택 / 드래그 앤 드롭 */
export function FileUploader({ platform, brand, brands, loading, onPlatformChange, onBrandChange, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const parser = getParser(platform);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>광고 플랫폼</Label>
          <NativeSelect value={platform} onChange={(e) => onPlatformChange(e.target.value as PlatformId)}>
            {PLATFORM_LIST.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} — {p.description}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label>브랜드</Label>
          <NativeSelect value={brand} onChange={(e) => onBrandChange(e.target.value)}>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{parser.guide}</p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f && !loading) onFile(f);
        }}
        onClick={() => !loading && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 px-6 py-10 text-center transition-colors hover:bg-muted/60",
          drag && "border-primary bg-accent",
          loading && "cursor-wait opacity-70",
        )}
      >
        {loading ? <Loader2 className="size-8 animate-spin text-primary" /> : <UploadCloud className="size-8 text-muted-foreground" />}
        <p className="mt-3 text-sm font-medium">{loading ? "파일을 분석하는 중입니다…" : "파일을 끌어다 놓거나 클릭해서 선택하세요"}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <FileSpreadsheet className="size-3.5" /> {SUPPORTED_EXTENSIONS.map((e) => e.toUpperCase()).join(" · ")} · 최대 20MB · 파일은 브라우저 안에서만 처리됩니다
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xls,.xlsx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
