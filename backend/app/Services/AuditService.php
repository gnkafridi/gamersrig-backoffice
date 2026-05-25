<?php

namespace App\Services;

use App\Models\AuditLog;

class AuditService
{
    public static function log(string $event, string $description, $model = null, array $old = [], array $new = []): void
    {
        try {
            AuditLog::create([
                'user_id'        => auth()->id(),
                'event'          => $event,
                'auditable_type' => $model ? get_class($model) : null,
                'auditable_id'   => $model?->id,
                'description'    => $description,
                'old_values'     => $old ?: null,
                'new_values'     => $new ?: null,
                'ip_address'     => request()->ip(),
                'user_agent'     => request()->userAgent(),
            ]);
        } catch (\Throwable $e) {
            // never crash the main request
        }
    }
}
