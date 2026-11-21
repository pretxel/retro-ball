import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RpcError as RpcErrorType } from '@/lib/rpc/_shared';

const rpcMock = vi.fn();
vi.mock('@/lib/supabase/browser', () => ({
  getBrowserClient: () => ({ rpc: rpcMock }),
}));

describe('addCard', () => {
  beforeEach(() => rpcMock.mockReset());

  it('calls add_card and returns row', async () => {
    rpcMock.mockResolvedValue({ data: { id: 'c1', body: 'hi' }, error: null });
    const { addCard } = await import('@/lib/rpc/addCard');
    const card = await addCard({ participantId: 'p1', columnKey: 'mad', body: 'hi' });
    expect(rpcMock).toHaveBeenCalledWith('rb_add_card', {
      p_participant_id: 'p1', p_column_key: 'mad', p_body: 'hi',
    });
    expect(card.id).toBe('c1');
  });

  it('throws RpcError with code on rejection', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'rate_limited' } });
    const { addCard, RpcError } = await import('@/lib/rpc/addCard');
    await expect(addCard({ participantId: 'p1', columnKey: 'mad', body: 'hi' }))
      .rejects.toBeInstanceOf(RpcError);
  });

  it('extracts SQLSTATE check_constraint code', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { code: '23514', message: 'check constraint violated', details: 'cards_body_check' },
    });
    const { addCard, RpcError } = await import('@/lib/rpc/addCard');
    try {
      await addCard({ participantId: 'p1', columnKey: 'mad', body: '' });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(RpcError);
      expect((e as RpcErrorType).code).toBe('check_constraint');
    }
  });
});
