<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'timezone' => $validated['timezone'] ?? 'Africa/Casablanca',
            'locale' => $validated['locale'] ?? 'fr',
        ]);

       
        $user->sendEmailVerificationNotification();

        $token = $user->createToken('default')->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
            'message' => 'Account created. Please check your email to verify your address.',
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $validated = $request->validated();
    
        if (! Auth::attempt([
            'email' => $validated['email'],
            'password' => $validated['password'],
        ])) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }
    
        $user = User::where('email', $validated['email'])->firstOrFail();
    
     
        if (! $user->hasVerifiedEmail()) {
            return response()->json([
                'error' => 'Please verify your email address before logging in.',
                'code' => 'email_not_verified',
            ], 403);
        }
    
        $deviceName = $validated['device_name'] ?? 'default';
        $token = $user->createToken($deviceName)->plainTextToken;
    
        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request)
    {
        return response()->json(new UserResource($request->user()));
    }
}