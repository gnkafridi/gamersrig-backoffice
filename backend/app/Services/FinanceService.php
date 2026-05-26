<?php

namespace App\Services;

use App\Models\CodRecord;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\MonthlyInvestment;
use App\Models\Partner;
use App\Models\PartnerInvestment;
use Illuminate\Support\Collection;

class FinanceService
{
    /**
     * Live per-partner monthly settlement for a period ('YYYY-MM').
     *
     * Net Settlement = Total Investment + Spillover - Total Expenses + Advance Shipping Settled
     *
     * Unallocated expenses (partner_id = null, excluding advance_shipping reimbursements)
     * are split equally across active partners.
     */
    public function monthlySettlement(string $period): Collection
    {
        $partners = Partner::where('is_active', true)->orderBy('name')->get();
        $partnerCount = max($partners->count(), 1);

        // Expenses for the period
        $expenses = Expense::where('period', $period)->get();

        // Unallocated, non-reimbursable expenses split equally across partners
        $unallocated = $expenses
            ->whereNull('partner_id')
            ->where('category', '!=', 'advance_shipping')
            ->sum('amount');
        $unallocatedShare = $unallocated / $partnerCount;

        return $partners->map(function (Partner $partner) use ($period, $expenses, $unallocatedShare) {
            $totalInvestment = (float) PartnerInvestment::where('partner_id', $partner->id)
                ->where('period', $period)->sum('amount');

            $spillover = (float) PartnerInvestment::where('partner_id', $partner->id)
                ->where('period', $period)->sum('spillover_adjust');

            $partnerExpenses = $expenses
                ->where('partner_id', $partner->id)
                ->where('category', '!=', 'advance_shipping')
                ->sum('amount');

            $totalExpenses = (float) $partnerExpenses + $unallocatedShare;

            $advanceSettled = (float) $expenses
                ->where('partner_id', $partner->id)
                ->where('category', 'advance_shipping')
                ->where('is_reimbursable', true)
                ->sum('amount');

            $netSettlement = $totalInvestment + $spillover - $totalExpenses + $advanceSettled;

            return [
                'partner_id' => $partner->id,
                'partner_name' => $partner->name,
                'period' => $period,
                'total_investment' => round($totalInvestment, 2),
                'spillover' => round($spillover, 2),
                'total_expenses' => round($totalExpenses, 2),
                'advance_settled' => round($advanceSettled, 2),
                'net_settlement' => round($netSettlement, 2),
            ];
        })->values();
    }

    /**
     * Header totals for the finance dashboard.
     * Pass null $period for an all-time aggregate (no period filter).
     */
    public function overview(?string $period = null): array
    {
        $expQ  = Expense::query();
        $expQ2 = Expense::query();

        if ($period) {
            $expQ->where('period', $period);
            $expQ2->where('period', $period);
        }

        // Total Investment = sum of agreed monthly budgets (shared, per month).
        $totalInvestment     = (float) MonthlyInvestment::when($period, fn ($q) => $q->where('period', $period))->sum('amount');
        $totalExpenses       = (float) $expQ->where('category', '!=', 'advance_shipping')->sum('amount');
        $advanceReimbursable = (float) $expQ2->where('category', 'advance_shipping')->where('is_reimbursable', true)->sum('amount');

        $rev = $this->revenueBreakdown($period);

        return [
            'period' => $period,
            'total_investment' => round($totalInvestment, 2),
            'total_expenses' => round($totalExpenses, 2),
            'advance_reimbursable' => round($advanceReimbursable, 2),
            'net_position' => round($totalInvestment - $totalExpenses + $advanceReimbursable, 2),
            'total_revenue' => $rev['total_revenue'],
            'cod_pending' => $rev['cod_pending'],
            'partner_count' => Partner::where('is_active', true)->count(),
        ];
    }

    /**
     * Revenue breakdown for a period ('YYYY-MM').
     *
     * - advance_collected : paid, non-COD invoices in the period (total).
     * - cod_pending       : net revenue of COD records still awaiting courier disbursement.
     * - cod_received      : net revenue of COD records the courier has disbursed.
     * - total_revenue     : advance_collected + cod_received.
     *
     * Period is matched against invoices.order_date (YYYY-MM).
     */
    public function revenueBreakdown(?string $period = null): array
    {
        $advanceQ = Order::where('status', 'delivered')
            ->where(function ($q) {
                $q->where('payment_method', '!=', 'COD')->orWhereNull('payment_method');
            });

        if ($period) {
            [$year, $month] = array_map('intval', explode('-', $period));
            $advanceQ->whereYear('order_date', $year)->whereMonth('order_date', $month);
        }

        $advanceCollected = (float) $advanceQ->sum('total');

        $codQuery = fn ($status) => CodRecord::where('status', $status)
            ->when($period, function ($q) use ($period) {
                [$year, $month] = array_map('intval', explode('-', $period));
                $q->whereHas('invoice', fn ($iq) =>
                    $iq->whereYear('order_date', $year)->whereMonth('order_date', $month)
                );
            })
            ->sum('net_revenue');

        $codPending  = (float) $codQuery('pending');
        $codReceived = (float) $codQuery('received');

        return [
            'period' => $period,
            'advance_collected' => round($advanceCollected, 2),
            'cod_pending' => round($codPending, 2),
            'cod_received' => round($codReceived, 2),
            'total_revenue' => round($advanceCollected + $codReceived, 2),
        ];
    }

    /**
     * Per-partner quarterly revenue share (equal split).
     *
     * Quarterly Revenue = sum of total_revenue across the quarter's 3 months.
     * Share per Partner = Quarterly Revenue / active partner count.
     */
    public function quarterlyShare(int $year, int $quarter): array
    {
        $startMonth = ($quarter - 1) * 3 + 1;
        $totalRevenue = 0;
        for ($m = $startMonth; $m < $startMonth + 3; $m++) {
            $period = sprintf('%04d-%02d', $year, $m);
            $totalRevenue += $this->revenueBreakdown($period)['total_revenue'];
        }

        $partners = Partner::where('is_active', true)->orderBy('name')->get();
        $partnerCount = max($partners->count(), 1);
        $shareAmount = round($totalRevenue / $partnerCount, 2);

        $rows = $partners->map(fn (Partner $p) => [
            'partner_id' => $p->id,
            'partner_name' => $p->name,
            'year' => $year,
            'quarter' => $quarter,
            'total_revenue' => round($totalRevenue, 2),
            'partner_count' => $partners->count(),
            'share_amount' => $shareAmount,
        ])->values();

        return [
            'year' => $year,
            'quarter' => $quarter,
            'total_revenue' => round($totalRevenue, 2),
            'partner_count' => $partners->count(),
            'share_amount' => $shareAmount,
            'rows' => $rows,
        ];
    }
}
