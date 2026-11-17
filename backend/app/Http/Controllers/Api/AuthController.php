<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NguoiDung;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Thong tin dang nhap khong hop le.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = NguoiDung::where('Email', $request->email)
            ->where('VaiTro', 'QuanTri')
            ->where('HoatDong', 1)
            ->first();

        if (!$user || !Hash::check($request->password, $user->MatKhauMaHoa)) {
            return response()->json([
                'success' => false,
                'message' => 'Email hoac mat khau khong chinh xac.',
            ], 401);
        }

        $token = $user->createToken('admin-web')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Dang nhap thanh cong.',
            'token' => $token,
            'user' => [
                'MaNguoiDung' => $user->MaNguoiDung,
                'HoTen' => $user->HoTen,
                'Email' => $user->Email,
                'VaiTro' => $user->VaiTro,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();

        if ($token) {
            $token->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Dang xuat thanh cong.',
        ]);
    }
}