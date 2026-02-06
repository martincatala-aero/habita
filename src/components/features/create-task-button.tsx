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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

export function CreateTaskButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("WEEKLY");
  const [weight, setWeight] = useState("1");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          frequency,
          weight: parseInt(weight, 10),
          estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined,
        }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const errorData = data as { error?: string };
        throw new Error(errorData.error ?? "Error al crear la tarea");
      }

      setOpen(false);
      setName("");
      setDescription("");
      setFrequency("WEEKLY");
      setWeight("1");
      setEstimatedMinutes("");
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
          Nueva tarea
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear nueva tarea</DialogTitle>
          <DialogDescription>
            Define una tarea para asignar a los miembros del hogar
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Nombre de la tarea"
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Frecuencia</label>
              <Select value={frequency} onValueChange={setFrequency} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Diaria</SelectItem>
                  <SelectItem value="WEEKLY">Semanal</SelectItem>
                  <SelectItem value="BIWEEKLY">Quincenal</SelectItem>
                  <SelectItem value="MONTHLY">Mensual</SelectItem>
                  <SelectItem value="ONCE">Una vez</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Dificultad</label>
              <Select value={weight} onValueChange={setWeight} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Muy fácil</SelectItem>
                  <SelectItem value="2">Fácil</SelectItem>
                  <SelectItem value="3">Media</SelectItem>
                  <SelectItem value="4">Difícil</SelectItem>
                  <SelectItem value="5">Muy difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Input
              type="number"
              placeholder="Tiempo estimado (minutos)"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              disabled={isLoading}
              min={1}
              max={480}
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
              {isLoading ? "Creando..." : "Crear tarea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
