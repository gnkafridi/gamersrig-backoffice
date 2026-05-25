<?php

namespace App\Observers;

use App\Models\Customer;
use App\Services\AuditService;

class CustomerObserver
{
    public function created(Customer $model): void
    {
        AuditService::log('created', "Created Customer #{$model->id}", $model, [], $model->toArray());
    }

    public function updated(Customer $model): void
    {
        AuditService::log('updated', "Updated Customer #{$model->id}", $model, $model->getOriginal(), $model->getChanges());
    }

    public function deleted(Customer $model): void
    {
        AuditService::log('deleted', "Deleted Customer #{$model->id}", $model);
    }

    public function restored(Customer $model): void
    {
        AuditService::log('restored', "Restored Customer #{$model->id}", $model);
    }
}
