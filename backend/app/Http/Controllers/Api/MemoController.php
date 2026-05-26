<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Memo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemoController extends Controller
{
    /**
     * Get the current user's memo.
     */
    public function show(Request $request): JsonResponse
    {
        $memo = Memo::firstOrCreate(
            ['user_id' => $request->user()->id],
            ['content' => ''],
        );

        return response()->json([
            'data' => [
                'id'         => $memo->id,
                'content'    => $memo->content ?? '',
                'updated_at' => $memo->updated_at?->toDateTimeString(),
            ],
        ]);
    }

    /**
     * Save the current user's memo.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content' => ['nullable', 'string', 'max:65000'],
        ]);

        $memo = Memo::updateOrCreate(
            ['user_id' => $request->user()->id],
            ['content' => $validated['content'] ?? ''],
        );

        return response()->json([
            'data' => [
                'id'         => $memo->id,
                'content'    => $memo->content,
                'updated_at' => $memo->updated_at?->toDateTimeString(),
            ],
        ]);
    }
}
