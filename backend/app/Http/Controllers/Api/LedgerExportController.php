<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PartnerLedgerService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class LedgerExportController extends Controller
{
    public function __construct(private PartnerLedgerService $ledger)
    {
    }

    /** type = csv | pdf */
    public function export(Request $request, string $type)
    {
        $period = $request->filled('period') ? $request->period : null;
        $data = $this->ledger->fullLedger($period);
        $filename = 'partner-ledger' . ($period ? "-{$period}" : '-all');

        if ($type === 'pdf') {
            return Pdf::loadView('finance.ledger', $data)
                ->setPaper('a4', 'portrait')
                ->download("{$filename}.pdf");
        }

        return response()->streamDownload(function () use ($data) {
            $out = fopen('php://output', 'w');

            fputcsv($out, ['Partner Ledger Summary']);
            fputcsv($out, ['Who owes whom', $data['who_owes_whom']['text'] ?? '', $data['who_owes_whom']['amount'] ?? 0]);
            fputcsv($out, []);
            fputcsv($out, ['Partner', 'Total Paid', 'Total Owed', 'Reimbursed Paid', 'Reimbursed Received', 'Outstanding Balance']);
            foreach ($data['summary']['partners'] as $p) {
                fputcsv($out, [
                    $p['partner_name'], $p['total_paid'], $p['total_owed'],
                    $p['reimbursed_paid'], $p['reimbursed_received'], $p['balance'],
                ]);
            }

            fputcsv($out, []);
            fputcsv($out, ['Transactions']);
            fputcsv($out, ['Date', 'Who', 'Type', 'Module', 'Amount', 'Settles Month', 'Balance After (ref partner)']);
            foreach ($data['transactions'] as $t) {
                fputcsv($out, [
                    $t['date'], $t['who'], $t['type'], $t['module'],
                    $t['amount'], $t['settles_month'] ?? '', $t['balance_after'],
                ]);
            }
            fclose($out);
        }, "{$filename}.csv", ['Content-Type' => 'text/csv']);
    }
}
