import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function PreviewDialog({ data, onConfirm, onCancel }) {
  if (!data) return null;

  return (
    <Dialog open={!!data} onOpenChange={() => onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Preview Participant Data</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {Object.entries(data).map(([key, value]) => (
            <div key={key}>
              <label className="font-medium">{key}:</label>
              <p>{value}</p>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Use Data</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 