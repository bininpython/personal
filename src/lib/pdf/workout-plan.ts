import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { formatPlanDate } from '@/lib/workouts/plan-validity';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const INK = rgb(9 / 255, 10 / 255, 8 / 255);
const VOLT = rgb(201 / 255, 1, 50 / 255);
const GRAY = rgb(98 / 255, 104 / 255, 110 / 255);
const LIGHT = rgb(244 / 255, 245 / 255, 239 / 255);
const LINE = rgb(224 / 255, 226 / 255, 220 / 255);

export interface PrintableWorkoutPlan {
  id: string;
  name: string;
  goal: string;
  daysPerWeek: number;
  startDate: string | null;
  endDate: string | null;
  workoutDayCount: number;
  exerciseCount: number;
  days: Array<{
    id: string;
    label: string;
    name: string;
    exercises: Array<{
      id: string;
      name: string;
      primaryMuscleLabel: string;
      equipment: string;
      instructions: string;
      videoUrl: string | null;
      sets: number;
      reps: string;
      restTime: number;
      method: string;
    }>;
  }>;
}

function clean(value: string) {
  return value
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, '...')
    .replace(/[^ -~ -ÿ]/g, '')
    .trim();
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number, maxLines = 20) {
  const words = clean(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.length > lines.join(' ').split(' ').length) {
    let last = `${lines[maxLines - 1]}...`;
    while (font.widthOfTextAtSize(last, size) > maxWidth && last.length > 4) last = `${last.slice(0, -4)}...`;
    lines[maxLines - 1] = last;
  }
  return lines;
}

function thumbnailUrl(videoUrl: string | null) {
  if (!videoUrl?.startsWith('/exercise-media/') || !videoUrl.endsWith('.mp4')) return null;
  const relative = videoUrl
    .replace(/^\/exercise-media\//, '')
    .replace(/\.mp4$/i, '.jpg')
    .split('/')
    .filter((part) => part && part !== '.' && part !== '..');
  return `/exercise-thumbnails/${relative.map(encodeURIComponent).join('/')}`;
}

function drawFooter(page: PDFPage, regular: PDFFont, pageNumber: number) {
  page.drawLine({ start: { x: MARGIN, y: 28 }, end: { x: PAGE_WIDTH - MARGIN, y: 28 }, thickness: 0.6, color: LINE });
  page.drawText('G KONG PERFORMANCE SYSTEM', { x: MARGIN, y: 15, size: 7, font: regular, color: GRAY });
  const label = `PAGINA ${pageNumber}`;
  page.drawText(label, { x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize(label, 7), y: 15, size: 7, font: regular, color: GRAY });
}

export async function createWorkoutPlanPdf(args: {
  plan: PrintableWorkoutPlan;
  userName: string;
  baseUrl: string;
  professionalName?: string;
  planPath?: string;
}) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdf.embedJpg(await readFile(path.join(process.cwd(), 'public', 'gkong-logo.jpg')));
  const embeddedThumbnails = new Map<string, Awaited<ReturnType<typeof pdf.embedJpg>>>();
  let pageNumber = 0;

  const newPage = () => {
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pageNumber += 1;
    drawFooter(page, regular, pageNumber);
    return page;
  };

  const cover = newPage();
  cover.drawRectangle({ x: 0, y: PAGE_HEIGHT - 206, width: PAGE_WIDTH, height: 206, color: INK });
  cover.drawRectangle({ x: 0, y: PAGE_HEIGHT - 212, width: PAGE_WIDTH, height: 6, color: VOLT });
  cover.drawRectangle({ x: MARGIN, y: PAGE_HEIGHT - 98, width: 58, height: 58, color: rgb(1, 1, 1) });
  cover.drawImage(logo, { x: MARGIN + 4, y: PAGE_HEIGHT - 94, width: 50, height: 50 });
  cover.drawText('G KONG', { x: 112, y: PAGE_HEIGHT - 65, size: 24, font: bold, color: rgb(1, 1, 1) });
  cover.drawText('PERFORMANCE SYSTEM', { x: 113, y: PAGE_HEIGHT - 84, size: 8, font: bold, color: VOLT });
  cover.drawText('FICHA DE TREINO', { x: MARGIN, y: PAGE_HEIGHT - 150, size: 9, font: bold, color: VOLT });
  const titleLines = wrap(args.plan.name, bold, 27, PAGE_WIDTH - MARGIN * 2, 2);
  titleLines.forEach((line, index) => cover.drawText(line, { x: MARGIN, y: PAGE_HEIGHT - 181 - index * 29, size: 27, font: bold, color: rgb(1, 1, 1) }));

  let y = PAGE_HEIGHT - 260;
  cover.drawText('ATLETA', { x: MARGIN, y, size: 8, font: bold, color: GRAY });
  wrap(args.userName, bold, 18, args.professionalName ? 240 : PAGE_WIDTH - MARGIN * 2, 2)
    .forEach((line, index) => cover.drawText(line, { x: MARGIN, y: y - 24 - index * 19, size: 18, font: bold, color: INK }));
  if (args.professionalName) {
    const professionalX = 316;
    cover.drawText('PERSONAL RESPONSÁVEL', { x: professionalX, y, size: 8, font: bold, color: GRAY });
    wrap(args.professionalName, bold, 13, PAGE_WIDTH - MARGIN - professionalX, 2)
      .forEach((line, index) => cover.drawText(line, { x: professionalX, y: y - 22 - index * 15, size: 13, font: bold, color: INK }));
  }
  y -= 72;

  const metrics = [
    ['OBJETIVO', args.plan.goal],
    ['FREQUENCIA', `${args.plan.daysPerWeek}x por semana`],
    ['ESTRUTURA', `${args.plan.workoutDayCount} treinos / ${args.plan.exerciseCount} exercicios`],
    ['VALIDADE', `${formatPlanDate(args.plan.startDate)} a ${formatPlanDate(args.plan.endDate)}`],
  ];
  metrics.forEach(([label, value], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN + col * 258;
    const boxY = y - row * 86;
    cover.drawRectangle({ x, y: boxY - 54, width: 242, height: 66, color: col === 0 && row === 0 ? VOLT : LIGHT, borderColor: LINE, borderWidth: 0.6 });
    cover.drawText(label, { x: x + 14, y: boxY - 8, size: 7, font: bold, color: GRAY });
    wrap(value, bold, 11, 214, 2).forEach((line, lineIndex) => cover.drawText(line, { x: x + 14, y: boxY - 28 - lineIndex * 13, size: 11, font: bold, color: INK }));
  });

  y -= 194;
  cover.drawRectangle({ x: MARGIN, y: y - 92, width: PAGE_WIDTH - MARGIN * 2, height: 104, color: INK });
  cover.drawText('COMO USAR ESTA FICHA', { x: MARGIN + 18, y: y - 12, size: 9, font: bold, color: VOLT });
  const note = 'Siga a ordem dos treinos e respeite series, repeticoes e descanso. Cada demonstracao tem uma imagem de referencia e acesso ao movimento completo na plataforma.';
  wrap(note, regular, 10, PAGE_WIDTH - MARGIN * 2 - 36, 4).forEach((line, index) => cover.drawText(line, { x: MARGIN + 18, y: y - 35 - index * 14, size: 10, font: regular, color: rgb(0.88, 0.9, 0.86) }));

  for (const [dayIndex, day] of args.plan.days.entries()) {
    let page = newPage();
    let cursor = PAGE_HEIGHT - 62;
    page.drawText(`TREINO ${clean(day.label)}`, { x: MARGIN, y: cursor, size: 9, font: bold, color: rgb(0.37, 0.52, 0) });
    cursor -= 31;
    page.drawText(clean(day.name), { x: MARGIN, y: cursor, size: 25, font: bold, color: INK });
    const counter = `${day.exercises.length} EXERCICIOS  /  DIA ${dayIndex + 1} DE ${args.plan.days.length}`;
    page.drawText(counter, { x: PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize(counter, 7), y: cursor + 5, size: 7, font: bold, color: GRAY });
    cursor -= 34;
    page.drawLine({ start: { x: MARGIN, y: cursor }, end: { x: PAGE_WIDTH - MARGIN, y: cursor }, thickness: 3, color: VOLT });
    cursor -= 20;

    for (const [exerciseIndex, exercise] of day.exercises.entries()) {
      const cardHeight = 116;
      if (cursor - cardHeight < 42) {
        page = newPage();
        cursor = PAGE_HEIGHT - 56;
        page.drawText(`TREINO ${clean(day.label)}  /  CONTINUACAO`, { x: MARGIN, y: cursor, size: 9, font: bold, color: rgb(0.37, 0.52, 0) });
        cursor -= 23;
        page.drawLine({ start: { x: MARGIN, y: cursor }, end: { x: PAGE_WIDTH - MARGIN, y: cursor }, thickness: 3, color: VOLT });
        cursor -= 18;
      }

      const cardY = cursor - cardHeight;
      page.drawRectangle({ x: MARGIN, y: cardY, width: PAGE_WIDTH - MARGIN * 2, height: cardHeight - 4, color: LIGHT, borderColor: LINE, borderWidth: 0.7 });
      page.drawRectangle({ x: MARGIN, y: cardY, width: 7, height: cardHeight - 4, color: VOLT });
      const thumbX = MARGIN + 18;
      const thumbY = cardY + 20;
      const thumbWidth = 112;
      const thumbHeight = 75;
      const assetUrl = thumbnailUrl(exercise.videoUrl);
      let thumbnail = assetUrl ? embeddedThumbnails.get(assetUrl) : undefined;
      if (assetUrl && !thumbnail) {
        try {
          const imageResponse = await fetch(new URL(assetUrl, args.baseUrl), { cache: 'force-cache' });
          if (!imageResponse.ok) throw new Error('Miniatura indisponível.');
          thumbnail = await pdf.embedJpg(await imageResponse.arrayBuffer());
          embeddedThumbnails.set(assetUrl, thumbnail);
        } catch {
          thumbnail = undefined;
        }
      }
      if (thumbnail) {
        const dimensions = thumbnail.scale(1);
        const scale = Math.min(thumbWidth / dimensions.width, thumbHeight / dimensions.height);
        const width = dimensions.width * scale;
        const height = dimensions.height * scale;
        page.drawRectangle({ x: thumbX, y: thumbY, width: thumbWidth, height: thumbHeight, color: INK });
        page.drawImage(thumbnail, { x: thumbX + (thumbWidth - width) / 2, y: thumbY + (thumbHeight - height) / 2, width, height });
      } else {
        page.drawRectangle({ x: thumbX, y: thumbY, width: thumbWidth, height: thumbHeight, color: INK });
        page.drawText('G KONG', { x: thumbX + 28, y: thumbY + 39, size: 12, font: bold, color: VOLT });
        page.drawText('DEMONSTRACAO', { x: thumbX + 23, y: thumbY + 24, size: 6, font: bold, color: rgb(1, 1, 1) });
      }

      const contentX = thumbX + thumbWidth + 16;
      const contentWidth = PAGE_WIDTH - MARGIN - contentX - 14;
      page.drawText(`${exerciseIndex + 1}`.padStart(2, '0'), { x: contentX, y: cardY + 91, size: 8, font: bold, color: rgb(0.37, 0.52, 0) });
      const nameLines = wrap(exercise.name, bold, 12, contentWidth - 22, 2);
      nameLines.forEach((line, index) => page.drawText(line, { x: contentX + 22, y: cardY + 90 - index * 14, size: 12, font: bold, color: INK }));
      const detailsY = cardY + (nameLines.length > 1 ? 54 : 64);
      const details = `${exercise.sets} series  /  ${clean(exercise.reps)} reps  /  ${exercise.restTime}s descanso`;
      page.drawText(details, { x: contentX, y: detailsY, size: 8, font: bold, color: INK });
      const tags = `${clean(exercise.primaryMuscleLabel)}  |  ${clean(exercise.equipment)}`;
      page.drawText(tags, { x: contentX, y: detailsY - 14, size: 7, font: regular, color: GRAY });
      const method = exercise.method ? `Metodo: ${exercise.method}` : exercise.instructions;
      wrap(method, regular, 7.2, contentWidth, 2).forEach((line, index) => page.drawText(line, { x: contentX, y: detailsY - 29 - index * 10, size: 7.2, font: regular, color: GRAY }));
      if (exercise.videoUrl) {
        const url = `${args.baseUrl}${args.planPath || `/my-plans/${args.plan.id}`}#exercise-${exercise.id}`;
        page.drawText(clean(url), { x: thumbX, y: cardY + 8, size: 5.5, font: regular, color: GRAY });
      }
      cursor = cardY - 10;
    }
  }

  pdf.setTitle(`Ficha ${clean(args.plan.name)} - G KONG`);
  pdf.setAuthor('G KONG Performance System');
  pdf.setSubject(`Ficha de treino de ${clean(args.userName)}`);
  pdf.setCreator('G KONG');
  pdf.setProducer('G KONG Performance System');
  return pdf.save();
}

export function workoutPlanPdfFilename(value: string) {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `g-kong-ficha-${slug || 'treino'}.pdf`;
}
