import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CommentaryStyle } from "@/types/game";

interface StyleToggleProps {
  value: CommentaryStyle;
  onChange: (style: CommentaryStyle) => void;
  disabled?: boolean;
}

export function StyleToggle({ value, onChange, disabled }: StyleToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as CommentaryStyle)}
      disabled={disabled}
      className="w-full"
    >
      <ToggleGroupItem value="coach" className="flex-1">
        Coach
      </ToggleGroupItem>
      <ToggleGroupItem value="commentator" className="flex-1">
        Commentator
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
