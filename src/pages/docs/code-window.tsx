import { ClipboardCheck, Copy } from "lucide-react";

export function CodeWindow({
  label,
  testId,
  copied,
  onCopy,
  children,
}: {
  label: string;
  testId: string;
  copied: string;
  onCopy: () => void;
  children: string;
}) {
  return (
    <div className="code-window">
      <div className="code-window-top">
        <span>
          <i />
          <i />
          <i />
        </span>
        <button onClick={onCopy} data-testid={`button-copy-doc-${testId}`}>
          {copied === testId ? (
            <ClipboardCheck size={15} />
          ) : (
            <Copy size={15} />
          )}{" "}
          {copied === testId ? "Copied" : `Copy ${label}`}
        </button>
      </div>
      <pre>{children}</pre>
    </div>
  );
}
