<?php

namespace App\Traits;

use Illuminate\Http\Request;

trait HandlesProofUploads
{
    /**
     * Store an uploaded proof file (image/pdf) on the public disk.
     * Returns the stored path (e.g. "proofs/abc.jpg") or null if no file was sent.
     */
    protected function storeProof(Request $request, string $field = 'proof'): ?string
    {
        if ($request->hasFile($field)) {
            return $request->file($field)->store('proofs', 'public');
        }
        return null;
    }
}
