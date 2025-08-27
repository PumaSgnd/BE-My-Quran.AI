module.exports = (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Terms of Service</title>
</head>
<body>
  <h1>Terms of Service</h1>
  <p>Effective Date: August 27, 2025</p>

  <p>These Terms of Service ("Terms") govern your access to and use of the My-Quran.AI application and services ("Service"). By using the Service, you agree to be bound by these Terms.</p>

  <h2>1. Use of the Service</h2>
  <ul>
    <li>You must be at least 13 years old to use this Service.</li>
    <li>You agree to use the Service only for lawful purposes.</li>
    <li>Do not misuse, reverse engineer, or interfere with the Service or its security features.</li>
  </ul>

  <h2>2. User Accounts</h2>
  <ul>
    <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
    <li>All activities that occur under your account are your responsibility.</li>
  </ul>

  <h2>3. Intellectual Property</h2>
  <p>All content, trademarks, logos, and materials provided by My-Quran.AI are the property of their respective owners and protected by applicable laws.</p>

  <h2>4. Limitation of Liability</h2>
  <p>We are not liable for any indirect, incidental, special, or consequential damages arising out of or in connection with the use of the Service.</p>

  <h2>5. Changes to the Terms</h2>
  <p>We may update these Terms from time to time. Continued use of the Service means you accept the updated Terms.</p>

  <h2>6. Termination</h2>
  <p>We reserve the right to suspend or terminate your access to the Service at any time, for any reason, without notice.</p>

  <h2>7. Contact</h2>
  <p>If you have any questions about these Terms, please contact us at: <a href="mailto:Bomafirasuganda1@gmail.com">Bomafirasuganda1@gmail.com</a></p>
</body>
</html>
  `);
};
