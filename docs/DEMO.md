# The 5-minute demo script

Start the stack (`docker compose -f infra/docker-compose.yml up --build`, or `npm run dev`) and open
<http://localhost:3000> (Docker) / <http://localhost:5173> (dev).

1. **Portada.** Point at the DEMO banner: everything is fictional, nothing is stored.
2. **Iniciar sesión.** Cédula `1-2345-6789`, contraseña `demo`. The second step simulates firma digital: the
   one-time code appears in the "SMS simulado" box. Explain that in production this is the citizen's certificate.
3. **Panel.** "Hola, María." Hover the ⓘ badges on the profile card: each field shows *which* registry it came from
   and the exchange id that can be found later in the audit trail. Nothing here was typed by María.
4. **Iniciar un negocio.** Read the consent notice aloud — this is the once-only principle with the citizen in
   control. Personal data is read-only. Fill in: `Café Tico S.A.`, sociedad, actividad 5610 (restaurantes), dirección,
   3 empleados. Submit.
5. **Seguimiento.** Four agencies light up in sequence in a few seconds. Each row shows its exchange id.
6. **Resultado.** NITE from Tributación, número patronal from CCSS, patente from the Municipalidad de Montes de Oca
   with its annual fee and expiry. The "una sola vez" table shows ten fields María never re-typed. The benefits panel
   shows 4 trips, 8 hours and ₡50 000 saved (configurable in `.env`).
7. **Descargar constancia (PDF).** Open it: one page, letter size, all four confirmations and the audit references.
8. **Mis datos compartidos.** Every exchange, with purpose, consent reference, latency and the *names* of the fields
   that were returned. This is what makes once-only trustworthy.
9. **Cómo funciona.** The registry with live health per agency and the diagram. Mention that adding a fifth agency
   is a registry entry plus a mock.
10. **Salir.**

Second citizen for variety: `7-0123-0456` (Talamanca) — the patente comes from a different municipality with a
different fee multiplier, showing that the municipal layer is data, not code.

Reset everything without restarting: `curl -X POST http://localhost:3001/api/__demo/reset`.

## Version 2: four life events and the legal question

The dashboard now shows six life events, each with a badge: **Posible hoy**, **Parcialmente hoy** or **Requiere ley**.
Click "¿Qué significa cada etiqueta?" once, then:

1. **Iniciar un negocio** as a sociedad: the Registro Nacional now forms the company and Salud issues the sanitary
   permit; six steps, and the patente step is red, "Requiere ley". Click "¿Se puede hoy?" on that row: 84 patente
   laws, 54 cantons in the VUI, and the Ley 9986 template that would fix it.
2. **Tuve un hijo**: the birth is registered same-day (this already works in Costa Rica since 2016), then the CCSS
   coverage and the vaccination record that today the family has to request separately.
3. **Voy a construir**: the property list is loaded from the Registro Nacional (no deed, no cadastral plan); the APC
   step is green, because the CFIA platform is Costa Rica's own proof that a one-stop window works.
4. **Cambié de domicilio**: the purest once-only case, red as a whole. After it completes, go back to the dashboard:
   the profile already shows the new canton.
5. **Marco legal**: the table of every step with its basis and its reference model, the catalogue of 25 instruments,
   and the comparative matrix Costa Rica / Estonia / Singapore / EU.
6. **Por qué**: the case for government support, the eight-step roadmap, the digital-dividend rule and the calculator.
   Move the slider to 0.5 % of GDP and read the split.

Talking point: the Government already chose X-Road (project Conecta, 2026). This demo is not a different idea; it is
what Conecta looks like from the citizen's side once a law obliges everyone to join.
