<?php

namespace App\Observers;

use App\Models\Order;
use App\Services\AuditService;

class OrderObserver
{
    public function created(Order $model): void
    {
        AuditService::log('created', "Created Order #{$model->id}", $model, [], $model->toArray());
    }

    public function updated(Order $model): void
    {
        AuditService::log('updated', "Updated Order #{$model->id}", $model, $model->getOriginal(), $model->getChanges());
    }

    public function deleted(Order $model): void
    {
        AuditService::log('deleted', "Deleted Order #{$model->id}", $model);
    }

    public function restored(Order $model): void
    {
        AuditService::log('restored', "Restored Order #{$model->id}", $model);
    }
}
