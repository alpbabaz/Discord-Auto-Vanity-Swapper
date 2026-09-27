import http2 from 'http2';
import tls from 'tls';
import fs from 'fs';
// made by alp
showBanner();

const token = "";
const password = "";
const server1 = ""; // aga bak şimdi burdan url yi siliyor
const server2 = ""; // ahanda burdaki servera çekiyor hesap ikisindede olcak sw id sini giriyon
const channelId = ""; // log ıd si bura aga
const REQ2_COUNT = 1;
let VANITY = "";
let mfaToken = "";

const DISCORD_HOST = 'canary.discord.com';
const DISCORD_IP = '162.159.135.232';

const baseHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) nosniff/1.0.9164 Chrome/124.0.6367.243 Electron/30.2.0 Safari/537.36",
    Authorization: token,
    "Content-Type": "application/json",
    "X-Super-Properties": "eyJvcyI6IkFuZHJvaWQiLCJicm93c2VyIjoiQW5kcm9pZCBDaHJvbWUiLCJkZXZpY2UiOiJBbmRyb2lkIiwic3lzdGVtX2xvY2FsZSI6InRyLVRSIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKExpbnV4OyBBbmRyb2lkIDYuMDsgTmV4dXMgNSBCdWlsZC9NUkE1OE4pIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMzEuMC4wLjAgTW9iaWxlIFNhZmFyaS81MzcuMzYiLCJicm93c2VyX3ZlcnNpb24iOiIxMzEuMC4wLjAiLCJvc192ZXJzaW9uIjoiNi4wIiwicmVmZXJyZXIiOiJodHRwczovL2Rpc2NvcmQuY29tL2NoYW5uZWxzL0BtZS8xMzAzMDQ1MDIyNjQzNTIzNjU1IiwicmVmZXJyaW5nX2RvbWFpbiI6ImRpc2NvcmQuY29tIiwicmVmZXJyZXJfY3VycmVudCI6IiIsInJlZmVycmluZ19kb21haW5fY3VycmVudCI6IiIsInJlbGVhc2VfY2hhbm5lbCI6InN0YWJsZSIsImNsaWVudF9idWlsZF9udW1iZXIiOjM1NTYyNCwiY2xpZW50X2V2ZW50X3NvdXJjZSI6bnVsbCwiaGFzX2NsaWVudF9tb2RzIjpmYWxzZX0=",
};

const client = http2.connect("https://canary.discord.com");

client.on("error", (err) => {
    console.error("HTTP/2 Baglanti Hatasi:", err.message);
});


const MFA_HEADERS = `Host: ${DISCORD_HOST}\r\nAuthorization: ${token}\r\nUser-Agent: Chrome/124\r\nX-Super-Properties: eyJicm93c2VyIjoiQ2hyb21lIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiQ2hyb21lIiwiY2xpZW50X2J1aWxkX251bWJlciI6MzU1NjI0fQ==\r\nX-Discord-Timezone: Europe/Istanbul\r\nX-Discord-Locale: en-US\r\nX-Debug-Options: bugReporterEnabled\r\nContent-Type: application/json`;

function tlsReq(m, p, b, cb) {
    const s = tls.connect({
        host: DISCORD_IP,
        port: 443,
        servername: DISCORD_HOST,
        rejectUnauthorized: false,
        minVersion: 'TLSv1.3',
        maxVersion: 'TLSv1.3',
        ciphers: 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256',
        sessionTimeout: 300
    });
    let r = '';
    s.on('secureConnect', () => s.write(`${m} ${p} HTTP/1.1\r\n${MFA_HEADERS}\r\nContent-Length: ${Buffer.byteLength(b)}\r\nConnection: close\r\n\r\n${b}`));
    s.on('data', c => r += c);
    s.on('end', () => {
        let body = r.slice(r.indexOf('\r\n\r\n') + 4);
        body = body.slice(body.indexOf('{'), body.lastIndexOf('}') + 1);
        cb(+r.slice(9, r.indexOf('\r\n')).split(' ')[0], body);
    });
    s.on('error', () => setTimeout(updateMfa, 5e3));
}

function updateMfa() {
    tlsReq('PATCH', '/api/v7/guilds/0/vanity-url', '{"code":"ataturk"}', (_, b1) => {
        const ticket = JSON.parse(b1)?.mfa?.ticket;
        if (!ticket) { console.log(b1); return setTimeout(updateMfa, 5e3); }
        tlsReq('POST', '/api/v7/mfa/finish', JSON.stringify({ ticket, mfa_type: 'password', data: password }), (st, b2) => {
            const tk = st === 200 && JSON.parse(b2)?.token;
            if (tk) {
                mfaToken = tk;
                console.log('mfa fix');
                return setTimeout(updateMfa, 24e4);
            }
            console.log(`${st} - ${b2}`);
            setTimeout(updateMfa, 5e3);
        });
    });
}
updateMfa();
// ---

const http2Request = async (method, path, customHeaders = {}, body = null, onResponse = null) => new Promise((resolve, reject) => {
    const req = client.request({ ":method": method, ":path": path, ...customHeaders });
    let data = "";

    req.on("response", (headers) => {
        if (onResponse) onResponse(headers);
    });

    req.on("data", (chunk) => {
        data += chunk;
    });

    req.on("end", () => {
        resolve(data);
    });

    req.on("error", (err) => {
        reject(err);
    });

    if (body) req.write(body);
    req.end();
});

const parseJSON = (data) => {
    try {
        return JSON.parse(data);
    } catch (e) {
        return { error: "Invalid JSON", raw: data };
    }
};

async function sendMessage(vanity, data) {
    if (!channelId) return;
    const bodyStr = JSON.stringify({
        content: `@everyone \`/${vanity}\` \n\`\`\`json\n${JSON.stringify(data)}\`\`\``
    });
    try {
        await http2Request("POST", `/api/channels/${channelId}/messages`, baseHeaders, bodyStr);
    } catch (e) {
    }
}

let isClaimed = false;

async function executeSwap(vanityCode) {
    const setBodyStr = JSON.stringify({ code: vanityCode });
    const swapHeaders = { ...baseHeaders, "X-Discord-MFA-Authorization": mfaToken };
    
    const req1 = client.request({ ":method": "DELETE", ":path": `/api/v9/invites/${vanityCode}`, ...swapHeaders });
    req1.on("data", () => {});
    req1.on("end", () => {});
    req1.on("error", (e) => { console.log("[!] Delete request hatasi:", e.message); });
    req1.end();

    let preReq2s = [];
    for (let i = 0; i < REQ2_COUNT; i++) {
        const req2 = client.request({ ":method": "PATCH", ":path": `/api/guilds/${server2}/vanity-url`, ...swapHeaders });
        let res2Data = "";
        req2.on("data", chunk => res2Data += chunk);
        req2.on("end", () => {
            const parsed = parseJSON(res2Data);
            console.log(parsed);
            if (parsed.code === vanityCode && !isClaimed) {
                isClaimed = true;
                sendMessage(vanityCode, parsed);
                console.log(`Vanity successfully retrieved.`);
                setTimeout(() => process.exit(0), 1000);
            }
        });
        req2.on("error", (e) => { console.log("[!] Patch request hatasi:", e.message); });
        preReq2s.push(req2);
    }
    
    for (const req2 of preReq2s) {
        req2.write(setBodyStr);
        req2.end();
    }
}

async function checkPermissionAndSwap() {
    console.log(`[+] Server 1 (${server1}) yetki kontrolü basladi...`);
    let delay = 400; // rate limit yiyebiliriz diye kucuk bir delay
    
    while(true) {
        try {
            const response = await http2Request("GET", `/api/guilds/${server1}/vanity-url`, baseHeaders);
            const data = parseJSON(response);

            if (data.code && typeof data.code === "string" && !data.message) {
                console.log(`yetki geldi. Vanity URL bulundu: ${data.code}`);
                VANITY = data.code;
                executeSwap(VANITY);
                break;
            } else if (data.message && data.message.includes("rate limited")) {
                console.log(`Rate Limited...`);
                process.exit(1);
            } else {
                // yetki yok
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        } catch (error) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

checkPermissionAndSwap();

function showBanner() {
    console.log(`\x1b[0;37m   \x1b[0;1;37m▄\x1b[0;37m▄\x1b[0;36m▄\x1b[0;1;30m▄\x1b[0;37m  \x1b[0;1;37m▄\x1b[0;37m▄\x1b[0;36m▄\x1b[0;1;30m▄\x1b[0;37m     \x1b[0;1;37m▄▄▄\x1b[0;37m▄▄\x1b[0;36m▄\x1b[0;1;30m▄ \x1b[0;37m    \x1b[0;1;37m▄▄▄\x1b[0;37m▄▄\x1b[0;36m▄\x1b[0;1;30m▄\x1b[0;37m        \x1b[0;1;37m▄\x1b[0;37m▄\x1b[0;36m▄\x1b[0;1;30m▄\x1b[0;37m          \x1b[0;1;37m▄▄▄\x1b[0;37m▄▄\x1b[0;36m▄\x1b[0;1;30m▄\x1b[0;37m     \x1b[0;1;37m▄▄▄▄\x1b[0;37m▄ \x1b[0;1;37m▄▄▄▄\x1b[0;37m▄\x1b[0m
\x1b[0;37m \x1b[0;1;37m▄\x1b[0;1;37;46m▀\x1b[0;1;36;46m▒▓\x1b[0;1;36m█\x1b[0;1;36;46m▄▄\x1b[0;1;30;46m▀\x1b[0;1;36;46m▄\x1b[0;1;36m██\x1b[0;1;36;46m▄▄\x1b[0;1;30;46m▀\x1b[0;1;30m▄\x1b[0;37m  \x1b[0;1;37m█\x1b[0;1;36m█████\x1b[0;1;36;46m▄▄\x1b[0;1;30;46m▀\x1b[0;1;30m▄\x1b[0;37m  \x1b[0;1;37m█\x1b[0;1;36m██\x1b[0;1;36;46m▒▓\x1b[0;1;36m█\x1b[0;1;36;46m▄▄\x1b[0;1;30;46m▀\x1b[0;1;30m▄\x1b[0;37m   \x1b[0;1;37m▄\x1b[0;1;37;46m▀\x1b[0;1;36;46m▒▓\x1b[0;1;36m█\x1b[0;1;36;46m▄▄\x1b[0;1;30;46m▀\x1b[0;1;30m▄\x1b[0;37m       \x1b[0;1;37m█\x1b[0;1;36m█████\x1b[0;1;36;46m▄▄\x1b[0;1;30;46m▀\x1b[0;1;30m▄\x1b[0;37m  \x1b[0;1;37m█\x1b[0;1;36m███\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36;46m▄\x1b[0;1;30;46m▀\x1b[0;1;36m█\x1b[0;36m█\x1b[0m
\x1b[0;1;37m▐\x1b[0;1;37;46m▌\x1b[0;1;36m░█\x1b[0;36m█▀\x1b[0;1;37;47m▄\x1b[0;1;36m███\x1b[0;36m█▀\x1b[0;1;37;47m▄\x1b[0;1;36m█\x1b[0;1;36;46m▄▒\x1b[0;36m▌\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m█░█\x1b[0;36m█▀\x1b[0;1;37;47m▄\x1b[0;1;36m██\x1b[0;1;36;46m▄\x1b[0;1;30;46m▀\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m█░█\x1b[0;36m█▀\x1b[0;1;37;47m▄\x1b[0;1;36m█\x1b[0;1;36;46m▄▒\x1b[0;36m▌\x1b[0;37m \x1b[0;1;37m▐\x1b[0;1;37;46m▌\x1b[0;1;36m░█\x1b[0;36m█▀\x1b[0;1;37;47m▄\x1b[0;1;36m█\x1b[0;1;36;46m▄▒\x1b[0;36m▌\x1b[0;37m      \x1b[0;1;37m█\x1b[0;1;36m█░█\x1b[0;36m█▀\x1b[0;1;37;47m▄\x1b[0;1;36m██\x1b[0;1;36;46m▄\x1b[0;1;30;46m▀\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m█░█\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m███\x1b[0;36m█\x1b[0m
\x1b[0;1;37m█\x1b[0;1;36m▄\x1b[0;37m \x1b[0;1;36m■\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m███\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m███\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m▄ ■\x1b[0;36m█▄\x1b[0;1;37;47m▀\x1b[0;1;36m███\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m▄\x1b[0;37m \x1b[0;1;36m■\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m███\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m▄\x1b[0;37m \x1b[0;1;36m■\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m███\x1b[0;36m█\x1b[0;37m      \x1b[0;1;37m█\x1b[0;1;36m▄\x1b[0;37m \x1b[0;1;36m■\x1b[0;36m█▄\x1b[0;1;37;47m▀\x1b[0;1;36m██\x1b[0;1;36;46m▀\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m▄\x1b[0;37m \x1b[0;1;36m■\x1b[0;36m█▄\x1b[0;1;37;47m▀\x1b[0;1;36m███\x1b[0;36m█\x1b[0m
\x1b[0;1;37m█\x1b[0;1;36;46m▒\x1b[0;1;36m▓█\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m███\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m███\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m█▓███████\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36;46m▒\x1b[0;1;36m▓█\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m███\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36;46m▒\x1b[0;1;36m▓██\x1b[0;36m█\x1b[0;37m           \x1b[0;1;37m█\x1b[0;1;36m█▓█████\x1b[0;1;36;46m▄\x1b[0;36m▄\x1b[0;37m  \x1b[0;1;37m█\x1b[0;1;36m█▓███████\x1b[0;36m█\x1b[0m
\x1b[0;1;37m█\x1b[0;1;36;46m▓\x1b[0;1;36m██\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;37;46m┌\x1b[0;37;46m─┐\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;37;46m┌\x1b[0;37;46m─┐\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m███\x1b[0;36m█▀\x1b[0;1;37;47m▄\x1b[0;1;37;46m┌\x1b[0;37;46m─┐\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36;46m▓\x1b[0;1;36m██\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;37;46m┌\x1b[0;37;46m─┐\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36;46m▓\x1b[0;1;36m██\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;37;46m┌\x1b[0;37;46m─┐\x1b[0;36m█\x1b[0;37m      \x1b[0;1;37m█\x1b[0;1;36m███\x1b[0;36m█▀\x1b[0;1;37;47m▄\x1b[0;1;37;46m┌\x1b[0;37;46m─┐\x1b[0;36m█\x1b[0;37m ▀\x1b[0;36m▀▀▀▀▀\x1b[0;1;37;47m▄\x1b[0;1;37;46m┌\x1b[0;37;46m─┐\x1b[0;36m█\x1b[0m
\x1b[0;1;37m█\x1b[0;1;36m███\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;37;46m└─┘\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;37;46m└─┘\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m███\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;37;46m└─┘\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m███\x1b[0;36m█▄\x1b[0;1;37;47m▀\x1b[0;37;46m└─┘\x1b[0;36m▌\x1b[0;37m \x1b[0;1;37m▐\x1b[0;1;37;46m▌\x1b[0;1;36m██\x1b[0;36m█▄\x1b[0;1;37;47m▀\x1b[0;37;46m└─┘\x1b[0;36m▌\x1b[0;37m      \x1b[0;1;37m█\x1b[0;1;36m███\x1b[0;36m█▄\x1b[0;1;37;47m▀\x1b[0;37;46m└─┘\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m███\x1b[0;36m█▄\x1b[0;1;37m█\x1b[0;37;46m└─┘\x1b[0;36m█\x1b[0m
\x1b[0;1;37;47m▀\x1b[0;1;36;46m▀▀▀\x1b[0;36m█\x1b[0;37m \x1b[0;1;37;47m▀\x1b[0;1;36;46m▀▀▀\x1b[0;36m█\x1b[0;37m \x1b[0;1;37;47m▀\x1b[0;1;36;46m▀▀▀\x1b[0;36m█\x1b[0;37m \x1b[0;1;37;47m▀\x1b[0;1;36;46m▀▀▀\x1b[0;36;46m▄\x1b[0;37m \x1b[0;1;37;47m▀\x1b[0;1;36;46m▀▀▀\x1b[0;36;46m▄\x1b[0;37m \x1b[0;1;37;47m▀\x1b[0;1;36;46m▀▀▀▀▀▀▀▒\x1b[0;36m▀\x1b[0;37m   \x1b[0;1;37m▀\x1b[0;1;36;46m▒▀▀▀▀▀▒\x1b[0;36m▀\x1b[0;37m       \x1b[0;1;37;47m▀\x1b[0;1;36;46m▀▀▀▀▀▀▀▀▀\x1b[0;36m▀\x1b[0;37m \x1b[0;1;37;47m▀\x1b[0;1;36;46m▀▀▀▀▀▀▀▀▀\x1b[0;36;46m▄\x1b[0m
\x1b[0;37m                                                                                     \x1b[0;1;37m▄▄▄\x1b[0;37m▄▄\x1b[0;36m▄\x1b[0;1;30m▄ \x1b[0;37m    \x1b[0;1;37m▄▄▄▄\x1b[0;37m▄       \x1b[0;1;37m▄▄▄\x1b[0;37m▄▄\x1b[0;36m▄\x1b[0;1;30m▄\x1b[0;37m    \x1b[0m
\x1b[0;37m                                                                                     \x1b[0;1;37m█\x1b[0;1;36m█████\x1b[0;1;36;46m▄▄\x1b[0;1;30;46m▀\x1b[0;1;30m▄\x1b[0;37m  \x1b[0;1;37m█\x1b[0;1;36m██\x1b[0;1;36;46m▒\x1b[0;36m█\x1b[0;37m       \x1b[0;1;37m█\x1b[0;1;36m█████\x1b[0;1;36;46m▄▄\x1b[0;1;30;46m▀\x1b[0;1;30m▄\x1b[0;37m \x1b[0m
\x1b[0;37m                                                                                     \x1b[0;1;37m█\x1b[0;1;36m█░█\x1b[0;36m█▀\x1b[0;1;37;47m▄\x1b[0;1;36m██\x1b[0;1;36;46m▄\x1b[0;1;30;46m▀\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m█░█\x1b[0;36m█\x1b[0;37m       \x1b[0;1;37m█\x1b[0;1;36m█░█\x1b[0;36m█▀\x1b[0;1;37;47m▄\x1b[0;1;36m██\x1b[0;1;36;46m▄\x1b[0;1;30;46m▀\x1b[0m
\x1b[0;37m                                                                                     \x1b[0;1;37m█\x1b[0;1;36m▄ ■\x1b[0;36m█▄\x1b[0;1;37;47m▀\x1b[0;1;36m███\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m▄\x1b[0;37m \x1b[0;1;36m■\x1b[0;36m█\x1b[0;37m       \x1b[0;1;37m█\x1b[0;1;36m▄\x1b[0;37m \x1b[0;1;36m■\x1b[0;36m█▄\x1b[0;1;37;47m▀\x1b[0;1;36m██\x1b[0;1;36;46m▀\x1b[0;36m▀\x1b[0m
\x1b[0;37m                                                                                     \x1b[0;1;37m█\x1b[0;1;36m█▓███████\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36;46m▒\x1b[0;1;36m▓█\x1b[0;36m█\x1b[0;37m       \x1b[0;1;37m█\x1b[0;1;36m█▓███\x1b[0;1;36;46m▀▀\x1b[0;36m▀\x1b[0;37m  \x1b[0m
\x1b[0;37m                                                                                     \x1b[0;1;37m█\x1b[0;1;36m███\x1b[0;36m█▀\x1b[0;1;37;47m▄\x1b[0;1;37;46m┌\x1b[0;37;46m─┐\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36;46m▓\x1b[0;1;36m██\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;37;46m┌\x1b[0;37;46m─┐\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m███\x1b[0;36m█▀\x1b[0;37m     \x1b[0m
\x1b[0;37m                                                                                     \x1b[0;1;37m█\x1b[0;1;36m███\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m█\x1b[0;37;46m└─┘\x1b[0;36m█\x1b[0;37m \x1b[0;1;37m▐\x1b[0;1;37;46m▌\x1b[0;1;36m██\x1b[0;36m█▄\x1b[0;1;37;47m▀\x1b[0;37;46m└─┘\x1b[0;36m▌\x1b[0;37m \x1b[0;1;37m█\x1b[0;1;36m███\x1b[0;36m█\x1b[0;37m      \x1b[0m
\x1b[0;37m                                                                                     \x1b[0;1;37;47m▀\x1b[0;1;36;46m▀▀▀\x1b[0;36;46m▄\x1b[0;37m \x1b[0;1;37;47m▀\x1b[0;1;36;46m▀▀▀\x1b[0;36;46m▄\x1b[0;37m  \x1b[0;1;37m▀\x1b[0;1;36;46m▒▀▀▀▀▀▒\x1b[0;36m▀\x1b[0;37m  \x1b[0;1;37;47m▀\x1b[0;1;36;46m▀▀▀\x1b[0;36m█\x1b[0;37m      \x1b[0m`);
}