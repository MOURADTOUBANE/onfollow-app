<?php

namespace App\Listeners;

use App\Events\ApplicationStatusChanged;
use App\Models\ApplicationEvent;

class RecordApplicationEvent
{
    public function handle(ApplicationStatusChanged $event): void
    {
        ApplicationEvent::create([
            'application_id' => $event->application->id,
            'type' => 'status_changed',
            'source' => $event->source,
            'previous_data' => ['status' => $event->previousStatus],
            'new_data' => ['status' => $event->newStatus],
            'occurred_at' => now(),
        ]);
    }
}