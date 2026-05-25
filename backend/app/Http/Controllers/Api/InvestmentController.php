<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PartnerInvestment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvestmentController extends Controller
{
    public function index(Request $request)
    {
        $query = PartnerInvestment::with('partner');

        if ($request->period) {
            $query->where('period', $request->period);
        }

        if ($request->partner_id) {
            $query->where('partner_id', $request->partner_id);
        }

        $perPage = $request->period ? 20 : 200;
        return response()->json($query->orderByDesc('period')->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'partner_id' => 'required|exists:partners,id',
            'period' => ['required', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'amount' => 'required|numeric|min:0',
            'spillover_adjust' => 'numeric',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($data) {
            $investment = PartnerInvestment::updateOrCreate(
                ['partner_id' => $data['partner_id'], 'period' => $data['period']],
                $data
            );
            return response()->json($investment->load('partner'), 201);
        });
    }

    public function show(PartnerInvestment $investment)
    {
        return response()->json($investment->load('partner'));
    }

    public function update(Request $request, PartnerInvestment $investment)
    {
        $data = $request->validate([
            'partner_id' => 'sometimes|exists:partners,id',
            'period' => ['sometimes', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'amount' => 'sometimes|numeric|min:0',
            'spillover_adjust' => 'numeric',
            'notes' => 'nullable|string',
        ]);

        $investment->update($data);
        return response()->json($investment->load('partner'));
    }

    public function destroy(PartnerInvestment $investment)
    {
        $investment->delete();
        return response()->json(null, 204);
    }
}
