<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FollowUpAction extends Model
{
    public const TYPES = ['follow_up', 'interview', 'reply', 'decision'];
    public const STATUSES = ['pending', 'completed', 'cancelled'];

    protected $fillable = [
        'application_id',
        'type',
        'title',
        'due_at',
        'reminder_at',
        'status',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'due_at' => 'datetime',
            'reminder_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }
}