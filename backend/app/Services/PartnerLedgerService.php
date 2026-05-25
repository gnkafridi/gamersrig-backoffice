<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\MonthlyInvestment;
use App\Models\Partner;
use App\Models\PartnerReimbursement;
use App\Models\ProductPurchase;
use Illuminate\Support\Collection;

/**
 * Partner Dues / Enhanced Ledger.
 *
 * Combined model: every partner-funded spend (stock OR expense) splits 50/50;
 * whoever fronted it is owed the other's half; reimbursements settle.
 * Revenue-funded spends (NULL payer) don't split.
 *
 *   obligation(p) = (Σ partner-funded stock + Σ partner-funded expenses) / partner_count
 *   balance(p)    = stock_fronted + expenses_fronted + reimb_paid - reimb_received - obligation
 *   balance < 0 => p owes ; > 0 => p is owed.
 *
 * Stock comes from `product_purchases` (the unified stock-spent + inventory log;
 * amount = total_cost, dated by purchased_at, payer = paid_by_partner_id).
 * Spillover (stock above the agreed budget) is shown for info — already inside stock.
 */
class PartnerLedgerService
{
    protected function partners(): Collection
    {
        return Partner::where('is_active', true)->orderBy('id')->get();
    }

    protected function partnerCount(): int
    {
        return max($this->partners()->count(), 1);
    }

    // ── Summary (per-partner, combined) ──────────────────────────────

    public function summary(?string $period = null): array
    {
        $partners = $this->partners();
        $count = $this->partnerCount();

        $stockTotal = (float) $this->stockQuery($period)->whereNotNull('paid_by_partner_id')->sum('total_cost');
        $expTotal   = (float) $this->expenseQuery($period)->whereNotNull('partner_id')->sum('amount');
        $obligationEach = round(($stockTotal + $expTotal) / $count, 2);

        // Spillover (info): stock above agreed, summed per month.
        $spilloverTotal = 0; $agreedTotal = 0;
        foreach ($this->allPeriods() as $m) {
            if ($period && $m !== $period) continue;
            $agreed = (float) MonthlyInvestment::where('period', $m)->value('amount');
            $stock  = (float) $this->stockQuery($m)->whereNotNull('paid_by_partner_id')->sum('total_cost');
            $agreedTotal    += $agreed;
            $spilloverTotal += max(0, $stock - $agreed);
        }

        $rows = $partners->map(function (Partner $p) use ($period, $obligationEach) {
            $stockFronted = (float) $this->stockQuery($period)->where('paid_by_partner_id', $p->id)->sum('total_cost');
            $expFronted   = (float) $this->expenseQuery($period)->where('partner_id', $p->id)->sum('amount');
            $paid         = $stockFronted + $expFronted;
            $reimbPaid    = (float) $this->reimbQuery($period)->where('from_partner_id', $p->id)->sum('amount');
            $reimbRecv    = (float) $this->reimbQuery($period)->where('to_partner_id', $p->id)->sum('amount');
            $balance      = round($paid + $reimbPaid - $reimbRecv - $obligationEach, 2);

            return [
                'partner_id'          => $p->id,
                'partner_name'        => $p->name,
                'stock_fronted'       => round($stockFronted, 2),
                'expenses_fronted'    => round($expFronted, 2),
                'total_paid'          => round($paid, 2),
                'reimbursed_paid'     => round($reimbPaid, 2),
                'reimbursed_received' => round($reimbRecv, 2),
                'total_owed'          => $obligationEach,
                'balance'             => $balance,
            ];
        })->values()->all();

        return [
            'period'          => $period,
            'stock_total'     => round($stockTotal, 2),
            'expenses_total'  => round($expTotal, 2),
            'agreed_total'    => round($agreedTotal, 2),
            'spillover_total' => round($spilloverTotal, 2),
            'obligation_each' => $obligationEach,
            'partners'        => $rows,
        ];
    }

    /** Who owes whom (combined, cumulative). */
    public function whoOwesWhom(): array
    {
        $rows     = collect($this->summary(null)['partners']);
        $debtor   = $rows->sortBy('balance')->first();
        $creditor = $rows->sortByDesc('balance')->first();
        $amount   = ($debtor && $creditor)
            ? round(min(abs(min((float) $debtor['balance'], 0)), max((float) $creditor['balance'], 0)), 2)
            : 0;

        if ($amount < 1 || $debtor['partner_id'] === $creditor['partner_id']) {
            return ['settled' => true, 'amount' => 0, 'from' => null, 'to' => null, 'text' => 'All settled'];
        }

        return [
            'settled' => false,
            'amount'  => $amount,
            'from'    => ['id' => $debtor['partner_id'],   'name' => $debtor['partner_name']],
            'to'      => ['id' => $creditor['partner_id'], 'name' => $creditor['partner_name']],
            'text'    => "{$debtor['partner_name']} owes {$creditor['partner_name']}",
        ];
    }

    /** Per-month breakdown for the Investment tab (due = actual (stock+exp)/2). */
    public function monthlyBreakdown(?string $period = null): array
    {
        $count = $this->partnerCount();
        $months = $period ? [$period] : $this->allPeriods();
        rsort($months);

        return array_map(function ($m) use ($count) {
            $agreed = (float) MonthlyInvestment::where('period', $m)->value('amount');
            $stock  = (float) $this->stockQuery($m)->whereNotNull('paid_by_partner_id')->sum('total_cost');
            $exp    = (float) $this->expenseQuery($m)->whereNotNull('partner_id')->sum('amount');
            return [
                'period'    => $m,
                'agreed'    => round($agreed, 2),
                'stock'     => round($stock, 2),
                'expenses'  => round($exp, 2),
                'spillover' => round(max(0, $stock - $agreed), 2),
                'due_each'  => round(($stock + $exp) / $count, 2),
            ];
        }, $months);
    }

    /** Overdue: per partner, monthly shortfalls (vs (stock+exp)/2) unpaid past month-end. */
    public function overdue(): array
    {
        $partners = $this->partners();
        $count = $this->partnerCount();
        $current = now()->format('Y-m');
        $months = $this->allPeriods();

        $out = [];
        foreach ($partners as $p) {
            $dues = [];
            foreach ($months as $m) {
                $stock = (float) $this->stockQuery($m)->whereNotNull('paid_by_partner_id')->sum('total_cost');
                $exp   = (float) $this->expenseQuery($m)->whereNotNull('partner_id')->sum('amount');
                $dueEach = ($stock + $exp) / $count;
                $fronted = (float) $this->stockQuery($m)->where('paid_by_partner_id', $p->id)->sum('total_cost')
                         + (float) $this->expenseQuery($m)->where('partner_id', $p->id)->sum('amount');
                $short = $dueEach - $fronted;
                if ($short > 1) $dues[] = ['period' => $m, 'amount' => round($short, 2)];
            }

            // Apply this partner's reimbursements FIFO to oldest shortfalls.
            $pool = (float) PartnerReimbursement::where('from_partner_id', $p->id)->sum('amount');
            foreach ($dues as &$d) {
                if ($pool <= 0) break;
                $applied = min($pool, $d['amount']);
                $d['amount'] = round($d['amount'] - $applied, 2);
                $pool -= $applied;
            }
            unset($d);

            foreach ($dues as $d) {
                if ($d['amount'] > 1 && $d['period'] < $current) {
                    $out[] = [
                        'partner_id'   => $p->id,
                        'partner_name' => $p->name,
                        'period'       => $d['period'],
                        'amount'       => $d['amount'],
                        'months_old'   => $this->monthsBetween($d['period'], $current),
                    ];
                }
            }
        }
        return $out;
    }

    /**
     * Chronological ledger with a running "balance after" (net, from the first
     * partner's perspective: negative = first partner owes the second).
     */
    public function transactions(?string $period = null): array
    {
        $refId = $this->partners()->first()?->id;
        $all = $this->buildRunningBalances($refId);

        if ($period) {
            return array_values(array_filter($all, fn ($t) => ($t['period'] ?? null) === $period));
        }
        return $all;
    }

    /** Build the full chronological list with running balance_after (ref-partner perspective). */
    protected function buildRunningBalances(?int $refId): array
    {
        $events = collect();

        ProductPurchase::with(['payer:id,name', 'product:id,name'])->get()->each(fn ($s) => $events->push([
            'id' => 'P' . $s->id,
            'date' => optional($s->purchased_at)->format('Y-m-d'), 'order' => 1,
            'type' => 'stock', 'module' => 'Stock Spent',
            'who' => $s->payer?->name ?? 'Business (revenue)', 'paid_by_id' => $s->paid_by_partner_id, 'to_id' => null,
            'description' => ($s->product?->name ?? '#' . $s->product_id) . ' x' . $s->quantity,
            'period' => $s->for_period ?? optional($s->purchased_at)->format('Y-m'),
            'settles_month' => $s->for_period ?? optional($s->purchased_at)->format('Y-m'),
            'amount' => round((float) $s->total_cost, 2), 'proof_path' => $s->proof_path,
        ]));
        Expense::with('partner:id,name')->get()->each(fn ($e) => $events->push([
            'id' => 'E' . $e->id,
            'date' => optional($e->expense_date)->format('Y-m-d'), 'order' => 2,
            'type' => 'expense', 'module' => 'Expense',
            'who' => $e->partner?->name ?? 'Business (revenue)', 'paid_by_id' => $e->partner_id, 'to_id' => null,
            'description' => $e->description, 'period' => $e->period, 'settles_month' => $e->period,
            'amount' => round((float) $e->amount, 2), 'proof_path' => $e->proof_path,
        ]));
        PartnerReimbursement::with(['fromPartner:id,name', 'toPartner:id,name'])->get()->each(fn ($r) => $events->push([
            'id' => 'R' . $r->id,
            'date' => optional($r->paid_at)->format('Y-m-d'), 'order' => 3,
            'type' => 'reimbursement', 'module' => 'Reimbursement',
            'who' => ($r->fromPartner?->name ?? '?') . ' -> ' . ($r->toPartner?->name ?? '?'),
            'paid_by_id' => $r->from_partner_id, 'to_id' => $r->to_partner_id,
            'description' => $r->notes ?? 'Reimbursement', 'period' => optional($r->paid_at)->format('Y-m'), 'settles_month' => $r->period,
            'amount' => round((float) $r->amount, 2), 'proof_path' => $r->proof_path,
        ]));

        $sorted = $events->sortBy([['date', 'asc'], ['order', 'asc']])->values();

        $bal = 0.0;
        return $sorted->map(function ($t) use (&$bal, $refId) {
            $amt = (float) $t['amount'];
            if ($t['type'] === 'reimbursement') {
                if ($t['paid_by_id'] === $refId)      $bal += $amt;
                elseif ($t['to_id'] === $refId)       $bal -= $amt;
            } else {
                if ($t['paid_by_id'] === $refId)      $bal += $amt / 2;
                elseif ($t['paid_by_id'] !== null)    $bal -= $amt / 2;
            }
            $t['balance_after'] = round($bal, 2);
            return $t;
        })->values()->all();
    }

    public function fullLedger(?string $period = null): array
    {
        $refPartner = $this->partners()->first();
        return [
            'who_owes_whom' => $this->whoOwesWhom(),
            'summary'       => $this->summary($period),
            'overdue'       => $this->overdue(),
            'monthly'       => $this->monthlyBreakdown($period),
            'transactions'  => $this->transactions($period),
            'ref_partner'   => $refPartner ? ['id' => $refPartner->id, 'name' => $refPartner->name] : null,
        ];
    }

    // ── query helpers ────────────────────────────────────────────────

    /** Stock = product_purchases, filtered by the accounting month it's "for" (for_period). */
    protected function stockQuery(?string $period)
    {
        $q = ProductPurchase::query();
        if ($period) {
            $q->where('for_period', $period);
        }
        return $q;
    }

    protected function expenseQuery(?string $period)
    {
        $q = Expense::query();
        if ($period) $q->where('period', $period);
        return $q;
    }

    protected function reimbQuery(?string $period)
    {
        $q = PartnerReimbursement::query();
        if ($period) {
            [$y, $m] = array_map('intval', explode('-', $period));
            $q->whereYear('paid_at', $y)->whereMonth('paid_at', $m);
        }
        return $q;
    }

    protected function allPeriods(): array
    {
        $periods = collect();
        MonthlyInvestment::pluck('period')->each(fn ($p) => $periods->push($p));
        ProductPurchase::whereNotNull('for_period')->pluck('for_period')->each(fn ($p) => $periods->push($p));
        Expense::pluck('period')->each(fn ($p) => $periods->push($p));
        return $periods->filter()->unique()->sort()->values()->all();
    }

    protected function monthsBetween(string $from, string $to): int
    {
        return (intval(substr($to, 0, 4)) - intval(substr($from, 0, 4))) * 12
            + (intval(substr($to, 5, 2)) - intval(substr($from, 5, 2)));
    }
}
