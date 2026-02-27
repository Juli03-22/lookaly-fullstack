/**
 * MarkdownTextarea
 * Textarea con una barra de herramientas mínima para formateo Markdown.
 * Soporta: **negrita**, *cursiva*, y listas con viñetas (- item).
 */
import { useRef, KeyboardEvent } from 'react';
import { Bold, Italic, List } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
}

export default function MarkdownTextarea({ value, onChange, rows = 4, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  /** Envuelve el texto seleccionado con before/after (negrita, cursiva). */
  function wrap(before: string, after: string) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    });
  }

  /** Prefija cada línea seleccionada con "- " para viñetas. */
  function bullets() {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    // Si no hay selección, insertar una línea de viñeta vacía
    if (start === end) {
      const atLineStart = start === 0 || value[start - 1] === '\n';
      const prefix = atLineStart ? '- ' : '\n- ';
      const next = value.slice(0, start) + prefix + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + prefix.length, start + prefix.length);
      });
      return;
    }
    const lined = selected
      .split('\n')
      .map(l => (l.startsWith('- ') ? l : `- ${l}`))
      .join('\n');
    const next = value.slice(0, start) + lined + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, start + lined.length);
    });
  }

  /** Atajos de teclado: Ctrl+B → negrita, Ctrl+I → cursiva. */
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (!e.ctrlKey && !e.metaKey) return;
    if (e.key === 'b' || e.key === 'B') { e.preventDefault(); wrap('**', '**'); }
    if (e.key === 'i' || e.key === 'I') { e.preventDefault(); wrap('*', '*'); }
  }

  const btnCls =
    'flex items-center justify-center w-7 h-6 rounded text-[#7D3150]/60 ' +
    'hover:bg-[#7D3150]/10 hover:text-[#7D3150] transition-colors';

  return (
    <div className="border border-[#E5B6C3]/40 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#7D3150]/25 bg-[#FDF8F9]">
      {/* Barra de herramientas */}
      <div className="flex items-center gap-0.5 px-2 py-[3px] border-b border-[#E5B6C3]/30 bg-[#FDF8F9]">
        <button
          type="button"
          title="Negrita (Ctrl+B)"
          onMouseDown={e => { e.preventDefault(); wrap('**', '**'); }}
          className={btnCls}
        >
          <Bold className="w-[13px] h-[13px]" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          title="Cursiva (Ctrl+I)"
          onMouseDown={e => { e.preventDefault(); wrap('*', '*'); }}
          className={btnCls}
        >
          <Italic className="w-[13px] h-[13px]" strokeWidth={2.5} />
        </button>
        <div className="w-px h-3.5 bg-[#E5B6C3]/50 mx-1" />
        <button
          type="button"
          title="Lista con viñetas"
          onMouseDown={e => { e.preventDefault(); bullets(); }}
          className={btnCls}
        >
          <List className="w-[13px] h-[13px]" strokeWidth={2.5} />
        </button>
        <span className="ml-auto text-[10px] text-[#7D3150]/30 pr-1 select-none">Markdown</span>
      </div>

      {/* Textarea sin estilos de borde propios */}
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-[13px] text-[#3a1a28] resize-none focus:outline-none bg-[#FDF8F9] placeholder-[#3a1a28]/30"
      />
    </div>
  );
}
