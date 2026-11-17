<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NguoiDung;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    // DANG NHAP ADMIN
    public function login(Request $request)
    {
        return $this->authenticate($request, 'QuanTri', 'admin-web');
    }

    // DANG NHAP KHACH HANG
    public function customerLogin(Request $request)
    {
        return $this->authenticate($request, 'KhachHang', 'customer-web');
    }

    // DANG KY KHACH HANG
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'hoTen' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:100', 'unique:NguoiDung,Email'],
            'soDienThoai' => ['nullable', 'string', 'max:15'],
            'password' => ['required', 'string', 'min:8', 'max:72'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Thong tin dang ky khong hop le.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = new NguoiDung();
        $user->HoTen = $request->hoTen;
        $user->Email = $request->email;
        $user->SoDienThoai = $request->soDienThoai;
        $user->MatKhauMaHoa = Hash::make($request->password);

        // Khong cho phep tu dang ky tai khoan Admin
        $user->VaiTro = 'KhachHang';
        $user->HoatDong = 1;
        $user->NgayTao = now();
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Dang ky tai khoan thanh cong.',
        ], 201);
    }

    // XAC THUC DANG NHAP THEO VAI TRO
    private function authenticate(Request $request, string $role, string $tokenName)
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
            ->where('VaiTro', $role)
            ->where('HoatDong', 1)
            ->first();

        if (!$user || !Hash::check($request->password, $user->MatKhauMaHoa)) {
            return response()->json([
                'success' => false,
                'message' => 'Email hoac mat khau khong chinh xac.',
            ], 401);
        }

        $token = $user->createToken($tokenName)->plainTextToken;

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

    // DANG XUAT
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
