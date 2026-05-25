<?php

namespace App\Observers;

use App\Models\Invoice;
use App\Services\AuditService;

class InvoiceObserver
{
    public function created(Invoice $model): void
    {
        AuditService::log('created', "Created Invoice #{$model->id}", $model, [], $model->toArray());
    }

    public function updated(Invoice $model): void
    {
        AuditService::log('updated', "Updated Invoice #{$model->id}", $model, $model->getOriginal(), $model->getChanges());
    }

    public function deleted(Invoice $model): void
    {
        AuditService::log('deleted', "Deleted Invoice #{$model->id}", $model);
    }

    public function restored(Invoice $model): void
    {
        AuditService::log('restored', "Restored Invoice #{$model->id}", $model);
    }
}
