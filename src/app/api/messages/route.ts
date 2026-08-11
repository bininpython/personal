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

function isConversationMessage(message: MessageRow, trainerId: string, studentId: string) {
  return (
    message.sender_id === trainerId
    && message.sender_type === 'trainer'
    && message.recipient_id === studentId
    && message.recipient_type === 'student'
  ) || (
    message.sender_id === studentId
    && message.sender_type === 'student'
    && message.recipient_id === trainerId
    && message.recipient_type === 'trainer'
  );
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return json({ error: 'Não autorizado.' }, 401);
    if (!canAccessStudentFeatures(session)) return json({ error: 'Conclua o primeiro acesso para continuar.' }, 403);

    const admin = createAdminClient();
    const actorId = session.role === 'trainer' ? session.trainer_id : session.sub;
    const { data: messageRows, error: messageError } = await admin
      .from('messages')
      .select('id, sender_id, sender_type, recipient_id, recipient_type, content, read_at, created_at')
      .or(`sender_id.eq.${actorId},recipient_id.eq.${actorId}`)
      .order('created_at', { ascending: true });
    if (messageError) throw messageError;
    const allMessages = (messageRows ?? []) as MessageRow[];

    if (session.role === 'trainer') {
      const { data: students, error } = await admin
        .from('students')
        .select('id, name, status')
        .eq('trainer_id', session.trainer_id)
        .order('name');
      if (error) throw error;

      const requestedContact = new URL(request.url).searchParams.get('contactId');
      const selected = (students ?? []).find((student) => student.id === requestedContact)
        ?? (students ?? [])[0]
        ?? null;
      const contacts = (students ?? []).map((student) => {
        const conversation = allMessages.filter((message) => isConversationMessage(message, session.trainer_id, student.id));
        const last = conversation.at(-1);
        return {
          id: student.id,
          name: student.name,
          status: student.status,
          lastMessage: last?.content || 'Inicie uma conversa',
          lastMessageAt: last?.created_at || null,
          unread: conversation.filter((message) => (
            message.recipient_id === session.trainer_id
            && message.recipient_type === 'trainer'
            && !message.read_at
          )).length,
        };
      });

      return json({
        contacts,
        activeContactId: selected?.id || null,
        messages: selected
          ? allMessages.filter((message) => isConversationMessage(message, session.trainer_id, selected.id))
          : [],
      });
    }

    const { data: trainer, error } = await admin
      .from('trainers')
      .select('id, name')
      .eq('id', session.trainer_id)
      .maybeSingle();
    if (error) throw error;
    if (!trainer) return json({ error: 'Personal não encontrado.' }, 404);

    return json({
      contacts: [{ id: trainer.id, name: trainer.name, status: 'active' }],
      activeContactId: trainer.id,
      messages: allMessages.filter((message) => isConversationMessage(message, trainer.id, session.sub)),
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
