import { apiFetch } from "@/lib/apiClient";
import type {
  UsoArmarioResumo,
  UsoFiltros,
  UsosPaginados,
} from "@/types/armario";
import { construirQueryString } from "@/utils/construirQueryString";

export function getMeuUsoAtivo() {
  return apiFetch<UsoArmarioResumo | null>("/api/usos/me");
}

export function getMeuHistoricoUsos() {
  return apiFetch<UsoArmarioResumo[]>("/api/usos/me?historico=true");
}

export function checkIn(armarioId: string) {
  return apiFetch<UsoArmarioResumo>("/api/checkin", {
    method: "POST",
    body: JSON.stringify({ armarioId }),
  });
}

export function checkOut() {
  return apiFetch<UsoArmarioResumo>("/api/checkout", { method: "POST" });
}

export function listUsos(filtros: UsoFiltros = {}) {
  const query = construirQueryString({
    userId: filtros.userId,
    armarioId: filtros.armarioId,
    ativo: filtros.ativo !== undefined ? String(filtros.ativo) : undefined,
    abandonado:
      filtros.abandonado !== undefined ? String(filtros.abandonado) : undefined,
    pagina: filtros.pagina !== undefined ? String(filtros.pagina) : undefined,
    tamanhoPagina:
      filtros.tamanhoPagina !== undefined
        ? String(filtros.tamanhoPagina)
        : undefined,
  });
  return apiFetch<UsosPaginados>(`/api/usos${query}`);
}
