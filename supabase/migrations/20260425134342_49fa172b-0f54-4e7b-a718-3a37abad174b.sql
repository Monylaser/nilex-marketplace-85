-- Status enum
CREATE TYPE public.escrow_status AS ENUM ('pending','paid','shipped','completed','cancelled','disputed','refunded');

-- Transactions
CREATE TABLE public.escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  ad_id UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  commission NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  status public.escrow_status NOT NULL DEFAULT 'pending',
  payment_intent_id TEXT,
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_escrow_buyer ON public.escrow_transactions(buyer_id);
CREATE INDEX idx_escrow_seller ON public.escrow_transactions(seller_id);
CREATE INDEX idx_escrow_ad ON public.escrow_transactions(ad_id);
CREATE INDEX idx_escrow_status ON public.escrow_transactions(status);

ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY escrow_tx_admin_all ON public.escrow_transactions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE POLICY escrow_tx_read_party ON public.escrow_transactions
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY escrow_tx_insert_buyer ON public.escrow_transactions
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY escrow_tx_update_party ON public.escrow_transactions
  FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE TRIGGER trg_escrow_tx_updated
  BEFORE UPDATE ON public.escrow_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Messages
CREATE TABLE public.escrow_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.escrow_transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_escrow_msg_tx ON public.escrow_messages(transaction_id);

ALTER TABLE public.escrow_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY escrow_msg_admin_all ON public.escrow_messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE POLICY escrow_msg_read_party ON public.escrow_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.escrow_transactions t
    WHERE t.id = transaction_id AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
  ));

CREATE POLICY escrow_msg_insert_party ON public.escrow_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.escrow_transactions t
      WHERE t.id = transaction_id AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
    )
  );

-- Disputes
CREATE TABLE public.escrow_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.escrow_transactions(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL,
  reason TEXT NOT NULL,
  evidence_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  resolved_by UUID,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_escrow_dispute_tx ON public.escrow_disputes(transaction_id);

ALTER TABLE public.escrow_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY escrow_dispute_admin_all ON public.escrow_disputes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE POLICY escrow_dispute_read_party ON public.escrow_disputes
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.escrow_transactions t
    WHERE t.id = transaction_id AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
  ));

CREATE POLICY escrow_dispute_insert_party ON public.escrow_disputes
  FOR INSERT TO authenticated
  WITH CHECK (
    opened_by = auth.uid() AND EXISTS (
      SELECT 1 FROM public.escrow_transactions t
      WHERE t.id = transaction_id AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
    )
  );

CREATE TRIGGER trg_escrow_dispute_updated
  BEFORE UPDATE ON public.escrow_disputes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();