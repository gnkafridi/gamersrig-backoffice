<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MonthlySettlement;
use App\Models\PartnerInvestment;
use App\Models\QuarterlyShare;
use App\Services\FinanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    public function __construct(private FinanceService $finance)
    {
    }

    public function overview(Request $request)
    {
        // null = "All" — no period filter
        $period = $request->filled('period') ? $request->period : null;
        return response()->json($this->finance->overview($period));
    }

    public function settlement(Request $request)
    {
        $period = $request->period ?: now()->format('Y-m');
        return response()->json([
            'period' => $period,
            'rows' => $this->finance->monthlySettlement($period),
        ]);
    }

    public function revenue(Request $request)
    {
        $period = $request->filled('period') ? $request->period : null;
        return response()->json($this->finance->revenueBreakdown($period));
    }

    public function quarterly(Request $request)
    {
        $year = (int) ($request->year ?: now()->year);
        $quarter = (int) ($request->quarter ?: ceil(now()->month / 3));
        return response()->json($this->finance->quarterlyShare($year, $quarter));
    }

    public function quarterlyFinalize(Request $request)
    {
        $data = $request->validate([
            'year' => 'required|integer',
            'quarter' => 'required|integer|min:1|max:4',
        ]);

        return DB::transaction(function () use ($data) {
            $result = $this->finance->quarterlyShare($data['year'], $data['quarter']);

            foreach ($result['rows'] as $row) {
                QuarterlyShare::updateOrCreate(
                    ['partner_id' => $row['partner_id'], 'year' => $data['year'], 'quarter' => $data['quarter']],
                    [
                        'total_revenue' => $row['total_revenue'],
                        'partner_count' => $row['partner_count'],
                        'share_amount' => $row['share_amount'],
                        'status' => 'finalized',
                    ]
                );
            }

            return response()->json(array_merge($result, ['finalized' => true]));
        });
    }

    public function settlementFinalize(Request $request)
    {
        $data = $request->validate([
            'period' => ['required', 'string', 'regex:/^\d{4}-\d{2}$/'],
        ]);
        $period = $data['period'];
        $nextPeriod = Carbon::createFromFormat('Y-m', $period)->addMonth()->format('Y-m');

        return DB::transaction(function () use ($period, $nextPeriod) {
            $rows = $this->finance->monthlySettlement($period);

            foreach ($rows as $row) {
                MonthlySettlement::updateOrCreate(
                    ['partner_id' => $row['partner_id'], 'period' => $period],
                    [
                        'total_investment' => $row['total_investment'],
                        'spillover' => $row['spillover'],
                        'total_expenses' => $row['total_expenses'],
                        'advance_settled' => $row['advance_settled'],
                        'net_settlement' => $row['net_settlement'],
                        'status' => 'finalized',
                        'finalized_at' => now(),
                    ]
                );

                // Carry net settlement forward as an editable draft spillover_adjust
                // on next month's investment row.
                PartnerInvestment::updateOrCreate(
                    ['partner_id' => $row['partner_id'], 'period' => $nextPeriod],
                    ['spillover_adjust' => $row['net_settlement']]
                );
            }

            return response()->json([
                'period' => $period,
                'finalized' => true,
                'rows' => $rows,
            ]);
        });
    }
}
