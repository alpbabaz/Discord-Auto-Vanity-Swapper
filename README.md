# ⚡ Discord Auto Vanity Swapper

Automatically transfers a Discord vanity URL from one server to another the moment you get permission — before snipers can grab it.

> 🧠 **Logic:** Waits for permission on `server1`, deletes the vanity instantly, and patches `server2` at the same time.

---

## 🚀 Features

- ⚡ **HTTP/2** requests (fast)
- 🔐 **TLS 1.3** fallback (for MFA bypass)
- 🤖 **Auto MFA refresh** (every 24s)
- 🎯 **Instant permission check** (400ms interval)
- 📢 **Log channel support** (`@everyone` mention)
- 🖥️ **One-click run** (`start.bat`)

---

## 📥 Setup

### Requirements
- [Node.js](https://nodejs.org/) (v18+ recommended)

### Steps

1. **Clone / download:**
   ```bash
   git clone https://github.com/alpbabaz/discord-auto-swapper.git
   cd discord-auto-swapper
   ```

2. **Open `swap.js` and fill in:**

   | Variable | Description |
   |---|---|
   | `token` | Your Discord account token |
   | `password` | Your account password (for MFA) |
   | `server1` | **Source** server ID (the one losing the URL) |
   | `server2` | **Target** server ID (the one receiving the URL) |
   | `channelId` | Channel ID for log messages |
   | `REQ2_COUNT` | Number of parallel PATCH requests (1 recommended) |

   > ⚠️ **Important:** Your account must be in **both servers** and have **executive** permission.

3. **Run:**
   - Windows: double-click `start.bat`
   - Manual: `node swap.js`

---

## 🧠 How It Works

```
┌─────────────────────────────────────────────────────────┐
│  1. GET /vanity-url for server1                         │
│  2. Poll every 400ms until "code" appears               │
│  3. Grab VANITY                                         │
│  4. DELETE /invites/{vanity}                            │
│  5. PATCH /guilds/{server2}/vanity-url at the same time │
│  6. Log to channel + process.exit(0)                    │
└─────────────────────────────────────────────────────────┘
```

MFA token auto-refreshes every 24s → **no 401 errors.**

---

## ⚠️ Disclaimer

This tool is **for educational purposes only**. Usage that violates Discord ToS (account theft, unauthorized URL grabbing, etc.) is **strictly prohibited**. The developer accepts no responsibility.

---

## 👤 Credits

**Made by alp** 💙

---

## 📜 License

MIT

---
---

# ⚡ Discord Auto Vanity Swapper (TR)

Bir Discord vanity URL'sini, **yetki geldiği an** bir sunucudan diğerine otomatik taşıyan araç. Sniper'lara yakalanmadan URL'yi kaparsınız.

> 🧠 **Mantık:** `server1`'de yetki bekler, yetki gelince URL'yi siler ve aynı anda `server2`'ye yazar.

---

## 🚀 Özellikler

- ⚡ **HTTP/2** istekleri (hızlı)
- 🔐 **TLS 1.3** fallback (MFA bypass için)
- 🤖 **Otomatik MFA yenileme** (24 sn'de bir)
- 🎯 **Anlık yetki kontrolü** (400ms aralık)
- 📢 **Log kanalı desteği** (`@everyone` mention)
- 🖥️ **Tek tıkla çalıştırma** (`start.bat`)

---

## 📥 Kurulum

### Gereksinimler
- [Node.js](https://nodejs.org/) (v18+ önerilir)
- Hesabınızda **2FA** açık olmamalı

### Adımlar

1. **Klonla / indir:**
   ```bash
   git clone https://github.com/alpbabaz/discord-auto-swapper.git
   cd discord-auto-swapper
   ```

2. **`swap.js` dosyasını aç ve doldur:**

   | Değişken | Açıklama |
   |---|---|
   | `token` | Discord hesap tokeniniz |
   | `password` | Hesap şifreniz (MFA için) |
   | `server1` | **Silinecek** sunucu ID'si |
   | `server2` | **Hedef** sunucu ID'si |
   | `channelId` | Log mesajlarının gideceği kanal ID'si |
   | `REQ2_COUNT` | Paralel PATCH istek sayısı (1 önerilir) |

   > ⚠️ **Önemli:** Hesabınız **iki sunucuda da** olmalı ve **Yönetici** yetkisine sahip olmalı.

3. **Çalıştır:**
   - Windows: `start.bat` çift tıkla
   - Manuel: `node swap.js`

---

## 🧠 Nasıl Çalışır?

```
┌─────────────────────────────────────────────────────────┐
│  1. server1 için GET /vanity-url                        │
│  2. "code" gelene kadar 400ms aralıkla bekle            │
│  3. VANITY'yi al                                        │
│  4. DELETE /invites/{vanity}                            │
│  5. Aynı anda PATCH /guilds/{server2}/vanity-url        │
│  6. Log kanalına mesaj + process.exit(0)                │
└─────────────────────────────────────────────────────────┘
```

MFA tokeni 24 saniyede bir otomatik yenilenir → **401 hatası almazsın.**

---

## ⚠️ Yasal Uyarı

Bu araç **yalnızca eğitim amaçlıdır**. Discord ToS'a aykırı kullanım (hesap çalma, izinsiz URL alma vb.) **yasaktır**. Geliştirici hiçbir sorumluluk kabul etmez.

---

## 👤 Credits

**Made by alp** 💙

---

## 📜 Lisans

MIT
