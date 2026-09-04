const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = __dirname;
const PORT = process.env.PORT || 5500;

function getLocalIP() {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name] || []) {
            if (net.family === "IPv4" && !net.internal) {
                return net.address;
            }
        }
    }

    return "localhost";
}

const MIME = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".webmanifest": "application/manifest+json"
};

const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);

    if (urlPath === "/") urlPath = "/index.html";

    const filePath = path.join(ROOT, urlPath);

    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not Found");
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
            "Content-Type": MIME[ext] || "application/octet-stream"
        });
        res.end(data);
    });
});

server.listen(PORT, () => {
    const localIP = getLocalIP();

    console.log("✅ Expiry Alert is running!\n");
    console.log("   • On this PC:    http://localhost:" + PORT);
    console.log(
        "   • On your phone: http://" + localIP + ":" + PORT +
        "   <- open this on your mobile\n"
    );
    console.log("   (Connect phone to the same Wi-Fi and allow");
    console.log("    Node through Windows Firewall if needed.)");
});
