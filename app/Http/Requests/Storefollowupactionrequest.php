<?php

namespace App\Http\Requests;

use App\Models\FollowUpAction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFollowUpActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(FollowUpAction::TYPES)],
            'title' => ['required', 'string', 'max:255'],
            'due_at' => ['nullable', 'date'],
            'reminder_at' => ['nullable', 'date'],
        ];
    }
}