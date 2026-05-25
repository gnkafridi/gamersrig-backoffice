<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\InvoiceController;

Route::get('/', function () {
    return view('welcome');
});

// Public shareable invoice PDF (inline, no auth)
Route::get('/invoice/{token}', [InvoiceController::class, 'publicView']);
