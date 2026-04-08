const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const oppositions = [
  // 1. ADMINISTRACIÓN
  { category: 'Administración', icon: '🏢', name: 'Administrativo del Estado' },
  { category: 'Administración', icon: '🏢', name: 'Auxiliar Administrativo del Estado' },
  { category: 'Administración', icon: '🏢', name: 'Gestión de la Administración Civil del Estado' },
  { category: 'Administración', icon: '🏢', name: 'Técnico de Administración Civil (TAC)' },
  { category: 'Administración', icon: '💰', name: 'Agente de Hacienda' },
  { category: 'Administración', icon: '💰', name: 'Técnico de Hacienda' },
  { category: 'Administración', icon: '💰', name: 'Inspector de Hacienda' },
  { category: 'Administración', icon: '✉️', name: 'Personal laboral de Correos' },
  { category: 'Administración', icon: '🏛️', name: 'Administrativo autonómico / local' },

  // 2. JUSTICIA
  { category: 'Justicia', icon: '⚖️', name: 'Auxilio Judicial' },
  { category: 'Justicia', icon: '⚖️', name: 'Tramitación Procesal' },
  { category: 'Justicia', icon: '⚖️', name: 'Gestión Procesal' },
  { category: 'Justicia', icon: '⚖️', name: 'Letrados de la Administración de Justicia' },

  // 3. SEGURIDAD Y DEFENSA
  { category: 'Seguridad y Defensa', icon: '🚓', name: 'Policía Nacional' },
  { category: 'Seguridad y Defensa', icon: '🛡️', name: 'Guardia Civil' },
  { category: 'Seguridad y Defensa', icon: '🚔', name: 'Policía Local' },
  { category: 'Seguridad y Defensa', icon: '🪖', name: 'Tropa y Marinería' },
  { category: 'Seguridad y Defensa', icon: '🪖', name: 'Oficiales / Suboficiales de las Fuerzas Armadas' },
  
  // 4. EDUCACIÓN
  { category: 'Educación', icon: '👩‍🏫', name: 'Maestro de Primaria' },
  { category: 'Educación', icon: '👩‍🏫', name: 'Profesor de Secundaria' },
  { category: 'Educación', icon: '👩‍🏫', name: 'Profesor de FP' },
  { category: 'Educación', icon: '🎓', name: 'Profesor Titular de Universidad / Catedrático' },

  // 5. SANIDAD
  { category: 'Sanidad', icon: '🏥', name: 'Médico (MIR / Oposición)' },
  { category: 'Sanidad', icon: '🏥', name: 'Enfermería (EIR / Oposición)' },
  { category: 'Sanidad', icon: '🏥', name: 'Auxiliar de Enfermería (TCAE)' },
  { category: 'Sanidad', icon: '🏥', name: 'Celador' },
  { category: 'Sanidad', icon: '🏥', name: 'Administrativo Sanitario' },

  // 6. EMERGENCIAS
  { category: 'Emergencias', icon: '🔥', name: 'Bombero' },
  { category: 'Emergencias', icon: '🔥', name: 'Protección Civil' },

  // 7. EMPRESAS PÚBLICAS
  { category: 'Empresas Públicas', icon: '🚆', name: 'Renfe' },
  { category: 'Empresas Públicas', icon: '✈️', name: 'AENA / ENAIRE' },

  // 8. CUERPOS SUPERIORES & OTROS
  { category: 'Cuerpos Superiores', icon: '⚖️', name: 'Jueces y Fiscales' },
  { category: 'Cuerpos Superiores', icon: '⚖️', name: 'Abogados del Estado' },
  { category: 'Cuerpos Superiores', icon: '🌍', name: 'Diplomáticos / UE' },
  { category: 'Instituciones Penitenciarias', icon: '🔐', name: 'Ayudante de Instituciones Penitenciarias' },
  { category: 'Otras', icon: '🚦', name: 'Tráfico (DGT)' },
  { category: 'Otras', icon: '☁️', name: 'Meteorología' }
];

async function main() {
  console.log('Limpiando oposiciones antiguas...');
  // Note: Only delete oppositions not tied to an existing user, or just delete all if no users are bound yet.
  await prisma.opposition.deleteMany();

  console.log('Insertando lista completa de oposiciones...');
  let count = 0;
  for (const op of oppositions) {
    await prisma.opposition.create({
      data: {
        name: op.name,
        icon: op.icon,
        description: op.category // Using description as category
      }
    });
    count++;
  }
  
  console.log(`¡Semilla exitosa! Se han añadido ${count} oposiciones agrupadas por categoría.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
