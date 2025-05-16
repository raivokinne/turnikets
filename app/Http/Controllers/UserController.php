<?php

namespace App\Http\Controllers;

use App\Mail\QrCodeMail;
use App\Models\AccessCreadential;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('User/Create.tsx');
    }

    public function storeStudent(Request $request): void
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'class' => 'required|string'
        ]);

        $user = User::query()->create([
            'name' => $request->name,
            'email' => $request->email,
            'class' => $request->class,
            'role' => 'student',
        ]);

        $hex_data = "47455420" . // GET
            "2F63646F722E6367693F6F70656E3D312664" . // /cdor.cgi?open=1&d
            "6F6F723D3020485454502F312E310D0A" . // oor=0 HTTP/1.1\r\n
            "486F73743A203139322E3136382E31332E3233350D0A" . // Host: 192.168.13.235\r\n
            "417574686F72697A6174696F6E3A20426173696320" . // Authorization: Basic
            "59574E7430566D6C75364F4467344F4467344F4467340D0A" . // Base64 encoded credentials\r\n
            "436F6E6E656374696F6E3A20636C6F73650D0A0D0A"; // Connection: close\r\n\r\n

        $qr_data = hex2bin($hex_data) . $user->id;

        $encodedData = urlencode(base64_encode($qr_data));

        $response = Http::get('https://api.qrserver.com/v1/create-qr-code/', [
            'size' => '300x300',
            'data' => $encodedData
        ]);

        if ($response->successful()) {
            $file = $response->body();
            $fileName = 'qrcode_' . $user->id . '.png';
            $filePath = '/storage/qrcodes/' . $fileName;

            file_put_contents(public_path($filePath), $file);

            $accessCredential = AccessCreadential::query()->create([
                'email' => $user->email,
                'qrcode_url' => $filePath,
                'user_id' => $user->id
            ]);

            Mail::to($user->email)->send(new QrCodeMail(
                $user->name,
                $user->email,
                $accessCredential->qrcode_url
            ));
        } else {
            Log::error('QR code generation failed', [
                'user_id' => $user->id,
                'status' => $response->status()
            ]);
            throw new \Exception('Failed to generate QR code');
        }
    }

    public function sendEmail(Request $request, string $id): void
    {
        $validated = Validator::make($request->json()->all(), [
            'to' => 'required|email',
            'name' => 'required|string',
            'attachmentUrl' => 'required|string',
            'class' => 'required|string'
        ]);

        $validated->validate();

        $hex_data = "47455420" . // GET
            "2F63646F722E6367693F6F70656E3D312664" . // /cdor.cgi?open=1&d
            "6F6F723D3020485454502F312E310D0A" . // oor=0 HTTP/1.1\r\n
            "486F73743A203139322E3136382E31332E3233350D0A" . // Host: 192.168.13.235\r\n
            "417574686F72697A6174696F6E3A20426173696320" . // Authorization: Basic
            "59574E7430566D6C75364F4467344F4467344F4467340D0A" . // Base64 encoded credentials\r\n
            "436F6E6E656374696F6E3A20636C6F73650D0A0D0A"; // Connection: close\r\n\r\n

        $user = User::query()->find($id);

        $qr_data = hex2bin($hex_data) . $user->id;

        $encodedData = urlencode(base64_encode($qr_data));

        $response = Http::get('https://api.qrserver.com/v1/create-qr-code/', [
            'size' => '300x300',
            'data' => $encodedData
        ]);

        if ($response->successful()) {
            $file = $response->body();
            $fileName = 'qrcode_' . $user->id . '.png';
            $filePath = '/storage/qrcodes/' . $fileName;

            file_put_contents(public_path($filePath), $file);

            $accessCredential = AccessCreadential::query()->create([
                'email' => $user->email,
                'qrcode_url' => $filePath,
                'user_id' => $user->id
            ]);

            Mail::to($validated['to'])->send(new QrCodeMail(
                $validated['name'],
                $validated['to'],
                $accessCredential->qrcode_url
            ));
        } else {
            Log::error('QR code generation failed', [
                'user_id' => $user->id,
                'status' => $response->status()
            ]);
            throw new \Exception('Failed to generate QR code');
        }
    }
}
