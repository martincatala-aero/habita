"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export function CreateRewardButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pointsCost, setPointsCost] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          pointsCost: parseInt(pointsCost, 10),
        }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const errorData = data as { error?: string };
        throw new Error(errorData.error ?? "Error al crear la recompensa");
      }

      setOpen(false);
      setName("");
      setDescription("");
      setPointsCost("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva recompensa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear nueva recompensa</DialogTitle>
          <DialogDescription>
            Define una recompensa que los miembros puedan canjear con sus puntos
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Nombre de la recompensa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
              minLength={2}
              maxLength={100}
            />
          </div>
          <div>
            <Input
              placeholder="Descripción (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              maxLength={500}
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Costo en puntos"
              value={pointsCost}
              onChange={(e) => setPointsCost(e.target.value)}
              disabled={isLoading}
              required
              min={1}
              max={10000}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear recompensa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
