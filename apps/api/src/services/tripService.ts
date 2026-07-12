import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TripError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

export async function dispatchTrip(tripId: string) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    });

    if (!trip) throw new TripError('Trip not found', 404);
    if (trip.status !== 'DRAFT') throw new TripError(`Trip is already ${trip.status}`);

    const { vehicle, driver } = trip;

    if (vehicle.status !== 'AVAILABLE')
      throw new TripError(`Vehicle is ${vehicle.status}, not AVAILABLE`);
    if (driver.status === 'SUSPENDED')
      throw new TripError('Driver is SUSPENDED');
    if (driver.status !== 'AVAILABLE')
      throw new TripError(`Driver is ${driver.status}, not AVAILABLE`);
    if (new Date(driver.licenseExpiry) <= new Date())
      throw new TripError('Driver license is expired');
    if (trip.cargoWeight > vehicle.maxLoadKg)
      throw new TripError(
        `Capacity exceeded: vehicle capacity ${vehicle.maxLoadKg} kg, cargo weight ${trip.cargoWeight} kg, exceeded by ${trip.cargoWeight - vehicle.maxLoadKg} kg`
      );

    const [updatedTrip] = await Promise.all([
      tx.trip.update({ where: { id: tripId }, data: { status: 'DISPATCHED' } }),
      tx.vehicle.update({ where: { id: vehicle.id }, data: { status: 'ON_TRIP' } }),
      tx.driver.update({ where: { id: driver.id }, data: { status: 'ON_TRIP' } }),
    ]);

    return updatedTrip;
  });
}

export async function completeTrip(tripId: string, finalOdometer: number, fuelConsumed: number) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    });

    if (!trip) throw new TripError('Trip not found', 404);
    if (trip.status !== 'DISPATCHED') throw new TripError(`Cannot complete a trip with status ${trip.status}`);

    const [updatedTrip] = await Promise.all([
      tx.trip.update({
        where: { id: tripId },
        data: { status: 'COMPLETED', finalOdometer, fuelConsumed },
      }),
      tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: 'AVAILABLE', odometer: finalOdometer },
      }),
      tx.driver.update({
        where: { id: trip.driverId },
        data: { status: 'AVAILABLE' },
      }),
    ]);

    return updatedTrip;
  });
}

export async function cancelTrip(tripId: string) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    });

    if (!trip) throw new TripError('Trip not found', 404);
    if (trip.status !== 'DISPATCHED') throw new TripError(`Only DISPATCHED trips can be cancelled (current: ${trip.status})`);

    const [updatedTrip] = await Promise.all([
      tx.trip.update({ where: { id: tripId }, data: { status: 'CANCELLED' } }),
      tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE' } }),
      tx.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE' } }),
    ]);

    return updatedTrip;
  });
}

export async function createTrip(data: {
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDist: number;
}) {
  // Validate cargo vs capacity upfront so the error is rich
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle) throw new TripError('Vehicle not found', 404);
  if (data.cargoWeight > vehicle.maxLoadKg)
    throw new TripError(
      `Capacity exceeded: vehicle capacity ${vehicle.maxLoadKg} kg, cargo weight ${data.cargoWeight} kg, exceeded by ${data.cargoWeight - vehicle.maxLoadKg} kg`
    );

  return prisma.trip.create({ data });
}

export async function listTrips() {
  return prisma.trip.findMany({
    include: {
      vehicle: { select: { id: true, name: true, regNumber: true } },
      driver: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
