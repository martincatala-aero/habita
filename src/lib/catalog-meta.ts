/**
 * Metadata por categoría del catálogo (label e icono para onboarding).
 */
export const CATEGORY_META: Record<
  string,
  { label: string; icon: string }
> = {
  Cocina: { label: "Cocina", icon: "🍳" },
  Limpieza: { label: "Limpieza", icon: "🧹" },
  Lavandería: { label: "Lavandería", icon: "👕" },
  Habitación: { label: "Habitaciones", icon: "🛏️" },
  Exterior: { label: "Exterior", icon: "🌿" },
  Mascotas: { label: "Mascotas", icon: "🐕" },
  Compras: { label: "Compras", icon: "🛒" },
  other: { label: "Otros", icon: "📋" },
};

export function getCategoryMeta(category: string): { label: string; icon: string } {
  return (
    CATEGORY_META[category] ?? {
      label: category,
      icon: "📋",
    }
  );
}
