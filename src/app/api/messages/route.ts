import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { canAccessStudentFeatures } from '@/lib/auth/session-types';
import { createAdminClient } from '@/lib/supabase/admin';

const sendMessageSchema = z.object({
  recipientId: z.string().uuid().optional(),
  content: z.string().trim().min(1, 'Digite uma mensagem').max(2000, 'Mensagem muito longa'),
}).strict();

const readMessagesSchema = z.object({
  contactId: z.string().uuid().optional(),
}).strict();

// Esta rota é recarregada a cada 3 segundos pelas duas telas de conversa.
// Nenhuma consulta aqui pode crescer com a história do relacionamento: a
// conversa vem por página, a prévia da lista sai de uma janela recente e o
// contador de não lidas se limita sozinho, porque não lida é sempre pouco.
const CONVERSATION_PAGE_SIZE = 40;
const MAX_CONTACTS = 100;
const CONTACT_PREVIEW_WINDOW = 500;

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

interface MessageRow {
  id: string;
  sender_id: string;
  sender_type: string;
  recipient_id: string;
  recipient_type: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

type AdminClient = ReturnType<typeof createAdminClient>;

const MESSAGE_COLUMNS = 'id, sender_id, sender_type, recipient_id, recipient_type, content, read_at, created_at';

/**
 * Uma página da conversa entre duas pessoas, da mais nova para a mais antiga.
 *
 * O par é filtrado no banco: mensagem só existe entre personal e aluno, então
 * quem tem remetente e destinatário dentro do par {a, b} é exatamente a
 * conversa. Antes isso era feito em memória, sobre a tabela inteira.
 */
async function loadConversation(admin: AdminClient, a: string, b: string, before?: string) {
  let query = admin
    .from('messages')
    .select(MESSAGE_COLUMNS)
    .in('sender_id', [a, b])
    .in('recipient_id', [a, b])
    .order('created_at', { ascending: false })
    .limit(CONVERSATION_PAGE_SIZE + 1);
  if (before) query = query.lt('created_at', before);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as MessageRow[];
  const hasMore = rows.length > CONVERSATION_PAGE_SIZE;
  const page = hasMore ? rows.slice(0, CONVERSATION_PAGE_SIZE) : rows;
  return { messages: page.reverse(), hasMore };
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return json({ error: 'Não autorizado.' }, 401);
    if (!canAccessStudentFeatures(session)) return json({ error: 'Conclua o primeiro acesso para continuar.' }, 403);

    const admin = createAdminClient();
    const params = new URL(request.url).searchParams;
    const before = params.get('before') || undefined;

    if (session.role === 'trainer') {
      const trainerId = session.trainer_id;
      const [studentResult, previewResult, unreadResult] = await Promise.all([
        admin
          .from('students')
          .select('id, name, status')
          .eq('trainer_id', trainerId)
          .is('deleted_at', null)
          .order('name')
          .limit(MAX_CONTACTS),
        // Prévia da lista: só as mensagens recentes do personal. Uma conversa
        // parada há mais de CONTACT_PREVIEW_WINDOW mensagens fica sem prévia,
        // e é melhor não mostrar nada do que ler a tabela inteira por isso.
        admin
          .from('messages')
          .select('sender_id, recipient_id, content, created_at')
          .or(`sender_id.eq.${trainerId},recipient_id.eq.${trainerId}`)
          .order('created_at', { ascending: false })
          .limit(CONTACT_PREVIEW_WINDOW),
        // Não lidas não precisam de recorte: o conjunto some conforme é lido.
        admin
          .from('messages')
          .select('sender_id')
          .eq('recipient_id', trainerId)
          .eq('recipient_type', 'trainer')
          .is('read_at', null),
      ]);
      if (studentResult.error) throw studentResult.error;
      if (previewResult.error) throw previewResult.error;
      if (unreadResult.error) throw unreadResult.error;

      const students = studentResult.data ?? [];
      const previewRows = previewResult.data ?? [];
      const unreadBySender = new Map<string, number>();
      for (const row of unreadResult.data ?? []) {
        unreadBySender.set(row.sender_id, (unreadBySender.get(row.sender_id) ?? 0) + 1);
      }

      const contacts = students.map((student) => {
        const last = previewRows.find((message) => (
          message.sender_id === student.id || message.recipient_id === student.id
        ));
        return {
          id: student.id,
          name: student.name,
          status: student.status,
          lastMessage: last?.content ?? '',
          lastMessageAt: last?.created_at ?? null,
          unread: unreadBySender.get(student.id) ?? 0,
        };
      });

      const requestedContact = params.get('contactId');
      const selected = students.find((student) => student.id === requestedContact) ?? students[0] ?? null;
      const conversation = selected
        ? await loadConversation(admin, trainerId, selected.id, before)
        : { messages: [], hasMore: false };

      return json({
        contacts,
        activeContactId: selected?.id || null,
        messages: conversation.messages,
        hasMoreBefore: conversation.hasMore,
      });
    }

    const { data: trainer, error } = await admin
      .from('trainers')
      .select('id, name')
      .eq('id', session.trainer_id)
      .maybeSingle();
    if (error) throw error;
    if (!trainer) return json({ error: 'Personal não encontrado.' }, 404);

    const conversation = await loadConversation(admin, trainer.id, session.sub, before);
    return json({
      contacts: [{ id: trainer.id, name: trainer.name, status: 'active' }],
      activeContactId: trainer.id,
      messages: conversation.messages,
      hasMoreBefore: conversation.hasMore,
    });
  } catch (error) {
    console.error('[Messages] Get error:', error);
    return json({ error: 'Não foi possível carregar as mensagens.' }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return json({ error: 'Não autorizado.' }, 401);
    if (!canAccessStudentFeatures(session)) return json({ error: 'Conclua o primeiro acesso para continuar.' }, 403);
    const parsed = sendMessageSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: parsed.error.issues[0]?.message || 'Mensagem inválida.' }, 400);

    const admin = createAdminClient();
    let senderId: string;
    let senderType: 'trainer' | 'student';
    let recipientId: string;
    let recipientType: 'trainer' | 'student';

    if (session.role === 'trainer') {
      if (!parsed.data.recipientId) return json({ error: 'Selecione um aluno.' }, 400);
      const { data: student, error } = await admin
        .from('students')
        .select('id')
        .eq('id', parsed.data.recipientId)
        .eq('trainer_id', session.trainer_id)
        .maybeSingle();
      if (error) throw error;
      if (!student) return json({ error: 'Aluno não encontrado.' }, 404);
      senderId = session.trainer_id;
      senderType = 'trainer';
      recipientId = student.id;
      recipientType = 'student';
    } else {
      senderId = session.sub;
      senderType = 'student';
      recipientId = session.trainer_id;
      recipientType = 'trainer';
    }

    const { data, error } = await admin
      .from('messages')
      .insert({
        sender_id: senderId,
        sender_type: senderType,
        recipient_id: recipientId,
        recipient_type: recipientType,
        content: parsed.data.content,
        is_automated: false,
      })
      .select('id, sender_id, sender_type, recipient_id, recipient_type, content, read_at, created_at')
      .single();
    if (error) throw error;
    return json({ success: true, message: data }, 201);
  } catch (error) {
    console.error('[Messages] Post error:', error);
    return json({ error: 'Não foi possível enviar a mensagem.' }, 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) return json({ error: 'Não autorizado.' }, 401);
    if (!canAccessStudentFeatures(session)) return json({ error: 'Conclua o primeiro acesso para continuar.' }, 403);
    const parsed = readMessagesSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: 'Conversa inválida.' }, 400);

    const actorId = session.role === 'trainer' ? session.trainer_id : session.sub;
    const contactId = session.role === 'trainer' ? parsed.data.contactId : session.trainer_id;
    if (!contactId) return json({ error: 'Conversa inválida.' }, 400);
    const admin = createAdminClient();
    const { error } = await admin
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', actorId)
      .eq('recipient_type', session.role)
      .eq('sender_id', contactId)
      .is('read_at', null);
    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    console.error('[Messages] Read error:', error);
    return json({ error: 'Não foi possível atualizar a conversa.' }, 500);
  }
}
