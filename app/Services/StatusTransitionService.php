<?php

namespace App\Services;

use App\Events\ApplicationStatusChanged;
use App\Exceptions\InvalidStatusTransitionException;
use App\Models\Application;

class StatusTransitionService
{
    
    private const TRANSITIONS = [
        'saved'     => ['preparing', 'applied', 'withdrawn', 'archived'],
        'preparing' => ['applied', 'withdrawn', 'archived'],
        'applied'   => ['screening', 'interview', 'rejected', 'withdrawn', 'archived'],
        'screening' => ['interview', 'rejected', 'withdrawn', 'archived'],
        'interview' => ['offer', 'rejected', 'withdrawn', 'archived'],
        'offer'     => ['rejected', 'withdrawn', 'archived'],
        'rejected'  => ['archived'],
        'withdrawn' => ['archived'],
        'archived'  => ['saved'], 
    ];

    public function apply(Application $application, string $newStatus, string $source = 'manual'): Application
    {
        $current = $application->status;

        if ($current === $newStatus) {
            throw new InvalidStatusTransitionException($current, $newStatus);
        }

        $allowedNextStatuses = self::TRANSITIONS[$current] ?? [];

        if (! in_array($newStatus, $allowedNextStatuses, true)) {
            throw new InvalidStatusTransitionException($current, $newStatus);
        }

        $application->update(['status' => $newStatus]);

        event(new ApplicationStatusChanged($application, $current, $newStatus, $source));

        return $application->fresh();
    }
}