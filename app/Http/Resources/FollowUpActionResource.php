<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FollowUpActionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'applicationId' => $this->application_id,
            'type' => $this->type,
            'title' => $this->title,
            'dueAt' => $this->due_at?->toIso8601String(),
            'reminderAt' => $this->reminder_at?->toIso8601String(),
            'status' => $this->status,
            'completedAt' => $this->completed_at?->toIso8601String(),
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}