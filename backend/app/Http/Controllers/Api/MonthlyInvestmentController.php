<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MonthlyInvestment;
use Illuminate\Http\Request;

class MonthlyInvestmentController extends Controller
{
    public function index(Request $request)
    {
        $query = MonthlyInvestment::query();
        if ($request->period) {
            $query->where('period', $request->period);
        }
        return response()->json($query->orderByDesc('period')->get());
    }

    /** Create or update the agreed budget for a month (upsert by period). */
    public function store(Request $request)
    {
        $data = $request->validate([
            'period' => ['required', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'amount' => 'required|numeric|min:0',
            'notes'  => 'nullable|string',
        ]);

        $row = MonthlyInvestment::updateOrCreate(
            ['period' => $data['period']],
            ['amount' => $data['amount'], 'notes' => $data['notes'] ?? null]
        );

        return response()->json($row, 201);
    }

    public function destroy(MonthlyInvestment $monthlyInvestment)
    {
        $monthlyInvestment->delete();
        return response()->json(null, 204);
    }
}
