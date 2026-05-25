<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PartnerLedgerService;
use Illuminate\Http\Request;

class LedgerController extends Controller
{
    public function index(Request $request, PartnerLedgerService $ledger)
    {
        $period = $request->period ?: null;
        return response()->json($ledger->fullLedger($period));
    }
}
