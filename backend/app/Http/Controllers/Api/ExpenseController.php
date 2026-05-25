<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Traits\HandlesProofUploads;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ExpenseController extends Controller
{
    use HandlesProofUploads;

    public function index(Request $request)
    {
        $query = Expense::with(['partner', 'invoice']);

        if ($request->period) {
            $query->where('period', $request->period);
        }

        if ($request->category) {
            $query->where('category', $request->category);
        }

        if ($request->partner_id) {
            $query->where('partner_id', $request->partner_id);
        }

        if ($request->from) {
            $query->whereDate('expense_date', '>=', $request->from);
        }

        if ($request->to) {
            $query->whereDate('expense_date', '<=', $request->to);
        }

        $perPage = $request->period ? 20 : 200;
        return response()->json($query->orderByDesc('expense_date')->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'period' => ['required', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'expense_date' => 'required|date',
            'category' => 'required|in:operational,delivery,advance_shipping,technology,communication,packaging,marketing,equipment,other',
            'description' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'partner_id' => 'nullable|exists:partners,id',
            'invoice_id' => 'nullable|exists:invoices,id',
            'is_reimbursable' => 'boolean',
            'proof' => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
        ]);

        if ($path = $this->storeProof($request)) {
            $data['proof_path'] = $path;
        }
        unset($data['proof']);

        $expense = Expense::create($data);
        return response()->json($expense->load(['partner', 'invoice']), 201);
    }

    public function show(Expense $expense)
    {
        return response()->json($expense->load(['partner', 'invoice']));
    }

    public function update(Request $request, Expense $expense)
    {
        $data = $request->validate([
            'period' => ['sometimes', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'expense_date' => 'sometimes|date',
            'category' => 'sometimes|in:operational,delivery,advance_shipping,technology,communication,packaging,marketing,equipment,other',
            'description' => 'sometimes|string',
            'amount' => 'sometimes|numeric|min:0',
            'partner_id' => 'nullable|exists:partners,id',
            'invoice_id' => 'nullable|exists:invoices,id',
            'is_reimbursable' => 'boolean',
            'proof' => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
        ]);

        if ($path = $this->storeProof($request)) {
            if ($expense->proof_path) {
                Storage::disk('public')->delete($expense->proof_path);
            }
            $data['proof_path'] = $path;
        }
        unset($data['proof']);

        $expense->update($data);
        return response()->json($expense->load(['partner', 'invoice']));
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();
        return response()->json(null, 204);
    }
}
