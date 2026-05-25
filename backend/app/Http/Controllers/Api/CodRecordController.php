<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CodRecord;
use Illuminate\Http\Request;

class CodRecordController extends Controller
{
    public function index(Request $request)
    {
        $query = CodRecord::with('invoice.customer');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->search) {
            $query->whereHas('invoice', function ($q) use ($request) {
                $q->where('invoice_number', 'like', "%{$request->search}%");
            });
        }

        if ($request->from) {
            $query->whereHas('invoice', fn ($q) => $q->whereDate('invoice_date', '>=', $request->from));
        }

        if ($request->to) {
            $query->whereHas('invoice', fn ($q) => $q->whereDate('invoice_date', '<=', $request->to));
        }

        return response()->json($query->orderByDesc('id')->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'invoice_id' => 'required|exists:invoices,id|unique:cod_records,invoice_id',
            'shipping_deduction' => 'numeric|min:0',
            'courier_reference' => 'nullable|string',
        ]);

        $cod = CodRecord::create($data);
        return response()->json($cod->load('invoice.customer'), 201);
    }

    public function show(CodRecord $cod)
    {
        return response()->json($cod->load('invoice.customer'));
    }

    public function update(Request $request, CodRecord $cod)
    {
        $data = $request->validate([
            'shipping_deduction' => 'numeric|min:0',
            'status' => 'sometimes|in:pending,received,returned',
            'disbursed_at' => 'nullable|date',
            'courier_reference' => 'nullable|string',
        ]);

        $cod->update($data);
        return response()->json($cod->load('invoice.customer'));
    }

    public function destroy(CodRecord $cod)
    {
        $cod->delete();
        return response()->json(null, 204);
    }

    public function markReceived(Request $request, CodRecord $cod)
    {
        $data = $request->validate([
            'disbursed_at' => 'nullable|date',
            'courier_reference' => 'nullable|string',
        ]);

        $cod->update([
            'status' => 'received',
            'disbursed_at' => $data['disbursed_at'] ?? now()->toDateString(),
            'courier_reference' => $data['courier_reference'] ?? $cod->courier_reference,
        ]);

        return response()->json($cod->load('invoice.customer'));
    }
}
