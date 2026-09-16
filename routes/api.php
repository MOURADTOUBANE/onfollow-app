<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\FollowUpActionController;
use App\Http\Controllers\Api\EmailVerificationController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->middleware('signed')
    ->name('verification.verify');
Route::middleware(['auth:sanctum', 'throttle:6,1'])->group(function () {
        Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend']);
    });



Route::middleware(['auth:sanctum','verified'])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    /* Applications */
    Route::get('/applications', [ApplicationController::class, 'index']);
    Route::post('/applications', [ApplicationController::class, 'store']);
    Route::get('/applications/{application}', [ApplicationController::class, 'show']);
    Route::patch('/applications/{application}', [ApplicationController::class, 'update']);
    Route::post('/applications/{application}/status', [ApplicationController::class, 'updateStatus']);
    Route::delete('/applications/{application}', [ApplicationController::class, 'destroy']);
    /*Application Action*/
    Route::post('/applications/{application}/actions', [FollowUpActionController::class, 'store']);
    Route::patch('/actions/{action}', [FollowUpActionController::class, 'update']);

});