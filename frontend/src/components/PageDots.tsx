import DotField from "@/components/DotField";

export function PageDots() {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2">
      <DotField
        dotRadius={1.5}
        dotSpacing={16}
        cursorRadius={220}
        bulgeOnly
        bulgeStrength={40}
        glowRadius={120}
        gradientFrom="rgba(67, 83, 71, 0.4)"
        gradientTo="rgba(67, 83, 71, 0.4)"
        glowColor="rgba(212, 212, 212, 0)"
      />
    </div>
  );
}
