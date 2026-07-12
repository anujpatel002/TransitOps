import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createMaintenance(vehicleId: string, desc: string, cost: number) {
  return prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.create({
      data: { vehicleId, desc, cost, active: true },
    });
    await tx.vehicle.update({
      where: { id: vehicleId },
      data: { status: 'IN_SHOP' },
    });
    return log;
  });
}

export async function closeMaintenance(logId: string) {
  return prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.update({
      where: { id: logId },
      data: { active: false, closedAt: new Date() },
    });
    const vehicle = await tx.vehicle.findUnique({ where: { id: log.vehicleId } });
    if (vehicle && vehicle.status !== 'RETIRED') {
      await tx.vehicle.update({
        where: { id: log.vehicleId },
        data: { status: 'AVAILABLE' },
      });
    }
    return { ...log, vehicle: { ...vehicle, status: vehicle?.status === 'RETIRED' ? 'RETIRED' : 'AVAILABLE' } };
  });
}

export async function listMaintenance() {
  return prisma.maintenanceLog.findMany({
    include: { vehicle: { select: { regNumber: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
