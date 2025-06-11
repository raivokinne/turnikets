<!DOCTYPE html>
<html lang="lv">
<head>
    <meta charset="UTF-8">
    <title>Tavs QR kods</title>
</head>
<body>
    <p>Labdien, {{ $name }},</p>

    <p>Te būs atjaunots, vieglāk noskenējams QR kods lietošanai dienesta viesnīcā!</p>

    <p><img src="{{ $qrUrl }}" alt="QR kods" style="width:200px; height:auto; margin: 20px 0;"></p>

    <p>Saglabā to telefonā! Tas ir nepieciešams, lai autorizētos dienesta viesnīcā.</p>

    <p>Padoms: Ja būs tev gaišāks ekrāna spilgtums, vieglāk nolasīsies QR kods. Neturi QR kodu pārāk tuvu skenerim.</p>

    <p>Ar cieņu,<br>IT administrators</p>
</body>
</html>
