import React from "react";

interface QrCodeMatrixProps {
  value: string;
  size?: number;
}

/**
 * Renderiza uma matriz visual determinística de QR Code em SVG puro (sem dependências externas),
 * incluindo os três padrões localizadores (finder patterns) padrão ISO/IEC 18004.
 */
export function QrCodeMatrix({ value, size = 144 }: QrCodeMatrixProps) {
  const dimensao = 21;
  const matriz: boolean[][] = Array.from({ length: dimensao }, () =>
    Array(dimensao).fill(false)
  );

  function desenharFinderPattern(linhaInicial: number, colunaInicial: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const bordaExterna = r === 0 || r === 6 || c === 0 || c === 6;
        const mioloInterno = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        if (bordaExterna || mioloInterno) {
          matriz[linhaInicial + r][colunaInicial + c] = true;
        }
      }
    }
  }

  desenharFinderPattern(0, 0);
  desenharFinderPattern(0, dimensao - 7);
  desenharFinderPattern(dimensao - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < dimensao; r++) {
    for (let c = 0; c < dimensao; c++) {
      const emFinderSuperiorEsquerdo = r < 8 && c < 8;
      const emFinderSuperiorDireito = r < 8 && c >= dimensao - 8;
      const emFinderInferiorEsquerdo = r >= dimensao - 8 && c < 8;

      if (
        emFinderSuperiorEsquerdo ||
        emFinderSuperiorDireito ||
        emFinderInferiorEsquerdo
      ) {
        continue;
      }

      const semente = Math.imul(hash ^ (r * 31 + c * 17), 2654435761) >>> 0;
      matriz[r][c] = semente % 2 === 0;
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${dimensao} ${dimensao}`}
      role="img"
      aria-label={`QR Code de acesso: ${value}`}
      className="rounded-lg border bg-white p-2 shadow-sm"
    >
      {matriz.map((linha, r) =>
        linha.map((ativo, c) =>
          ativo ? (
            <rect
              key={`${r}-${c}`}
              x={c}
              y={r}
              width={1}
              height={1}
              fill="#09090b"
            />
          ) : null
        )
      )}
    </svg>
  );
}
