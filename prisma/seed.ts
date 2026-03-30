/**
 * Seed de base de datos — Vigilancia de la Vía
 *
 * Crea (o actualiza) los 3 usuarios de prueba.
 * Es idempotente: se puede ejecutar múltiples veces sin duplicar datos.
 *
 * Ejecutar con:
 *   npx prisma db seed
 */
import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma/client.js';

// ─── Usuarios de prueba ────────────────────────────────────────────────────────

const SALT_ROUNDS = 12;

const SEED_USERS = [
  {
    email: 'test@reporte.com',
    password: '1234',
    rol: 'REPORTANTE' as const,
    label: 'REPORTANTE',
  },
  {
    email: 'test@responsable.com',
    password: '1234',
    rol: 'RESPONSABLE' as const,
    label: 'RESPONSABLE',
  },
  {
    email: 'test@supervisor.com',
    password: '1234',
    rol: 'SUPERVISOR' as const,
    label: 'SUPERVISOR',
  },
] as const;

// ─── Conexión ──────────────────────────────────────────────────────────────────

function createClient(): PrismaClient {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL no está definida.\n' +
      'Asegúrate de tener el archivo .env en la raíz del backend y que el servidor ' +
      '"prisma dev" esté corriendo (npx prisma dev).',
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// ─── Seed principal ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const prisma = createClient();

  console.log('\n🌱  Iniciando seed de Vigilancia de la Vía…\n');

  try {
    for (const userData of SEED_USERS) {
      const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

      const usuario = await prisma.usuario.upsert({
        where: { email: userData.email },
        update: {
          // En re-ejecuciones actualiza solo la contraseña y el rol
          password: hashedPassword,
          rol: userData.rol,
        },
        create: {
          email: userData.email,
          password: hashedPassword,
          rol: userData.rol,
        },
      });

      console.log(
        `  ✅  ${userData.label.padEnd(12)} →  ${usuario.email}  (id: ${usuario.id})`,
      );
      console.log(
        `        contraseña en texto plano: ${userData.password}`,
      );
    }

    console.log('\n🎉  Seed completado exitosamente.\n');
    console.log('  Credenciales de prueba:');
    console.log('  ┌────────────────────────────────────────────────────┐');

    for (const u of SEED_USERS) {
      console.log(`  │  ${u.label.padEnd(12)}  ${u.email.padEnd(26)}  │`);
      console.log(`  │               pass: ${u.password.padEnd(21)}  │`);
      console.log(`  │                                                    │`);
    }

    console.log('  └────────────────────────────────────────────────────┘\n');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error('\n❌  Error durante el seed:\n', err);
  process.exit(1);
});
