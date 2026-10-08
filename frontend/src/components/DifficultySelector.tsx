import { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDifficultyLevels } from "@/lib/api";
import type { DifficultyLevel } from "@/types/game";

interface DifficultySelectorProps {
  value: number;
  onChange: (level: number) => void;
  disabled?: boolean;
}

export function DifficultySelector({ value, onChange, disabled }: DifficultySelectorProps) {
  const [levels, setLevels] = useState<DifficultyLevel[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadFailed(false);
    getDifficultyLevels()
      .then((data) => {
        if (!cancelled) setLevels(data);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  return (
    <div className="space-y-1.5">
      <Label htmlFor="difficulty-select">Difficulty</Label>
      <Select
        value={levels.length > 0 ? String(value) : undefined}
        onValueChange={(v) => onChange(Number(v))}
        disabled={disabled || levels.length === 0}
      >
        <SelectTrigger id="difficulty-select" className="w-full">
          <SelectValue placeholder={loadFailed ? "Couldn't load difficulty levels" : "Loading…"} />
        </SelectTrigger>
        <SelectContent>
          {levels.map((level) => (
            <SelectItem key={level.level} value={String(level.level)}>
              {level.level} — {level.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {loadFailed && (
        <p className="text-xs text-destructive">
          Could not reach the server.{" "}
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() => setRetryKey((k) => k + 1)}
          >
            Retry
          </button>
        </p>
      )}
    </div>
  );
}
