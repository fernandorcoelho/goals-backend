import { Weekday } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { badRequest } from '../errors/http-error.js';

/// Dia da semana correspondente a cada índice de `Date.getUTCDay()`
/// (0 = domingo ... 6 = sábado). As datas são `@db.Date`, lidas em UTC.
const WEEKDAY_BY_UTC_DAY: Weekday[] = [
  Weekday.SUNDAY,
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
];

const checkInInclude = { completedTasks: { select: { id: true } } } as const;

type CheckInRecord = {
  id: string;
  date: Date;
  completedTasks: { id: string }[];
};

/// Formato exposto na API: data em `YYYY-MM-DD` e apenas os ids das tarefas
/// concluídas (o app já conhece as tarefas via `GET /routine`).
function toCheckInResponse(checkIn: CheckInRecord) {
  return {
    id: checkIn.id,
    date: checkIn.date.toISOString().slice(0, 10),
    completedTaskIds: checkIn.completedTasks.map((task) => task.id),
  };
}

/// Garante que cada id corresponde a uma tarefa do usuário cadastrada no dia da
/// semana da data. Bloqueia marcar tarefas de outro weekday ou de outro usuário.
async function assertTasksOfWeekday(
  userId: string,
  weekday: Weekday,
  taskIds: string[],
): Promise<void> {
  const owned = await prisma.task.count({
    where: { id: { in: taskIds }, routineDay: { weekday, routine: { userId } } },
  });

  if (owned !== taskIds.length) {
    throw badRequest('Tarefa não pertence ao dia da semana informado.');
  }
}

export async function listCheckIns(userId: string) {
  const checkIns = await prisma.checkIn.findMany({
    where: { userId },
    include: checkInInclude,
    orderBy: { date: 'asc' },
  });

  return checkIns.map(toCheckInResponse);
}

/// Cria ou atualiza o check-in de uma data, definindo as tarefas concluídas no
/// dia. A existência do registro marca o dia como "feito" no calendário.
export async function setCheckIn(userId: string, date: string, completedTaskIds: string[]) {
  const day = new Date(`${date}T00:00:00.000Z`);
  const weekday = WEEKDAY_BY_UTC_DAY[day.getUTCDay()];
  const uniqueIds = [...new Set(completedTaskIds)];

  await assertTasksOfWeekday(userId, weekday, uniqueIds);

  const connections = uniqueIds.map((id) => ({ id }));
  const checkIn = await prisma.checkIn.upsert({
    where: { userId_date: { userId, date: day } },
    create: { userId, date: day, completedTasks: { connect: connections } },
    update: { completedTasks: { set: connections } },
    include: checkInInclude,
  });

  return toCheckInResponse(checkIn);
}
