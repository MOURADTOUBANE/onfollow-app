<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Events\ApplicationStatusChanged;
use App\Listeners\RecordApplicationEvent;
use Illuminate\Support\Facades\Event;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(ApplicationStatusChanged::class, RecordApplicationEvent::class);
    }
}
