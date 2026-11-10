<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? 'Erreur' }} - TanameCar</title>
    <style>
        body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #E2E8F0; font-family: "Segoe UI", Arial, sans-serif; color: #0f172a; }
        .card { width: min(92vw, 560px); background: #fff; border-radius: 10px; padding: 40px; text-align: center; box-shadow: 0 10px 35px rgba(23,81,113,.12); }
        img { width: 260px; max-width: 100%; height: auto; margin-bottom: 24px; }
        .code { font-size: 54px; font-weight: 800; color: #175171; line-height: 1; }
        h1 { font-size: 22px; margin: 12px 0 8px; color: #175171; }
        p { color: #64748b; line-height: 1.6; }
        a { display: inline-block; margin-top: 18px; background: #175171; color: #fff; text-decoration: none; padding: 11px 20px; border-radius: 6px; font-weight: 600; }
        a:hover { background: #12445A; }
    </style>
</head>
<body>
    <div class="card">
        <img src="{{ asset('brand/login-logo.jpg') }}" alt="TANAMECAR">
        <div class="code">{{ $code ?? 500 }}</div>
        <h1>{{ $title ?? 'Une erreur est survenue' }}</h1>
        <p>{{ $message ?? 'Veuillez réessayer ou contacter l’administrateur.' }}</p>
        <a href="{{ url('/') }}">Retour à l’accueil</a>
    </div>
</body>
</html>
