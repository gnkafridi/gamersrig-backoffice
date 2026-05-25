<?php

namespace App\Observers;

use App\Models\Product;
use App\Services\AuditService;

class ProductObserver
{
    public function created(Product $model): void
    {
        AuditService::log('created', "Created Product #{$model->id}", $model, [], $model->toArray());
    }

    public function updated(Product $model): void
    {
        AuditService::log('updated', "Updated Product #{$model->id}", $model, $model->getOriginal(), $model->getChanges());
    }

    public function deleted(Product $model): void
    {
        AuditService::log('deleted', "Deleted Product #{$model->id}", $model);
    }

    public function restored(Product $model): void
    {
        AuditService::log('restored', "Restored Product #{$model->id}", $model);
    }
}
