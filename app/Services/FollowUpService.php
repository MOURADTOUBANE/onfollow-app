<?php

namespace App\Services;

use App\Models\Application;
use App\Models\ApplicationEvent;
use App\Models\FollowUpAction;

class FollowUpService
{
    public function create(Application $application, array $data): FollowUpAction
    {
        $data['status'] = 'pending';

        $action = $application->followUpActions()->create($data);

        ApplicationEvent::create([
            'application_id' => $application->id,
            'type' => 'follow_up_created',
            'source' => 'manual',
            'previous_data' => null,
            'new_data' => $action->only(['type', 'title', 'due_at']),
            'occurred_at' => now(),
        ]);

        return $action;
    }

    public function update(FollowUpAction $action, array $data): FollowUpAction
    {
        
        if (($data['status'] ?? null) === 'completed' && $action->status !== 'completed') {
            $data['completed_at'] = now();
        }

        if (($data['status'] ?? null) !== 'completed' && array_key_exists('status', $data)) {
            $data['completed_at'] = null;
        }

        $action->update($data);

        return $action->fresh();
    }
}