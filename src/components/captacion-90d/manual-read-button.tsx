"use client";

import { useState, useTransition } from "react";
import { BookOpenCheck, Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import { markManualRead } from "~/lib/actions/captacion";
import { formatDateTime } from "~/lib/utils";

interface ManualReadButtonProps {
  initialReadAt: string | null;
}

export function ManualReadButton({ initialReadAt }: ManualReadButtonProps) {
  const [readAt, setReadAt] = useState<string | null>(initialReadAt);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const res = await markManualRead();
      if (res.ok) {
        setReadAt(new Date().toISOString());
      }
    });
  }

  if (readAt) {
    return (
      <div className="flex items-center gap-2 text-xs text-success">
        <Check className="h-3.5 w-3.5" strokeWidth={1.8} />
        <span>Marcado como leído el {formatDateTime(readAt)}</span>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="primary"
      onClick={handleClick}
      loading={pending}
      className="gap-1.5"
    >
      <BookOpenCheck className="h-3.5 w-3.5" strokeWidth={1.8} />
      Marcar manual como leído
    </Button>
  );
}
