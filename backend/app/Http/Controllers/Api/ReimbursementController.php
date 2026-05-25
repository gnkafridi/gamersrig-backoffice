<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PartnerReimbursement;
use App\Traits\HandlesProofUploads;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReimbursementController extends Controller
{
    use HandlesProofUploads;

    public function index(Request $request)
    {
        $query = PartnerReimbursement::with(['fromPartner:id,name', 'toPartner:id,name']);

        if ($request->period) {
            [$y, $m] = array_map('intval', explode('-', $request->period));
            $query->whereYear('paid_at', $y)->whereMonth('paid_at', $m);
        }

        return response()->json(
            $query->orderByDesc('paid_at')->orderByDesc('id')->paginate(200)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'from_partner_id' => 'required|exists:partners,id|different:to_partner_id',
            'to_partner_id'   => 'required|exists:partners,id',
            'amount'          => 'required|numeric|min:0',
            'paid_at'         => 'required|date',
            'period'          => ['nullable', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'notes'           => 'nullable|string',
            'proof'           => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
        ]);

        if ($path = $this->storeProof($request)) {
            $data['proof_path'] = $path;
        }
        unset($data['proof']);

        $r = PartnerReimbursement::create($data);
        return response()->json($r->load(['fromPartner:id,name', 'toPartner:id,name']), 201);
    }

    public function show(PartnerReimbursement $reimbursement)
    {
        return response()->json($reimbursement->load(['fromPartner:id,name', 'toPartner:id,name']));
    }

    public function update(Request $request, PartnerReimbursement $reimbursement)
    {
        $data = $request->validate([
            'from_partner_id' => 'sometimes|exists:partners,id',
            'to_partner_id'   => 'sometimes|exists:partners,id',
            'amount'          => 'sometimes|numeric|min:0',
            'paid_at'         => 'sometimes|date',
            'period'          => ['nullable', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'notes'           => 'nullable|string',
            'proof'           => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
        ]);

        if ($path = $this->storeProof($request)) {
            if ($reimbursement->proof_path) {
                Storage::disk('public')->delete($reimbursement->proof_path);
            }
            $data['proof_path'] = $path;
        }
        unset($data['proof']);

        $reimbursement->update($data);
        return response()->json($reimbursement->load(['fromPartner:id,name', 'toPartner:id,name']));
    }

    public function destroy(PartnerReimbursement $reimbursement)
    {
        if ($reimbursement->proof_path) {
            Storage::disk('public')->delete($reimbursement->proof_path);
        }
        $reimbursement->delete();
        return response()->json(null, 204);
    }
}
