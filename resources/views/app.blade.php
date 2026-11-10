<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#175171">
    <link rel="icon" type="image/jpeg" href="{{ config('branding.logo') }}">
    <style>
        :root {
            --brand-700: {{ config('branding.primary') }};
            --brand-500: {{ config('branding.blue') }};
            --accent-500: {{ config('branding.accent') }};
        }
    </style>
    <title inertia>{{ config('branding.name') }}</title>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    @inertiaHead
</head>
<body class="min-h-screen bg-slate-50 text-slate-900 antialiased">
    @inertia
</body>
</html>
