import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verificarConexaoMqttAdapter } from "@/server/telemetriaService";

export const dynamic = "force-dynamic";

/**
 * MNT-12: Endpoint de observabilidade e diagnóstico de disponibilidade (PostgreSQL + MQTT).
 */
export async function GET() {
  const inicioDb = Date.now();
  let dbConectado = false;
  let latenciaDbMs = 0;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConectado = true;
    latenciaDbMs = Math.max(1, Date.now() - inicioDb);
  } catch {
    dbConectado = false;
    latenciaDbMs = Date.now() - inicioDb;
  }

  const mqttStatus = verificarConexaoMqttAdapter();
  const statusGeral =
    dbConectado && mqttStatus.conectado
      ? "ok"
      : dbConectado || mqttStatus.conectado
        ? "degraded"
        : "down";

  return NextResponse.json(
    {
      status: statusGeral,
      timestamp: new Date().toISOString(),
      servicos: {
        postgresql: {
          conectado: dbConectado,
          latenciaMs: latenciaDbMs,
        },
        mqtt: mqttStatus,
      },
    },
    { status: statusGeral === "down" ? 503 : 200 }
  );
}
