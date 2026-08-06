<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterPromotorRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Mail\PasswordResetMail;
use App\Models\Tenant;
use App\Models\User;
use App\Services\ReferralService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function __construct(private ReferralService $referrals) {}

    /**
     * Register User biasa.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
            'phone' => $request->phone,
            'referral_code' => strtoupper(Str::random(8)),
        ]);

        $referral = $this->referrals->attach($request->referral_code, $user);
        $user->update(['referred_by' => $referral?->user_id]);
        \Spatie\Permission\Models\Role::findOrCreate('user');
        $user->assignRole('user');

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registrasi berhasil.',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ], 201);
    }

    /**
     * Register Promotor (Event Organizer).
     */
    public function registerPromotor(RegisterPromotorRequest $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            // Buat Tenant
            $tenant = Tenant::create([
                'name' => $request->organization_name,
                'slug' => Str::slug($request->organization_name).'-'.Str::random(4),
                'email' => $request->email,
                'phone' => $request->phone,
                'status' => 'pending',
            ]);

            // Buat User Promotor
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => $request->password,
                'phone' => $request->phone,
                'tenant_id' => $tenant->id,
                'referral_code' => strtoupper(Str::random(8)),
            ]);

            \Spatie\Permission\Models\Role::findOrCreate('promotor');
            $user->assignRole('promotor');

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pendaftaran promotor berhasil. Menunggu verifikasi admin.',
                'data' => [
                    'user' => $user,
                    'tenant' => $tenant,
                ],
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Pendaftaran gagal: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Login semua role.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah.',
            ], 401);
        }

        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda tidak aktif. Hubungi administrator.',
            ], 403);
        }

        // Update last login
        $user->update(['last_login_at' => now()]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'user' => $user->load('tenant')->append([]),
                'roles' => $user->getRoleNames(),
                'token' => $token,
            ],
        ]);
    }

    /**
     * Logout.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }

    /**
     * Get current authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('tenant');

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'roles' => $user->getRoleNames(),
                'permissions' => $user->getAllPermissions()->pluck('name'),
            ],
        ]);
    }

    /**
     * Refresh token (rotasi). Frontend mengirim token aktif via Bearer.
     */
    public function refresh(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();

        if (! $token) {
            return response()->json([
                'success' => false,
                'message' => 'Token tidak valid.',
            ], 401);
        }

        $token->delete();

        $fresh = $request->user()->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Token berhasil diperbarui.',
            'data' => [
                'access_token' => $fresh,
                'refresh_token' => $fresh,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    /**
     * Send password reset link.
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->firstOrFail();

        $token = Password::createToken($user);
        $resetUrl = config('app.frontend_url', 'http://localhost:3000').'/reset-password?token='.$token.'&email='.urlencode($user->email);

        Mail::to($user->email)->queue(new PasswordResetMail($resetUrl, $user->name));

        return response()->json([
            'success' => true,
            'message' => 'Tautan reset password telah dikirim ke email Anda.',
        ]);
    }

    /**
     * Reset password.
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'success' => true,
                'message' => 'Password berhasil direset. Silakan login dengan password baru.',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Token tidak valid atau sudah kadaluarsa.',
        ], 422);
    }
}
