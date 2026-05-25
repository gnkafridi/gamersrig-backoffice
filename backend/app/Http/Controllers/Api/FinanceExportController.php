<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FinanceService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class FinanceExportController extends Controller
{
    public function __construct(private FinanceService $finance)
    {
    }

    /**
     * PDF export. type = settlement | revenue | quarterly
     */
    public function pdf(Request $request, string $type)
    {
        [$data, $filename] = $this->buildData($request, $type);

        return Pdf::loadView("finance.{$type}", $data)
            ->setPaper('a4', 'portrait')
            ->download("{$filename}.pdf");
    }

    /**
     * CSV export. type = settlement | revenue | quarterly
     */
    public function csv(Request $request, string $type)
    {
        [$data, $filename] = $this->buildData($request, $type);
        [$header, $rows] = $this->csvRows($type, $data);

        return response()->streamDownload(function () use ($header, $rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $header);
            foreach ($rows as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, "{$filename}.csv", ['Content-Type' => 'text/csv']);
    }

    private function buildData(Request $request, string $type): array
    {
        if ($type === 'quarterly') {
            $year = (int) ($request->year ?: now()->year);
            $quarter = (int) ($request->quarter ?: ceil(now()->month / 3));
            $data = $this->finance->quarterlyShare($year, $quarter);
            return [$data, "quarterly-{$year}-Q{$quarter}"];
        }

        $period = $request->period ?: now()->format('Y-m');

        if ($type === 'revenue') {
            $data = $this->finance->revenueBreakdown($period);
            return [$data, "revenue-{$period}"];
        }

        // default: settlement
        $data = [
            'period' => $period,
            'rows' => $this->finance->monthlySettlement($period),
        ];
        return [$data, "settlement-{$period}"];
    }

    private function csvRows(string $type, array $data): array
    {
        if ($type === 'settlement') {
            $header = ['Partner', 'Period', 'Investment', 'Spillover', 'Expenses', 'Advance Settled', 'Net Settlement'];
            $rows = collect($data['rows'])->map(fn ($r) => [
                $r['partner_name'], $r['period'], $r['total_investment'],
                $r['spillover'], $r['total_expenses'], $r['advance_settled'], $r['net_settlement'],
            ])->all();
            return [$header, $rows];
        }

        if ($type === 'quarterly') {
            $header = ['Partner', 'Year', 'Quarter', 'Total Revenue', 'Partner Count', 'Share Amount'];
            $rows = collect($data['rows'])->map(fn ($r) => [
                $r['partner_name'], $r['year'], 'Q' . $r['quarter'],
                $r['total_revenue'], $r['partner_count'], $r['share_amount'],
            ])->all();
            return [$header, $rows];
        }

        // revenue
        $header = ['Period', 'Advance Collected', 'COD Pending', 'COD Received', 'Total Revenue'];
        $rows = [[
            $data['period'], $data['advance_collected'],
            $data['cod_pending'], $data['cod_received'], $data['total_revenue'],
        ]];
        return [$header, $rows];
    }
}
