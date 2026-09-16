<?php

namespace App\Http\Requests;

use App\Models\FollowUpAction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFollowUpActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
       
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'due_at' => ['sometimes', 'nullable', 'date'],
            'reminder_at' => ['sometimes', 'nullable', 'date'],
            'status' => ['sometimes', 'required', Rule::in(FollowUpAction::STATUSES)],
        ];
    }
}