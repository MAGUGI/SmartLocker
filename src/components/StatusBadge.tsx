import {
  AlertOctagon,
  CheckCircle2,
  Sparkles,
  User,
  Wrench,
} from "lucide-react";

import type { StatusArmario } from "@/types/armario";
import { mesclarClasses } from "@/utils/mesclarClasses";

const STATUS_CONFIG: Record<
  StatusArmario,
  {
    label: string;
    icon: typeof CheckCircle2;
    className: string;
    pulse?: boolean;
  }
> = {
  LIVRE: {
    label: "Livre",
    icon: CheckCircle2,
    className: "bg-status-livre/10 text-status-livre",
    pulse: true,
  },
  OCUPADO: {
    label: "Ocupado",
    icon: User,
    className: "bg-status-ocupado/10 text-status-ocupado",
  },
  MANUTENCAO: {
    label: "Manutenção",
    icon: Wrench,
    className: "bg-status-manutencao/10 text-status-manutencao",
  },
};

export function StatusBadge({
  status,
  modalidadeManutencao,
}: {
  status: StatusArmario;
  modalidadeManutencao?: string | null;
}) {
  const base = STATUS_CONFIG[status];
  let label = base.label;
  let Icon = base.icon;

  if (status === "MANUTENCAO") {
    if (modalidadeManutencao === "MANUTENCAO_EMERGENCIAL") {
      label = "Manut. Emergencial";
      Icon = AlertOctagon;
    } else if (modalidadeManutencao === "HIGIENIZACAO") {
      label = "Higienização";
      Icon = Sparkles;
    } else if (modalidadeManutencao === "PREDITIVA_BATERIA") {
      label = "Bateria Crítica";
      Icon = AlertOctagon;
    }
  }

  return (
    <span
      className={mesclarClasses(
        "inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 text-xs font-medium",
        base.className
      )}
    >
      <span
        aria-hidden="true"
        className={mesclarClasses(
          "led-dot size-1.5",
          base.pulse && "led-dot-pulse"
        )}
      />
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
