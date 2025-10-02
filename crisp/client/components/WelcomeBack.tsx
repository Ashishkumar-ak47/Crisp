import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/state/store";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function WelcomeBack() {
  const { state, dispatch } = useStore();
  const unfinished = useMemo(() => state.candidates.find((c) => c.status === "in_progress") ?? null, [state.candidates]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (unfinished && !state.currentSessionId) setOpen(true);
  }, [unfinished, state.currentSessionId]);

  if (!unfinished) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome back</DialogTitle>
          <DialogDescription>
            You have an unfinished interview for {unfinished.name ?? "a candidate"}. Would you like to resume?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { setOpen(false); dispatch({ type: "SET_CURRENT", payload: { id: null } }); }}>Discard</Button>
          <Button onClick={() => { dispatch({ type: "SET_CURRENT", payload: { id: unfinished.id } }); setOpen(false); }}>Resume</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
