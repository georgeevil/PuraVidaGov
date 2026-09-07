/** Small ⓘ glyph with the English translation as a native tooltip. */
export function Tip({ en }: { en: string }) {
  return (
    <span
      title={en}
      aria-label={`English: ${en}`}
      className="ml-1 inline-block cursor-help select-none align-middle text-xs font-normal text-slate-400 hover:text-primary-600"
    >
      ⓘ
    </span>
  );
}
