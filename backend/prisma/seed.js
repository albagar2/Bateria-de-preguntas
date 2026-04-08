// ============================================
// Database Seed Script
// Populates initial data for development/demo
// ============================================
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Create Admin User ─────────────────────
  const adminHash = await bcrypt.hash('Admin@2024!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bateriapreguntas.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@bateriapreguntas.com',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // ─── Create Demo User ─────────────────────
  const userHash = await bcrypt.hash('User@2024!', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@bateriapreguntas.com' },
    update: {},
    create: {
      name: 'Estudiante Demo',
      email: 'demo@bateriapreguntas.com',
      passwordHash: userHash,
      role: 'USER',
      examDate: new Date('2026-09-15'),
    },
  });
  console.log(`✅ Demo user created: ${user.email}`);

  // Initialize streak for demo user
  await prisma.streak.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      currentStreak: 5,
      maxStreak: 12,
      currentNoFail: 8,
      maxNoFail: 23,
      lastStudyDate: new Date(),
    },
  });

  // Initialize streak for admin
  await prisma.streak.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  // ─── Create Topics ─────────────────────────
  const topicsData = [
    { title: 'Constitución Española', description: 'Título preliminar y derechos fundamentales', order: 1, icon: '📜', color: '#FF6B6B' },
    { title: 'Organización del Estado', description: 'Corona, Cortes Generales, Gobierno y Administración', order: 2, icon: '🏛️', color: '#4ECDC4' },
    { title: 'Derecho Administrativo', description: 'Procedimiento administrativo, actos y recursos', order: 3, icon: '⚖️', color: '#45B7D1' },
    { title: 'Función Pública', description: 'Empleados públicos, derechos y deberes', order: 4, icon: '👔', color: '#96CEB4' },
    { title: 'Unión Europea', description: 'Instituciones, tratados y derecho comunitario', order: 5, icon: '🇪🇺', color: '#FFEAA7' },
    { title: 'Hacienda Pública', description: 'Presupuestos Generales del Estado y fiscalidad', order: 6, icon: '💰', color: '#DDA0DD' },
    { title: 'Contratos del Sector Público', description: 'Ley de Contratos, tipos y procedimientos', order: 7, icon: '📋', color: '#98D8C8' },
    { title: 'Igualdad y Violencia de Género', description: 'Ley de Igualdad y medidas de protección', order: 8, icon: '🤝', color: '#F7DC6F' },
    { title: 'Protección de Datos', description: 'RGPD, LOPDGDD y derechos digitales', order: 9, icon: '🔒', color: '#85C1E9' },
    { title: 'Transparencia y Buen Gobierno', description: 'Ley de Transparencia y acceso a información pública', order: 10, icon: '🔍', color: '#F1948A' },
  ];

  const topics = [];
  for (const data of topicsData) {
    const topic = await prisma.topic.upsert({
      where: { id: data.title.toLowerCase().replace(/\s+/g, '-').substring(0, 36).padEnd(36, '0') },
      update: data,
      create: data,
    });
    topics.push(topic);
  }
  console.log(`✅ ${topics.length} topics created`);

  // ─── Create Questions ──────────────────────
  const questionsData = [
    // TEMA 1: Constitución Española
    {
      topicIndex: 0,
      questions: [
        {
          questionText: '¿En qué año fue aprobada la Constitución Española?',
          options: ['1975', '1978', '1980', '1982'],
          correctIndex: 1,
          explanation: 'La Constitución Española fue ratificada en referéndum el 6 de diciembre de 1978 y publicada en el BOE el 29 de diciembre de 1978.',
          difficulty: 'EASY',
        },
        {
          questionText: '¿Cuántos títulos tiene la Constitución Española?',
          options: ['8 títulos', '10 títulos', '11 títulos', '12 títulos'],
          correctIndex: 2,
          explanation: 'La CE tiene un Título Preliminar y 10 Títulos más, sumando un total de 11 títulos.',
          difficulty: 'EASY',
        },
        {
          questionText: '¿Según el artículo 1.1 de la CE, cuáles son los valores superiores del ordenamiento jurídico?',
          options: [
            'Libertad, igualdad, justicia y solidaridad',
            'Libertad, justicia, igualdad y pluralismo político',
            'Democracia, libertad, justicia e igualdad',
            'Libertad, igualdad, fraternidad y justicia',
          ],
          correctIndex: 1,
          explanation: 'Art. 1.1 CE: "España se constituye en un Estado social y democrático de Derecho, que propugna como valores superiores de su ordenamiento jurídico la libertad, la justicia, la igualdad y el pluralismo político".',
          difficulty: 'MEDIUM',
        },
        {
          questionText: '¿Cuántos artículos tiene la Constitución Española?',
          options: ['155 artículos', '160 artículos', '169 artículos', '175 artículos'],
          correctIndex: 2,
          explanation: 'La Constitución Española consta de 169 artículos distribuidos en el Título Preliminar y los Títulos I al X.',
          difficulty: 'EASY',
        },
        {
          questionText: '¿Cuál es el artículo que regula el derecho a la educación?',
          options: ['Artículo 25', 'Artículo 27', 'Artículo 28', 'Artículo 30'],
          correctIndex: 1,
          explanation: 'El artículo 27 de la CE reconoce el derecho a la educación y la libertad de enseñanza.',
          difficulty: 'MEDIUM',
        },
        {
          questionText: 'Según la CE, ¿quién es el Jefe del Estado?',
          options: ['El Presidente del Gobierno', 'El Rey', 'El Presidente del Congreso', 'El Presidente del Tribunal Constitucional'],
          correctIndex: 1,
          explanation: 'Art. 56.1 CE: "El Rey es el Jefe del Estado, símbolo de su unidad y permanencia".',
          difficulty: 'EASY',
        },
        {
          questionText: '¿Qué mayoría se necesita para una reforma agravada de la CE (art. 168)?',
          options: [
            'Mayoría absoluta de ambas Cámaras',
            'Dos tercios de cada Cámara, disolución, dos tercios de las nuevas Cámaras y referéndum',
            'Tres quintos de ambas Cámaras',
            'Mayoría absoluta del Congreso y mayoría simple del Senado',
          ],
          correctIndex: 1,
          explanation: 'El artículo 168 CE establece el procedimiento agravado de reforma: aprobación por 2/3 de cada Cámara, disolución de Cortes, ratificación por las nuevas Cámaras por 2/3 y referéndum.',
          difficulty: 'HARD',
        },
        {
          questionText: '¿Cuál de estos derechos NO es un derecho fundamental según la Sección 1ª del Capítulo II del Título I?',
          options: [
            'Derecho a la vida (art. 15)',
            'Derecho a la propiedad privada (art. 33)',
            'Derecho a la libertad ideológica (art. 16)',
            'Derecho a la tutela judicial efectiva (art. 24)',
          ],
          correctIndex: 1,
          explanation: 'El derecho a la propiedad privada (art. 33) se encuentra en la Sección 2ª del Capítulo II del Título I, no en la Sección 1ª de derechos fundamentales.',
          difficulty: 'HARD',
        },
        {
          questionText: '¿Qué artículo de la CE regula el derecho de petición?',
          options: ['Artículo 27', 'Artículo 28', 'Artículo 29', 'Artículo 30'],
          correctIndex: 2,
          explanation: 'El artículo 29 CE reconoce el derecho de petición individual y colectiva.',
          difficulty: 'MEDIUM',
        },
        {
          questionText: '¿Cuántas disposiciones adicionales tiene la Constitución Española?',
          options: ['2', '4', '6', '8'],
          correctIndex: 1,
          explanation: 'La CE tiene 4 disposiciones adicionales, 9 transitorias, 1 derogatoria y 1 final.',
          difficulty: 'MEDIUM',
        },
      ],
    },
    // TEMA 2: Organización del Estado
    {
      topicIndex: 1,
      questions: [
        {
          questionText: '¿Cuántos diputados componen el Congreso de los Diputados?',
          options: ['Entre 300 y 400', 'Exactamente 350', 'Entre 350 y 400', 'Entre 300 y 350'],
          correctIndex: 0,
          explanation: 'Art. 68.1 CE: El Congreso se compone de un mínimo de 300 y un máximo de 400 Diputados. Actualmente son 350 (fijados por la LOREG).',
          difficulty: 'MEDIUM',
        },
        {
          questionText: '¿Cuál es la duración del mandato de los Diputados y Senadores?',
          options: ['3 años', '4 años', '5 años', '6 años'],
          correctIndex: 1,
          explanation: 'Art. 68.4 y 69.6 CE: el mandato de las Cámaras es de cuatro años.',
          difficulty: 'EASY',
        },
        {
          questionText: '¿Quién propone al candidato a la Presidencia del Gobierno?',
          options: [
            'El Presidente del Congreso',
            'El Rey, previa consulta con los representantes de los grupos políticos',
            'El Presidente del Senado',
            'Los partidos políticos directamente',
          ],
          correctIndex: 1,
          explanation: 'Art. 99.1 CE: Tras cada renovación del Congreso, el Rey propondrá un candidato a la Presidencia del Gobierno, previa consulta con los representantes de los grupos políticos.',
          difficulty: 'MEDIUM',
        },
        {
          questionText: '¿Qué órgano juzga la responsabilidad criminal del Presidente del Gobierno?',
          options: [
            'El Tribunal Supremo',
            'La Sala de lo Penal del Tribunal Supremo',
            'El Tribunal Constitucional',
            'La Audiencia Nacional',
          ],
          correctIndex: 1,
          explanation: 'Art. 102.1 CE: La responsabilidad criminal del Presidente y los demás miembros del Gobierno será exigible ante la Sala de lo Penal del Tribunal Supremo.',
          difficulty: 'HARD',
        },
        {
          questionText: '¿Cuántos miembros componen el Tribunal Constitucional?',
          options: ['10 miembros', '12 miembros', '15 miembros', '20 miembros'],
          correctIndex: 1,
          explanation: 'Art. 159.1 CE: El Tribunal Constitucional se compone de 12 miembros nombrados por el Rey.',
          difficulty: 'EASY',
        },
        {
          questionText: 'El Defensor del Pueblo es designado por:',
          options: [
            'El Rey',
            'Las Cortes Generales',
            'El Gobierno',
            'El Consejo General del Poder Judicial',
          ],
          correctIndex: 1,
          explanation: 'Art. 54 CE: El Defensor del Pueblo es designado por las Cortes Generales como alto comisionado para la defensa de los derechos del Título I.',
          difficulty: 'MEDIUM',
        },
        {
          questionText: '¿Cuántos miembros componen el Consejo General del Poder Judicial?',
          options: ['12 miembros', '15 miembros', '20 miembros y el Presidente del TS', '21 miembros'],
          correctIndex: 2,
          explanation: 'Art. 122.3 CE: El CGPJ está integrado por el Presidente del Tribunal Supremo, que lo presidirá, y por veinte miembros.',
          difficulty: 'MEDIUM',
        },
        {
          questionText: '¿Qué artículo de la CE regula la moción de censura?',
          options: ['Artículo 112', 'Artículo 113', 'Artículo 114', 'Artículo 115'],
          correctIndex: 1,
          explanation: 'El artículo 113 CE regula la moción de censura, que debe ser propuesta al menos por la décima parte de los Diputados e incluir un candidato alternativo.',
          difficulty: 'MEDIUM',
        },
      ],
    },
    // TEMA 3: Derecho Administrativo
    {
      topicIndex: 2,
      questions: [
        {
          questionText: '¿Cuál es el plazo máximo general para resolver un procedimiento administrativo según la Ley 39/2015?',
          options: ['3 meses', '6 meses', '1 año', 'No hay plazo general'],
          correctIndex: 0,
          explanation: 'Art. 21.3 Ley 39/2015: Cuando las normas reguladoras del procedimiento no fijen plazo máximo, éste será de tres meses.',
          difficulty: 'MEDIUM',
        },
        {
          questionText: '¿Qué ley regula el Procedimiento Administrativo Común?',
          options: ['Ley 30/1992', 'Ley 39/2015', 'Ley 40/2015', 'Ley 9/2017'],
          correctIndex: 1,
          explanation: 'La Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas, sustituyó a la antigua Ley 30/1992.',
          difficulty: 'EASY',
        },
        {
          questionText: 'Son causas de nulidad de pleno derecho de los actos administrativos, EXCEPTO:',
          options: [
            'Los que lesionen derechos y libertades susceptibles de amparo constitucional',
            'Los dictados por órgano manifiestamente incompetente por razón de materia o territorio',
            'Los que incurran en cualquier infracción del ordenamiento jurídico',
            'Los dictados prescindiendo total y absolutamente del procedimiento',
          ],
          correctIndex: 2,
          explanation: 'La infracción del ordenamiento jurídico es causa de anulabilidad (art. 48 Ley 39/2015), no de nulidad de pleno derecho (art. 47).',
          difficulty: 'HARD',
        },
        {
          questionText: '¿Cuál es el plazo para interponer un recurso de alzada?',
          options: [
            '1 mes si el acto es expreso, 3 meses si es presunto',
            '2 meses si el acto es expreso, 6 meses si es presunto',
            '15 días',
            '1 mes en todo caso',
          ],
          correctIndex: 0,
          explanation: 'Art. 122.1 Ley 39/2015: El plazo para interponer recurso de alzada es de un mes (acto expreso) o tres meses (acto presunto por silencio).',
          difficulty: 'MEDIUM',
        },
        {
          questionText: '¿Qué ley regula el Régimen Jurídico del Sector Público?',
          options: ['Ley 6/1997', 'Ley 39/2015', 'Ley 40/2015', 'Real Decreto 364/1995'],
          correctIndex: 2,
          explanation: 'La Ley 40/2015, de 1 de octubre, de Régimen Jurídico del Sector Público.',
          difficulty: 'EASY',
        },
        {
          questionText: '¿Cuál es el plazo para interponer un recurso potestativo de reposición?',
          options: [
            '15 días',
            '1 mes si es acto expreso, 3 meses si es presunto',
            '2 meses',
            '6 meses',
          ],
          correctIndex: 1,
          explanation: 'Art. 124.2 Ley 39/2015: El plazo para interponer recurso de reposición es de un mes (acto expreso) o tres meses (silencio administrativo).',
          difficulty: 'MEDIUM',
        },
        {
          questionText: 'El silencio administrativo positivo significa que:',
          options: [
            'La Administración ha resuelto expresamente a favor',
            'Se entiende estimada la solicitud por falta de resolución en plazo',
            'La Administración rechaza la petición',
            'El expediente ha caducado',
          ],
          correctIndex: 1,
          explanation: 'El silencio administrativo positivo se produce cuando la Administración no resuelve en plazo y se entiende estimada la solicitud del interesado.',
          difficulty: 'MEDIUM',
        },
        {
          questionText: '¿Cuánto dura el plazo de prescripción de las infracciones muy graves?',
          options: ['6 meses', '1 año', '2 años', '3 años'],
          correctIndex: 3,
          explanation: 'Art. 30.1 Ley 40/2015: Las infracciones muy graves prescriben a los tres años, las graves a los dos años y las leves a los seis meses.',
          difficulty: 'HARD',
        },
      ],
    },
    // TEMA 4: Función Pública
    {
      topicIndex: 3,
      questions: [
        {
          questionText: '¿Qué norma regula el Estatuto Básico del Empleado Público?',
          options: [
            'Ley 30/1984',
            'Real Decreto Legislativo 5/2015 (TREBEP)',
            'Ley 7/2007',
            'Ley 39/2015',
          ],
          correctIndex: 1,
          explanation: 'El Real Decreto Legislativo 5/2015, de 30 de octubre, aprobó el Texto Refundido del Estatuto Básico del Empleado Público (TREBEP).',
          difficulty: 'EASY',
        },
        {
          questionText: '¿Cuáles son las clases de personal al servicio de las Administraciones Públicas según el TREBEP?',
          options: [
            'Funcionarios de carrera y personal laboral',
            'Funcionarios de carrera, funcionarios interinos, personal laboral y personal eventual',
            'Funcionarios y contratados',
            'Personal fijo, temporal y eventual',
          ],
          correctIndex: 1,
          explanation: 'Art. 8 TREBEP: Los empleados públicos se clasifican en: funcionarios de carrera, funcionarios interinos, personal laboral y personal eventual.',
          difficulty: 'MEDIUM',
        },
        {
          questionText: 'Las situaciones administrativas de los funcionarios de carrera incluyen:',
          options: [
            'Servicio activo y jubilación únicamente',
            'Servicio activo, servicios especiales, servicio en otras AAPP, excedencia y suspensión de funciones',
            'Activo, pasivo e interino',
            'Servicio activo, reserva y baja',
          ],
          correctIndex: 1,
          explanation: 'Art. 85 TREBEP: Las situaciones administrativas son: servicio activo, servicios especiales, servicio en otras AAPP, excedencia y suspensión de funciones.',
          difficulty: 'HARD',
        },
        {
          questionText: '¿Cuál es la duración máxima de la suspensión firme de funciones?',
          options: ['3 meses', '6 meses', '6 años', '3 años'],
          correctIndex: 2,
          explanation: 'Art. 90.3 TREBEP: La suspensión firme no podrá exceder de 6 años.',
          difficulty: 'HARD',
        },
        {
          questionText: '¿Cuáles son los grupos de clasificación profesional del personal funcionario?',
          options: [
            'A, B y C',
            'A1, A2, B, C1 y C2',
            'I, II, III, IV y V',
            'Superior, medio e inferior',
          ],
          correctIndex: 1,
          explanation: 'Art. 76 TREBEP: Los cuerpos y escalas se clasifican en los grupos A (subgrupos A1 y A2), B, y C (subgrupos C1 y C2).',
          difficulty: 'MEDIUM',
        },
        {
          questionText: 'La excedencia voluntaria por interés particular requiere haber prestado servicios efectivos durante:',
          options: [
            'Al menos 3 años',
            'Al menos 5 años',
            'Al menos 1 año',
            'No requiere tiempo mínimo',
          ],
          correctIndex: 1,
          explanation: 'Art. 89.2 TREBEP: Para solicitar excedencia voluntaria por interés particular se requiere haber prestado servicios efectivos durante un mínimo de 5 años.',
          difficulty: 'MEDIUM',
        },
      ],
    },
    // TEMA 5: Unión Europea
    {
      topicIndex: 4,
      questions: [
        {
          questionText: '¿Cuántos estados miembros tiene actualmente la Unión Europea?',
          options: ['25', '27', '28', '30'],
          correctIndex: 1,
          explanation: 'Tras el Brexit (2020), la UE cuenta con 27 Estados miembros.',
          difficulty: 'EASY',
        },
        {
          questionText: '¿Cuál es la institución de la UE que tiene la iniciativa legislativa?',
          options: [
            'El Parlamento Europeo',
            'El Consejo de la UE',
            'La Comisión Europea',
            'El Consejo Europeo',
          ],
          correctIndex: 2,
          explanation: 'La Comisión Europea es la institución que tiene el monopolio de la iniciativa legislativa en la UE.',
          difficulty: 'MEDIUM',
        },
        {
          questionText: '¿Qué tratado estableció la Comunidad Económica Europea?',
          options: [
            'Tratado de Maastricht (1992)',
            'Tratado de Roma (1957)',
            'Tratado de Lisboa (2007)',
            'Tratado de Ámsterdam (1997)',
          ],
          correctIndex: 1,
          explanation: 'El Tratado de Roma de 1957 estableció la Comunidad Económica Europea (CEE), firmado por los 6 países fundadores.',
          difficulty: 'EASY',
        },
        {
          questionText: '¿En qué año ingresó España en la Comunidad Europea?',
          options: ['1978', '1982', '1986', '1992'],
          correctIndex: 2,
          explanation: 'España ingresó en la Comunidad Europea el 1 de enero de 1986, junto con Portugal.',
          difficulty: 'EASY',
        },
        {
          questionText: 'Los Reglamentos de la UE son:',
          options: [
            'Directamente aplicables en todos los Estados miembros',
            'Necesitan transposición al derecho nacional',
            'Solo vinculan a los Estados a los que van dirigidos',
            'Son meras recomendaciones',
          ],
          correctIndex: 0,
          explanation: 'Los Reglamentos de la UE son obligatorios en todos sus elementos y directamente aplicables en cada Estado miembro (art. 288 TFUE).',
          difficulty: 'MEDIUM',
        },
        {
          questionText: '¿Cuál de estos NO es un principio del Derecho de la UE?',
          options: [
            'Primacía del Derecho de la UE',
            'Efecto directo',
            'Subsidiariedad',
            'Irretroactividad absoluta',
          ],
          correctIndex: 3,
          explanation: 'Los principios fundamentales del Derecho de la UE incluyen primacía, efecto directo, subsidiariedad y proporcionalidad. La irretroactividad absoluta no es un principio del Derecho de la UE.',
          difficulty: 'HARD',
        },
      ],
    },
    // TEMA 9: Protección de Datos
    {
      topicIndex: 8,
      questions: [
        {
          questionText: '¿Qué reglamento europeo regula la protección de datos personales?',
          options: [
            'Directiva 95/46/CE',
            'Reglamento (UE) 2016/679 (RGPD)',
            'Ley Orgánica 15/1999',
            'Reglamento (UE) 2018/302',
          ],
          correctIndex: 1,
          explanation: 'El RGPD (Reglamento General de Protección de Datos) es el Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo.',
          difficulty: 'EASY',
        },
        {
          questionText: '¿Cuál es la edad mínima para que un menor pueda consentir el tratamiento de sus datos en España?',
          options: ['13 años', '14 años', '16 años', '18 años'],
          correctIndex: 1,
          explanation: 'La LOPDGDD (LO 3/2018) establece en su artículo 7 que en España la edad mínima es de 14 años.',
          difficulty: 'MEDIUM',
        },
        {
          questionText: '¿Cuál es el plazo para notificar una brecha de seguridad a la autoridad de control?',
          options: ['24 horas', '48 horas', '72 horas', '1 semana'],
          correctIndex: 2,
          explanation: 'Art. 33 RGPD: El responsable del tratamiento deberá notificar la brecha a la autoridad de control en un plazo máximo de 72 horas.',
          difficulty: 'MEDIUM',
        },
        {
          questionText: '¿Cuáles son los derechos ARCO-POL según la normativa de protección de datos?',
          options: [
            'Acceso, Rectificación, Cancelación y Oposición',
            'Acceso, Rectificación, Cancelación, Oposición, Portabilidad, Olvido y Limitación',
            'Acceso, Revisión, Corrección y Objeción',
            'Autorización, Registro, Control y Observación',
          ],
          correctIndex: 1,
          explanation: 'Los derechos ampliados por el RGPD incluyen: Acceso, Rectificación, Supresión (Cancelación/Olvido), Oposición, Portabilidad y Limitación del tratamiento.',
          difficulty: 'MEDIUM',
        },
        {
          questionText: '¿Qué organismo es la autoridad de control en materia de protección de datos en España?',
          options: [
            'El Ministerio de Justicia',
            'La Agencia Española de Protección de Datos (AEPD)',
            'El Tribunal Constitucional',
            'La Comisión Nacional del Mercado de Valores',
          ],
          correctIndex: 1,
          explanation: 'La AEPD es la autoridad pública independiente que vela por el cumplimiento de la normativa de protección de datos en España.',
          difficulty: 'EASY',
        },
      ],
    },
  ];

  let totalQuestions = 0;
  for (const topicData of questionsData) {
    const topic = topics[topicData.topicIndex];
    for (const q of topicData.questions) {
      await prisma.question.create({
        data: {
          topicId: topic.id,
          questionText: q.questionText,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          difficulty: q.difficulty,
        },
      });
      totalQuestions++;
    }
  }
  console.log(`✅ ${totalQuestions} questions created`);

  // ─── Create Achievements ──────────────────
  const achievementsData = [
    { name: 'Primera respuesta', description: 'Has respondido tu primera pregunta', icon: '🎯', type: 'VOLUME', threshold: 1 },
    { name: 'Principiante aplicado', description: 'Has respondido 50 preguntas', icon: '📖', type: 'VOLUME', threshold: 50 },
    { name: 'Estudiante dedicado', description: 'Has respondido 200 preguntas', icon: '📚', type: 'VOLUME', threshold: 200 },
    { name: 'Máquina de estudio', description: 'Has respondido 500 preguntas', icon: '🤖', type: 'VOLUME', threshold: 500 },
    { name: 'Enciclopedia viviente', description: 'Has respondido 1000 preguntas', icon: '🧠', type: 'VOLUME', threshold: 1000 },
    { name: 'Racha de 3 días', description: 'Has estudiado 3 días seguidos', icon: '🔥', type: 'STREAK', threshold: 3 },
    { name: 'Racha de 7 días', description: 'Has estudiado una semana seguida', icon: '⚡', type: 'STREAK', threshold: 7 },
    { name: 'Racha de 30 días', description: '¡Un mes sin parar!', icon: '🏆', type: 'STREAK', threshold: 30 },
    { name: 'Sin errores x10', description: '10 preguntas seguidas sin fallar', icon: '✨', type: 'ACCURACY', threshold: 10 },
    { name: 'Sin errores x25', description: '25 preguntas seguidas sin fallar', icon: '💫', type: 'ACCURACY', threshold: 25 },
    { name: 'Sin errores x50', description: '50 preguntas seguidas perfectas', icon: '🌟', type: 'ACCURACY', threshold: 50 },
    { name: 'Sin errores x100', description: '¡100 seguidas sin fallar! Eres un crack', icon: '👑', type: 'ACCURACY', threshold: 100 },
    { name: 'Primer test', description: 'Has completado tu primer test', icon: '📝', type: 'SPEED', threshold: 1 },
    { name: 'Experto en tests', description: 'Has completado 10 tests', icon: '🎓', type: 'SPEED', threshold: 10 },
    { name: 'Maestro del examen', description: 'Has completado 50 tests', icon: '🏅', type: 'SPEED', threshold: 50 },
    { name: '10 preguntas dominadas', description: 'Has dominado 10 preguntas completamente', icon: '💪', type: 'MASTERY', threshold: 10 },
    { name: '50 preguntas dominadas', description: 'Has dominado 50 preguntas', icon: '🎖️', type: 'MASTERY', threshold: 50 },
  ];

  for (const data of achievementsData) {
    await prisma.achievement.create({ data });
  }
  console.log(`✅ ${achievementsData.length} achievements created`);

  console.log('\n🎉 Seeding complete!');
  console.log('──────────────────────────────────');
  console.log('👤 Admin: admin@bateriapreguntas.com / Admin@2024!');
  console.log('👤 Demo:  demo@bateriapreguntas.com / User@2024!');
  console.log('──────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
