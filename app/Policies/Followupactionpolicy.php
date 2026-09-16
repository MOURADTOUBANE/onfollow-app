<?php

namespace App\Policies;

use App\Models\FollowUpAction;
use App\Models\User;

class FollowUpActionPolicy
{
    /**
     * A FollowUpAction has no user_id column of its own ownership is
     * checked through its parent application, which is the source of truth.
     */
    public function view(User $user, FollowUpAction $action): bool
    {
        return $user->id === $action->application->user_id;
    }

    public function update(User $user, FollowUpAction $action): bool
    {
        return $user->id === $action->application->user_id;
    }
}