import { describe, expect, it } from "vitest";

import { construirQueryString } from "@/utils/construirQueryString";
import {
  calcularHorasDecorridas,
  calcularMinutosDecorridos,
  formatarDataHora,
  formatarTempoDecorrido,
  ultrapassouLimiteAbandono,
} from "@/utils/date";
import { extrairPrimeiroIp } from "@/utils/extrairPrimeiroIp";
import { mesclarClasses } from "@/utils/mesclarClasses";
import { sanitizarCallbackUrl } from "@/utils/sanitizarCallbackUrl";

describe("Utilitários puros", () => {
  it("calcula duração, formata tempo decorrido e detecta abandono (>3h)", () => {
    const inicio = new Date("2026-10-22T10:00:00.000Z");
    const referencia2h = new Date("2026-10-22T12:15:00.000Z");
    const referencia4h = new Date("2026-10-22T14:00:00.000Z");

    expect(calcularMinutosDecorridos(inicio, referencia2h)).toBe(135);
    expect(calcularHorasDecorridas(inicio, referencia2h)).toBe(2.25);
    expect(formatarTempoDecorrido(inicio, referencia2h)).toBe("2h 15min");
    expect(
      formatarTempoDecorrido(
        inicio,
        new Date("2026-10-22T10:25:00.000Z")
      )
    ).toBe("25min");
    expect(ultrapassouLimiteAbandono(inicio, 3, referencia2h)).toBe(false);
    expect(ultrapassouLimiteAbandono(inicio, 3, referencia4h)).toBe(true);
    expect(formatarDataHora("2026-10-22T14:30:00.000Z")).toMatch(/\d{2}\/\d{2}/);
  });

  it("constrói query strings, sanitiza callbacks, extrai IP e mescla classes", () => {
    expect(
      construirQueryString({ bloco: "Bloco A", status: "LIVRE", vazio: undefined })
    ).toBe("?bloco=Bloco+A&status=LIVRE");
    expect(construirQueryString({})).toBe("");

    expect(extrairPrimeiroIp("192.168.1.10, 10.0.0.1")).toBe("192.168.1.10");
    expect(extrairPrimeiroIp(null)).toBe("desconhecido");

    expect(sanitizarCallbackUrl("/armarios")).toBe("/armarios");
    expect(sanitizarCallbackUrl("https://malicioso.com")).toBe("/");
    expect(sanitizarCallbackUrl("//malicioso.com")).toBe("/");
    expect(sanitizarCallbackUrl(null)).toBe("/");

    expect(mesclarClasses("px-2", false && "hidden", "px-4")).toBe("px-4");
  });
});
