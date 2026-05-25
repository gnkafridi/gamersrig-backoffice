<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    // Short model name -> full class mapping
    private const MODEL_MAP = [
        'Invoice'  => 'App\\Models\\Invoice',
        'Product'  => 'App\\Models\\Product',
        'Customer' => 'App\\Models\\Customer',
        'User'     => 'App\\Models\\User',
    ];

    private const EVENTS = ['created', 'updated', 'deleted', 'restored', 'login', 'logout', 'viewed'];

    public function index(Request $request)
    {
        if (!in_array($request->user()->role, ['super_admin', 'admin'])) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $query = AuditLog::with('user:id,name,email')
            ->orderBy('created_at', 'desc');

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->event) {
            $query->where('event', $request->event);
        }

        if ($request->auditable_type) {
            $fullClass = self::MODEL_MAP[$request->auditable_type] ?? $request->auditable_type;
            $query->where('auditable_type', $fullClass);
        }

        if ($request->from) {
            $query->whereDate('created_at', '>=', $request->from);
        }

        if ($request->to) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        if ($request->search) {
            $query->where('description', 'like', "%{$request->search}%");
        }

        $paginated = $query->paginate(50);

        return response()->json(array_merge(
            $paginated->toArray(),
            [
                'events' => self::EVENTS,
                'models' => array_keys(self::MODEL_MAP),
            ]
        ));
    }
}
