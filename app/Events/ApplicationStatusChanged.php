<?php

namespace App\Events;

use App\Models\Application;
use Illuminate\Foundation\Events\Dispatchable;

class ApplicationStatusChanged
{
    use Dispatchable;

    public function __construct(
        public readonly Application $application,
        public readonly string $previousStatus,
        public readonly string $newStatus,
        public readonly string $source = 'manual', 
    ) {}
}