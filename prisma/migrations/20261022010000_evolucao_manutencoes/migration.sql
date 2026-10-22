-- CreateTable
CREATE TABLE "Unidade" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "endereco" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unidade_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "anonimizado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bloqueado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unidadeId" TEXT;

-- AlterTable
ALTER TABLE "Armario" ADD COLUMN     "modalidadeManutencao" TEXT,
ADD COLUMN     "nivelBateria" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "portaAberta" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "portaAbertaDesde" TIMESTAMP(3),
ADD COLUMN     "temperatura" DOUBLE PRECISION NOT NULL DEFAULT 24.0,
ADD COLUMN     "totalCiclosAbertura" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ultimaHigienizacaoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "unidadeId" TEXT,
ADD COLUMN     "usosDesdeHigienizacao" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "UsoArmario" ADD COLUMN     "abandonado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "arquivado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "justificativaLiberacao" TEXT,
ADD COLUMN     "pinAcesso" TEXT,
ADD COLUMN     "pinExpiraEm" TIMESTAMP(3),
ADD COLUMN     "pixCopiaECola" TEXT,
ADD COLUMN     "pixTxId" TEXT,
ADD COLUMN     "statusPagamento" TEXT NOT NULL DEFAULT 'ISENTO',
ADD COLUMN     "valorCobrado" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "RelatoProblemaArmario" (
    "id" TEXT NOT NULL,
    "armarioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prioridadeAlta" BOOLEAN NOT NULL DEFAULT true,
    "resolvido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelatoProblemaArmario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemManutencao" (
    "id" TEXT NOT NULL,
    "armarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "descricao" TEXT NOT NULL,
    "pecasTrocadas" TEXT,
    "custo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "testadoAntesReativar" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluidaEm" TIMESTAMP(3),

    CONSTRAINT "OrdemManutencao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArmarioTelemetria" (
    "id" TEXT NOT NULL,
    "armarioId" TEXT NOT NULL,
    "nivelBateria" INTEGER NOT NULL,
    "temperatura" DOUBLE PRECISION NOT NULL,
    "portaAberta" BOOLEAN NOT NULL DEFAULT false,
    "tempoPortaAbertaSegundos" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArmarioTelemetria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditoriaLog" (
    "id" TEXT NOT NULL,
    "operadorId" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "detalhes" TEXT,
    "ip" TEXT NOT NULL DEFAULT 'desconhecido',
    "userAgent" TEXT NOT NULL DEFAULT 'desconhecido',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspecaoFisica" (
    "id" TEXT NOT NULL,
    "bloco" TEXT NOT NULL,
    "dataProgramada" TIMESTAMP(3) NOT NULL,
    "alinhamentoOk" BOOLEAN NOT NULL DEFAULT true,
    "vedacaoOk" BOOLEAN NOT NULL DEFAULT true,
    "sensoresOk" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "concluida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspecaoFisica_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Unidade_codigo_key" ON "Unidade"("codigo");

-- CreateIndex
CREATE INDEX "User_unidadeId_idx" ON "User"("unidadeId");

-- CreateIndex
CREATE INDEX "Armario_unidadeId_idx" ON "Armario"("unidadeId");

-- CreateIndex
CREATE INDEX "UsoArmario_checkOut_abandonado_idx" ON "UsoArmario"("checkOut", "abandonado");

-- CreateIndex
CREATE INDEX "RelatoProblemaArmario_armarioId_resolvido_idx" ON "RelatoProblemaArmario"("armarioId", "resolvido");

-- CreateIndex
CREATE INDEX "RelatoProblemaArmario_userId_idx" ON "RelatoProblemaArmario"("userId");

-- CreateIndex
CREATE INDEX "OrdemManutencao_armarioId_status_idx" ON "OrdemManutencao"("armarioId", "status");

-- CreateIndex
CREATE INDEX "ArmarioTelemetria_armarioId_criadoEm_idx" ON "ArmarioTelemetria"("armarioId", "criadoEm");

-- CreateIndex
CREATE INDEX "AuditoriaLog_operadorId_idx" ON "AuditoriaLog"("operadorId");

-- CreateIndex
CREATE INDEX "AuditoriaLog_entidade_criadoEm_idx" ON "AuditoriaLog"("entidade", "criadoEm");

-- CreateIndex
CREATE INDEX "InspecaoFisica_bloco_dataProgramada_idx" ON "InspecaoFisica"("bloco", "dataProgramada");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Armario" ADD CONSTRAINT "Armario_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatoProblemaArmario" ADD CONSTRAINT "RelatoProblemaArmario_armarioId_fkey" FOREIGN KEY ("armarioId") REFERENCES "Armario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatoProblemaArmario" ADD CONSTRAINT "RelatoProblemaArmario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemManutencao" ADD CONSTRAINT "OrdemManutencao_armarioId_fkey" FOREIGN KEY ("armarioId") REFERENCES "Armario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArmarioTelemetria" ADD CONSTRAINT "ArmarioTelemetria_armarioId_fkey" FOREIGN KEY ("armarioId") REFERENCES "Armario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaLog" ADD CONSTRAINT "AuditoriaLog_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
