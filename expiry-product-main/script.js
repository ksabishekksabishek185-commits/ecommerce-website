/* =====================================================
   WHOLESALE PRODUCT EXPIRY ALERT SYSTEM
   FULL JAVASCRIPT - QR + BARCODE SCANNER
===================================================== */

const LOW_STOCK_LIMIT = 10;
const EXPIRY_ALERT_DAYS = 7;

let products = [];
let currentFilter = "all";
let scanner = null;
let scannerRunning = false;
let sellingProductId = null;
let toastTimer = null;
let lastScannedValue = "";
let lastScanTime = 0;


/* =====================================================
   LOAD PRODUCTS
===================================================== */

function loadProducts() {
    try {
        const saved = localStorage.getItem("expiryProducts");
        products = saved ? JSON.parse(saved) : [];
        if (!Array.isArray(products)) products = [];
    } catch (error) {
        console.error("Product load error:", error);
        products = [];
    }
}


/* =====================================================
   SAVE PRODUCTS
===================================================== */

function saveProducts() {
    try {
        localStorage.setItem("expiryProducts", JSON.stringify(products));
        return true;
    } catch (error) {
        console.error("Product save error:", error);
        showToast("Unable to save product", "❌");
        return false;
    }
}


/* =====================================================
   PAGE LOAD
===================================================== */

document.addEventListener("DOMContentLoaded", function () {
    loadProducts();

    setupNavigation();
    setupProductForm();
    setupSearch();
    setupFilters();
    setupScannerButtons();
    setupLogout();
    setupNotificationButton();
    setupPasswordToggle();
    setupAuth();
    setupBilling();

    restoreLogin();
    updateAll();
    registerServiceWorker();
    checkExpiryAlerts();

    setInterval(checkExpiryAlerts, 60000);
});


/* =====================================================
   USER AUTHENTICATION (localStorage-based)
===================================================== */

function getUsers() {
    try {
        const saved = localStorage.getItem("expiryUsers");
        const users = saved ? JSON.parse(saved) : {};
        return users && typeof users === "object" ? users : {};
    } catch (error) {
        console.error("Users load error:", error);
        return {};
    }
}


function saveUsers(users) {
    try {
        localStorage.setItem("expiryUsers", JSON.stringify(users));
        return true;
    } catch (error) {
        console.error("Users save error:", error);
        return false;
    }
}


function setupPasswordToggle() {
    document.querySelectorAll(".password-eye").forEach(function (button) {
        button.addEventListener("click", function () {
            const target = document.querySelector(button.dataset.toggle);
            if (!target) return;

            if (target.type === "password") {
                target.type = "text";
                button.textContent = "🙈";
            } else {
                target.type = "password";
                button.textContent = "👁️";
            }
        });
    });
}


/* =====================================================
   AUTH TABS + FORMS
===================================================== */

function setupAuth() {
    setupAuthTabs();

    setupLogin();
    setupSignup();
    setupForgotPassword();
}


function setupAuthTabs() {
    document.querySelectorAll(".auth-tab").forEach(function (tab) {
        tab.addEventListener("click", function () {
            document.querySelectorAll(".auth-tab").forEach(function (t) {
                t.classList.remove("active");
            });
            tab.classList.add("active");

            showAuthForm(tab.dataset.authtab);
        });
    });

    const backBtn = document.getElementById("backToLoginBtn");
    if (backBtn) {
        backBtn.addEventListener("click", function () {
            setActiveAuthTab("login");
        });
    }
}


function setActiveAuthTab(name) {
    document.querySelectorAll(".auth-tab").forEach(function (t) {
        t.classList.toggle("active", t.dataset.authtab === name);
    });
    showAuthForm(name);
}


function showAuthForm(name) {
    document.querySelectorAll(".auth-form").forEach(function (form) {
        form.classList.add("hidden");
    });

    if (name === "login") {
        document.getElementById("loginForm")?.classList.remove("hidden");
    } else if (name === "signup") {
        document.getElementById("signupForm")?.classList.remove("hidden");
    } else if (name === "forgot") {
        document.getElementById("forgotForm")?.classList.remove("hidden");
    }
}


/* =====================================================
   LOGIN
===================================================== */

function setupLogin() {
    const loginForm = document.getElementById("loginForm");
    if (!loginForm) return;

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const username =
            document.getElementById("username")?.value.trim() || "";
        const password =
            document.getElementById("password")?.value || "";

        if (!username || !password) {
            showToast("Enter username and password", "⚠️");
            return;
        }

        const users = getUsers();

        if (!users[username]) {
            showToast("User not found", "❌");
            return;
        }

        if (users[username].password !== password) {
            showToast("Incorrect password", "❌");
            return;
        }

        sessionStorage.setItem("loggedIn", "true");
        sessionStorage.setItem("loggedUsername", username);
        openApplication(username);
    });
}


/* =====================================================
   SIGN UP
===================================================== */

function setupSignup() {
    const signupForm = document.getElementById("signupForm");
    if (!signupForm) return;

    signupForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name =
            document.getElementById("signupName")?.value.trim() || "";
        const username =
            document.getElementById("signupUsername")?.value.trim() || "";
        const password =
            document.getElementById("signupPassword")?.value || "";

        if (!name || !username || !password) {
            showToast("Please fill all fields", "⚠️");
            return;
        }

        if (username.length < 3) {
            showToast("Username must be at least 3 characters", "⚠️");
            return;
        }

        if (password.length < 4) {
            showToast("Password must be at least 4 characters", "⚠️");
            return;
        }

        const users = getUsers();

        if (users[username]) {
            showToast("Username already exists", "❌");
            return;
        }

        users[username] = {
            name: name,
            password: password,
            createdAt: new Date().toISOString()
        };

        if (saveUsers(users)) {
            showToast("Account created! Please login.", "✓");
            setActiveAuthTab("login");
            signupForm.reset();
        }
    });
}


/* =====================================================
   FORGOT PASSWORD
===================================================== */

function setupForgotPassword() {
    const forgotBtn = document.getElementById("forgotBtn");
    if (forgotBtn) {
        forgotBtn.addEventListener("click", function () {
            showAuthForm("forgot");
        });
    }

    const forgotForm = document.getElementById("forgotForm");
    if (!forgotForm) return;

    forgotForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const username =
            document.getElementById("forgotUsername")?.value.trim() || "";
        const newPassword =
            document.getElementById("forgotNewPassword")?.value || "";

        if (!username || !newPassword) {
            showToast("Enter username and new password", "⚠️");
            return;
        }

        if (newPassword.length < 4) {
            showToast("Password must be at least 4 characters", "⚠️");
            return;
        }

        const users = getUsers();

        if (!users[username]) {
            showToast("User not found", "❌");
            return;
        }

        users[username].password = newPassword;

        if (saveUsers(users)) {
            showToast("Password reset successfully!", "✓");
            forgotForm.reset();
            setActiveAuthTab("login");
        }
    });
}


function restoreLogin() {
    if (sessionStorage.getItem("loggedIn") === "true") {
        openApplication(
            sessionStorage.getItem("loggedUsername") || "User"
        );
    }
}


/* =====================================================
   OPEN APPLICATION
===================================================== */

function openApplication(username) {
    document.getElementById("loginPage")?.classList.add("hidden");
    document.getElementById("appPage")?.classList.remove("hidden");

    const users = getUsers();
    const displayName = (users[username] && users[username].name)
        ? users[username].name
        : username;

    setText("welcomeUser", displayName);
    updateAll();
}


/* =====================================================
   LOGOUT
===================================================== */

function setupLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", async function () {
        sessionStorage.removeItem("loggedIn");
        sessionStorage.removeItem("loggedUsername");
        await stopScanner();
        location.reload();
    });
}


/* =====================================================
   NAVIGATION
===================================================== */

function setupNavigation() {
    document.querySelectorAll(".nav-btn").forEach(function (button) {
        button.addEventListener("click", function () {
            openPage(button.dataset.page);
        });
    });
}


function openPage(pageName) {
    const sections = {
        dashboard: "dashboardSection",
        scanner: "scannerSection",
        products: "productsSection",
        alerts: "alertsSection",
        billing: "billingSection",
        history: "historySection"
    };

    Object.values(sections).forEach(function (id) {
        document.getElementById(id)?.classList.add("hidden");
    });

    document.getElementById(sections[pageName])?.classList.remove("hidden");

    document.querySelectorAll(".nav-btn").forEach(function (button) {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });

    if (pageName !== "scanner") {
        stopScanner();
    }
}


/* =====================================================
   ADD PRODUCT
===================================================== */

function openAddProduct() {
    const modal = document.getElementById("productModal");
    if (!modal) return;

    modal.classList.remove("hidden");
    setText("modalTitle", "Add Product");

    document.getElementById("productForm")?.reset();
    setInputValue("editProductId", "");
    setInputValue("soldQuantity", 0);
}


function closeProductModal() {
    document.getElementById("productModal")?.classList.add("hidden");
}


/* =====================================================
   PRODUCT FORM
===================================================== */

function setupProductForm() {
    const form = document.getElementById("productForm");
    if (!form) return;

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const editId = document.getElementById("editProductId")?.value.trim() || "";
        const name = document.getElementById("productName")?.value.trim() || "";
        const code = document.getElementById("productCode")?.value.trim() || "";
        const total = Number(document.getElementById("totalQuantity")?.value);
        const sold = Number(document.getElementById("soldQuantity")?.value);
        const price = Number(document.getElementById("productPrice")?.value);
        const expiry = document.getElementById("expiryDate")?.value || "";

        if (!name) {
            showToast("Enter product name", "⚠️");
            return;
        }

        if (!code) {
            showToast("Enter Product ID / QR Code", "⚠️");
            return;
        }

        if (!expiry) {
            showToast("Select expiry date", "⚠️");
            return;
        }

        if (!Number.isFinite(total) || total < 0) {
            showToast("Enter valid total quantity", "⚠️");
            return;
        }

        if (!Number.isFinite(sold) || sold < 0) {
            showToast("Enter valid sold quantity", "⚠️");
            return;
        }

        if (sold > total) {
            showToast("Sold quantity cannot be greater than total quantity", "⚠️");
            return;
        }

        if (!Number.isFinite(price) || price < 0) {
            showToast("Enter valid price", "⚠️");
            return;
        }

        if (editId) {
            const index = products.findIndex(
                product => String(product.id) === String(editId)
            );

            if (index === -1) {
                showToast("Product not found", "❌");
                return;
            }

            const duplicate = products.some(
                (product, i) =>
                    i !== index &&
                    String(product.code).toLowerCase() === code.toLowerCase()
            );

            if (duplicate) {
                showToast("Product ID / QR Code already exists", "⚠️");
                return;
            }

            products[index].name = name;
            products[index].code = code;
            products[index].total = total;
            products[index].sold = sold;
            products[index].price = price;
            products[index].expiry = expiry;

            if (saveProducts()) {
                closeProductModal();
                updateAll();
                showToast("Product updated successfully", "✓");
            }
            return;
        }

        const duplicate = products.some(
            product =>
                String(product.code).toLowerCase() === code.toLowerCase()
        );

        if (duplicate) {
            showToast("Product ID / QR Code already exists", "⚠️");
            return;
        }

        products.unshift({
            id: Date.now().toString(),
            name,
            code,
            total,
            sold,
            price,
            expiry,
            createdAt: new Date().toISOString()
        });

        if (saveProducts()) {
            closeProductModal();
            updateAll();
            showToast("Product added successfully", "✓");
        }
    });
}


/* =====================================================
   EDIT PRODUCT
===================================================== */

function editProduct(id) {
    const product = products.find(
        item => String(item.id) === String(id)
    );

    if (!product) {
        showToast("Product not found", "❌");
        return;
    }

    document.getElementById("productModal")?.classList.remove("hidden");
    setText("modalTitle", "Edit Product");

    setInputValue("editProductId", product.id);
    setInputValue("productName", product.name);
    setInputValue("productCode", product.code);
    setInputValue("totalQuantity", product.total);
    setInputValue("soldQuantity", product.sold);
    setInputValue("productPrice", Number(product.price) || 0);
    setInputValue("expiryDate", product.expiry);
}


/* =====================================================
   DELETE PRODUCT
===================================================== */

function deleteProduct(id) {
    const product = products.find(
        item => String(item.id) === String(id)
    );

    if (!product) {
        showToast("Product not found", "❌");
        return;
    }

    if (!confirm("Delete " + product.name + "?")) return;

    products = products.filter(
        item => String(item.id) !== String(id)
    );

    if (saveProducts()) {
        updateAll();
        showToast("Product deleted", "🗑️");
    }
}


/* =====================================================
   SELL PRODUCT
===================================================== */

function openSellModal(id) {
    const product = products.find(
        item => String(item.id) === String(id)
    );

    if (!product) {
        showToast("Product not found", "❌");
        return;
    }

    const remaining = getRemaining(product);

    if (remaining <= 0) {
        showToast("No stock available", "⚠️");
        return;
    }

    sellingProductId = product.id;

    setText("sellProductName", product.name);
    setText("availableStock", remaining);

    const sellQuantity = document.getElementById("sellQuantity");
    if (sellQuantity) {
        sellQuantity.value = 1;
        sellQuantity.max = remaining;
    }

    document.getElementById("sellModal")?.classList.remove("hidden");
}


function closeSellModal() {
    document.getElementById("sellModal")?.classList.add("hidden");
    sellingProductId = null;
}


document.addEventListener("click", function (event) {
    if (!event.target.closest("#confirmSellBtn")) return;
    if (!sellingProductId) return;

    const product = products.find(
        item => String(item.id) === String(sellingProductId)
    );

    if (!product) {
        showToast("Product not found", "❌");
        return;
    }

    const quantity = Number(
        document.getElementById("sellQuantity")?.value
    );

    const remaining = getRemaining(product);

    if (!Number.isFinite(quantity) || quantity <= 0) {
        showToast("Enter valid quantity", "⚠️");
        return;
    }

    if (quantity > remaining) {
        showToast("Not enough stock", "⚠️");
        return;
    }

    const oldRemaining = remaining;
    product.sold = Number(product.sold) + quantity;

    if (saveProducts()) {
        saveSaleHistory(product, quantity, oldRemaining);
        closeSellModal();
        updateAll();
        showToast(quantity + " item(s) sold. Stock updated.", "✓");
    }
});


/* =====================================================
   STOCK / EXPIRY
===================================================== */

function getRemaining(product) {
    return Math.max(
        0,
        (Number(product.total) || 0) -
        (Number(product.sold) || 0)
    );
}


function getDaysUntilExpiry(dateString) {
    if (!dateString) return 99999;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(dateString + "T00:00:00");

    if (Number.isNaN(expiry.getTime())) return 99999;

    return Math.ceil(
        (expiry.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );
}


function getStatus(product) {
    const remaining = getRemaining(product);
    const days = getDaysUntilExpiry(product.expiry);

    if (remaining <= 0) {
        return { type: "out", text: "Out of Stock" };
    }

    if (days < 0) {
        return { type: "expired", text: "Expired" };
    }

    if (days >= 0 && days <= EXPIRY_ALERT_DAYS) {
        return { type: "soon", text: "Expiring Soon" };
    }

    if (remaining <= LOW_STOCK_LIMIT) {
        return { type: "low", text: "Low Stock" };
    }

    return { type: "good", text: "Good" };
}


function formatDate(dateString) {
    if (!dateString) return "-";

    const date = new Date(dateString + "T00:00:00");
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


/* =====================================================
   UPDATE DASHBOARD
===================================================== */

function updateAll() {
    updateDashboard();
    renderProducts();
    renderRecentProducts();
    renderAlerts();
    renderBillingProducts();
    renderBillList();
    renderHistory();
}


function updateDashboard() {
    const totalProducts = products.length;

    const totalStock = products.reduce(
        (sum, product) => sum + getRemaining(product),
        0
    );

    const lowStock = products.filter(product => {
        const remaining = getRemaining(product);
        return remaining > 0 && remaining <= LOW_STOCK_LIMIT;
    }).length;

    const expiringSoon = products.filter(product => {
        const days = getDaysUntilExpiry(product.expiry);
        return (
            days >= 0 &&
            days <= EXPIRY_ALERT_DAYS &&
            getRemaining(product) > 0
        );
    }).length;

    setText("totalProducts", totalProducts);
    setText("totalStock", totalStock);
    setText("lowStock", lowStock);
    setText("expiringSoon", expiringSoon);
}


/* =====================================================
   PRODUCT CARD
===================================================== */

function createProductCard(product) {
    const remaining = getRemaining(product);
    const status = getStatus(product);
    const days = getDaysUntilExpiry(product.expiry);

    let expiryText = formatDate(product.expiry);

    if (days < 0) {
        expiryText += " • Expired";
    } else if (days === 0) {
        expiryText += " • Today";
    } else if (days <= EXPIRY_ALERT_DAYS) {
        expiryText += " • " + days + " day(s) left";
    }

    return `
        <div class="product-card">
            <div class="product-top">
                <div class="product-info">
                    <h3>${escapeHTML(product.name)}</h3>
                    <div class="product-code">
                        ID: ${escapeHTML(product.code)}
                    </div>
                </div>

                <span class="status ${status.type}">
                    ${status.text}
                </span>
            </div>

            <div class="product-details">
                <div class="detail-box">
                    <span>Total</span>
                    <strong>${product.total}</strong>
                </div>

                <div class="detail-box">
                    <span>Sold</span>
                    <strong>${product.sold}</strong>
                </div>

                <div class="detail-box">
                    <span>Remaining</span>
                    <strong>${remaining}</strong>
                </div>
            </div>

            <div style="margin-top:12px;font-size:13px;color:#737b91;">
                Expiry:
                <strong>${expiryText}</strong>
            </div>

            <div style="margin-top:6px;font-size:14px;color:#2ecc71;font-weight:700;">
                ₹${Number(product.price) || 0}
            </div>

            <div class="card-actions">
                <button type="button" class="sell-btn"
                    onclick="openSellModal('${escapeAttribute(product.id)}')">
                    💰 Sell
                </button>

                <button type="button" class="edit-btn"
                    onclick="editProduct('${escapeAttribute(product.id)}')">
                    ✏️ Edit
                </button>

                <button type="button" class="delete-btn"
                    onclick="deleteProduct('${escapeAttribute(product.id)}')">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `;
}


/* =====================================================
   RENDER PRODUCTS
===================================================== */

function renderProducts() {
    const container = document.getElementById("productList");
    if (!container) return;

    const search =
        document.getElementById("searchInput")?.value
            .trim()
            .toLowerCase() || "";

    const filtered = products.filter(product => {
        const name = String(product.name).toLowerCase();
        const code = String(product.code).toLowerCase();

        if (!name.includes(search) && !code.includes(search)) {
            return false;
        }

        const status = getStatus(product);

        if (currentFilter === "all") return true;
        if (currentFilter === "good") return status.type === "good";
        if (currentFilter === "soon") return status.type === "soon";
        if (currentFilter === "expired") return status.type === "expired";

        if (currentFilter === "low") {
            const remaining = getRemaining(product);
            return remaining > 0 && remaining <= LOW_STOCK_LIMIT;
        }

        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = emptyState(
            "📦",
            "No Products Found",
            "Add your first product."
        );
        return;
    }

    container.innerHTML = filtered.map(createProductCard).join("");
}


/* =====================================================
   RECENT PRODUCTS
===================================================== */

function renderRecentProducts() {
    const container = document.getElementById("recentProducts");
    if (!container) return;

    const recent = products.slice(0, 4);

    if (recent.length === 0) {
        container.innerHTML = emptyState(
            "📦",
            "No Products Yet",
            "Click Add Product to get started."
        );
        return;
    }

    container.innerHTML = recent.map(createProductCard).join("");
}


function emptyState(icon, title, message) {
    return `
        <div class="empty-state">
            <div class="empty-icon">${icon}</div>
            <h3>${title}</h3>
            <p>${message}</p>
        </div>
    `;
}


/* =====================================================
   SEARCH / FILTER
===================================================== */

function setupSearch() {
    document.getElementById("searchInput")
        ?.addEventListener("input", renderProducts);
}


function setupFilters() {
    document.querySelectorAll(".filter-btn").forEach(button => {
        button.addEventListener("click", function () {
            document.querySelectorAll(".filter-btn")
                .forEach(btn => btn.classList.remove("active"));

            button.classList.add("active");
            currentFilter = button.dataset.filter;
            renderProducts();
        });
    });
}


/* =====================================================
   QR + BARCODE SCANNER
=====================================================

   IMPORTANT:
   This scanner accepts:
   - QR Code
   - Code 128
   - Code 39
   - Code 93
   - EAN-13
   - EAN-8
   - UPC-A
   - UPC-E
   - ITF
   - Data Matrix
   - PDF417
   - Aztec

   For details WITHOUT looking up localStorage, the QR/barcode
   itself must contain the details.

   Supported JSON example:
   {
     "name":"Milk Powder",
     "code":"8901234567890",
     "total":100,
     "sold":20,
     "expiry":"2027-05-30"
   }

   Also supported compact format:
   EXPIRY|Milk Powder|8901234567890|100|20|2027-05-30

   A normal shop barcode usually contains only a product number.
   It does NOT normally contain expiry/quantity.
===================================================== */

function setupScannerButtons() {
    document.getElementById("startScannerBtn")
        ?.addEventListener("click", startScanner);

    document.getElementById("stopScannerBtn")
        ?.addEventListener("click", stopScanner);
}


function getScannerFormats() {
    if (typeof Html5QrcodeSupportedFormats === "undefined") {
        return undefined;
    }

    return [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.DATA_MATRIX,
        Html5QrcodeSupportedFormats.PDF_417,
        Html5QrcodeSupportedFormats.AZTEC
    ].filter(Boolean);
}


async function startScanner() {
    const message = document.getElementById("scannerMessage");

    if (scannerRunning) {
        if (message) message.textContent = "Camera is already running.";
        return;
    }

    if (typeof Html5Qrcode === "undefined") {
        if (message) {
            message.textContent =
                "Scanner library not loaded. Check your internet connection.";
        }
        return;
    }

    const formats = getScannerFormats();

    const config = {
        fps: 10,
        qrbox: function (viewfinderWidth, viewfinderHeight) {
            const size = Math.floor(
                Math.min(viewfinderWidth, viewfinderHeight) * 0.70
            );
            return {
                width: Math.max(180, Math.min(size, 320)),
                height: Math.max(180, Math.min(size, 320))
            };
        },
        aspectRatio: 1.0,
        disableFlip: false
    };

    if (formats && formats.length) {
        config.formatsToSupport = formats;
    }

    try {
        if (message) {
            message.textContent =
                "Opening camera... QR + barcode scanning enabled.";
        }

        await stopScanner();

        scanner = new Html5Qrcode("reader");

        await scanner.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onQRCodeError
        );

        scannerRunning = true;

        if (message) {
            message.textContent =
                "Camera is ON. Show a QR code or barcode.";
        }
    } catch (error) {
        console.error("Camera error:", error);

        scannerRunning = false;

        try {
            await stopScanner();

            const cameras = await Html5Qrcode.getCameras();

            if (cameras && cameras.length > 0) {
                scanner = new Html5Qrcode("reader");

                await scanner.start(
                    cameras[0].id,
                    config,
                    onScanSuccess,
                    onQRCodeError
                );

                scannerRunning = true;

                if (message) {
                    message.textContent =
                        "Camera is ON. Show a QR code or barcode.";
                }
                return;
            }
        } catch (fallbackError) {
            console.error("Camera fallback error:", fallbackError);
        }

        if (message) {
            message.innerHTML =
                "❌ Camera could not open.<br><br>" +
                "Allow camera permission.<br><br>" +
                "Use HTTPS (GitHub Pages) or VS Code Live Server.";
        }
    }
}


/* =====================================================
   SCAN SUCCESS
===================================================== */

async function onScanSuccess(decodedText, decodedResult) {
    const text = String(decodedText || "").trim();

    if (!text) return;

    // Prevent the same barcode from firing many times per second.
    const now = Date.now();

    if (
        text === lastScannedValue &&
        now - lastScanTime < 2500
    ) {
        return;
    }

    lastScannedValue = text;
    lastScanTime = now;

    const productData = parseScannedProduct(text);

    await showScanResult(productData, text, decodedResult);

    await stopScanner();
}


/* =====================================================
   ONLINE BARCODE LOOKUP (product name)
===================================================== */

async function fetchProductNameByCode(code) {
    if (!code) return null;

    const barcode = String(code).replace(/[^0-9]/g, "");

    if (barcode.length < 8) return null;

    try {
        const response = await fetch(
            "https://world.openfoodfacts.org/api/v2/product/" +
            encodeURIComponent(barcode) +
            ".json"
        );

        if (!response.ok) return null;

        const data = await response.json();

        if (!data || data.status !== 1 || !data.product) return null;

        const name =
            data.product.product_name ||
            data.product.generic_name ||
            data.product.brands ||
            "";

        return String(name).trim() || null;
    } catch (error) {
        console.error("Barcode lookup error:", error);
        return null;
    }
}


/* =====================================================
   ADD SCANNED PRODUCT
===================================================== */

let scannedPendingName = "";
let scannedPendingCode = "";

function openAddFromScan(code, name) {
    scannedPendingCode = String(code || "").trim();
    scannedPendingName = String(name || "").trim();

    openAddProduct();

    if (scannedPendingCode) {
        setInputValue("productCode", scannedPendingCode);
    }

    if (scannedPendingName) {
        setInputValue("productName", scannedPendingName);
    }
}


/* =====================================================
   PARSE QR / BARCODE DATA
===================================================== */

function parseScannedProduct(text) {
    // 1. Try JSON first.
    try {
        const data = JSON.parse(text);

        if (data && typeof data === "object") {
            const normalized = normalizeScannedProduct(data);

            if (normalized) {
                return {
                    type: "embedded",
                    product: normalized
                };
            }
        }
    } catch (error) {
        // Not JSON. Continue.
    }

    // 2. Try compact EXPIRY format.
    const parts = text.split("|");

    if (
        parts.length >= 6 &&
        parts[0].toUpperCase() === "EXPIRY"
    ) {
        const normalized = normalizeScannedProduct({
            name: parts[1],
            code: parts[2],
            total: parts[3],
            sold: parts[4],
            expiry: parts[5]
        });

        if (normalized) {
            return {
                type: "embedded",
                product: normalized
            };
        }
    }

    // 3. Try the existing local product list.
    const localProduct = products.find(product =>
        String(product.code).trim().toLowerCase() ===
        text.toLowerCase()
    );

    if (localProduct) {
        return {
            type: "local",
            product: localProduct
        };
    }

    // 4. No details are available in the scanned code.
    return {
        type: "code-only",
        code: text
    };
}


/* =====================================================
   NORMALIZE EMBEDDED PRODUCT
===================================================== */

function normalizeScannedProduct(data) {
    const name = String(
        data.name ??
        data.productName ??
        ""
    ).trim();

    const code = String(
        data.code ??
        data.productCode ??
        data.id ??
        ""
    ).trim();

    const expiry = String(
        data.expiry ??
        data.expiryDate ??
        ""
    ).trim();

    const total = Number(
        data.total ??
        data.quantity ??
        data.totalQuantity
    );

    const sold = Number(
        data.sold ??
        data.soldQuantity ??
        0
    );

    if (!name || !code || !expiry) {
        return null;
    }

    if (!Number.isFinite(total) || total < 0) {
        return null;
    }

    if (!Number.isFinite(sold) || sold < 0) {
        return null;
    }

    return {
        id: String(data.id ?? code),
        name,
        code,
        total,
        sold,
        expiry
    };
}


/* =====================================================
   SHOW SCAN RESULT
===================================================== */

async function showScanResult(result, rawText, decodedResult) {
    const resultBox = document.getElementById("scanResult");
    const scanText = document.getElementById("scanText");

    resultBox?.classList.remove("hidden");

    if (!scanText) return;

    if (result.type === "embedded" || result.type === "local") {
        const product = result.product;
        const remaining = getRemaining(product);
        const status = getStatus(product);

        scanText.innerHTML = `
            <strong>${escapeHTML(product.name)}</strong>

            <br><br>

            Product ID:
            ${escapeHTML(product.code)}

            <br>

            Total Quantity:
            ${product.total}

            <br>

            Sold Quantity:
            ${product.sold}

            <br>

            Remaining:
            ${remaining}

            <br>

            Expiry:
            ${formatDate(product.expiry)}

            <br>

            Status:
            ${escapeHTML(status.text)}

            <br><br>

            ${
                result.type === "embedded"
                    ? "📦 Details read directly from the scanned code."
                    : "💾 Details found in this device's saved products."
            }
        `;

        showToast(product.name + " found!", "📦");
        return;
    }

    // Code-only result: the barcode/QR contains only an ID number.
    // Look up the product name online, then offer to add it.
    const code = String(rawText || "").trim();

    scanText.innerHTML = `
        <strong>✅ Barcode / QR Scanned</strong>

        <br><br>

        Scanned Code:
        <strong>${escapeHTML(code)}</strong>

        <br><br>

        <span id="scanLookupText">
            🔍 Looking up product name online...
        </span>
    `;

    const fetchedName = await fetchProductNameByCode(code);

    scannedPendingCode = code;
    scannedPendingName = fetchedName || "";

    if (fetchedName) {
        scanText.innerHTML = `
            <strong>✅ Barcode / QR Scanned</strong>

            <br><br>

            Scanned Code:
            <strong>${escapeHTML(code)}</strong>

            <br><br>

            📦 Product:
            <strong>${escapeHTML(fetchedName)}</strong>

            <br><br>

            <button
                type="button"
                class="save-button"
                style="width:100%;"
                onclick="openAddFromScan('${escapeAttribute(code)}', '${escapeAttribute(fetchedName)}')">

                ➕ Add This Product

            </button>
        `;

        showToast("Product found: " + fetchedName, "📦");
    } else {
        scanText.innerHTML = `
            <strong>✅ Barcode / QR Scanned</strong>

            <br><br>

            Scanned Code:
            <strong>${escapeHTML(code)}</strong>

            <br><br>

            ⚠️ No product name found online for this code.
            You can still add it and type the name yourself.

            <br><br>

            <button
                type="button"
                class="save-button"
                style="width:100%;"
                onclick="openAddFromScan('${escapeAttribute(code)}', '')">

                ➕ Add This Product

            </button>
        `;

        showToast("Code scanned successfully", "📷");
    }
}


/* =====================================================
   SCANNER ERROR CALLBACK
===================================================== */

function onQRCodeError(errorMessage) {
    // Continuous camera decoding errors are normal.
}


/* =====================================================
   STOP SCANNER
===================================================== */

async function stopScanner() {
    if (!scanner) {
        scannerRunning = false;
        return;
    }

    try {
        if (scannerRunning) {
            await scanner.stop();
        }
    } catch (error) {
        console.log("Scanner stop:", error);
    }

    try {
        await scanner.clear();
    } catch (error) {
        console.log("Scanner clear:", error);
    }

    scanner = null;
    scannerRunning = false;
}


/* =====================================================
   OPTIONAL: CREATE DATA FOR A PRODUCT QR CODE
=====================================================

   Use this when you later want to generate a QR code that
   contains all product details.

   Example:
   const text = createProductQRData({
       name:"Milk Powder",
       code:"MP1001",
       total:100,
       sold:20,
       expiry:"2027-05-30"
   });

   The returned JSON can be placed inside a QR code.
===================================================== */

function createProductQRData(product) {
    return JSON.stringify({
        name: String(product.name || ""),
        code: String(product.code || ""),
        total: Number(product.total || 0),
        sold: Number(product.sold || 0),
        expiry: String(product.expiry || "")
    });
}


/* =====================================================
   NOTIFICATIONS
===================================================== */

async function enableNotifications() {
    if (!("Notification" in window)) {
        showToast("Browser does not support notifications", "⚠️");
        return;
    }

    try {
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            showToast("Notification permission denied", "⚠️");
            return;
        }

        showToast("Notifications enabled", "🔔");

        if ("serviceWorker" in navigator) {
            const registration =
                await navigator.serviceWorker.ready;

            await registration.showNotification(
                "Expiry Alert System",
                {
                    body: "Notifications are enabled successfully.",
                    tag: "notification-test",
                    icon: "./icon-192.png"
                }
            );
        }
    } catch (error) {
        console.error("Notification error:", error);
        showToast("Notification error", "❌");
    }
}


function setupNotificationButton() {
    document.getElementById("notificationBtn")
        ?.addEventListener("click", enableNotifications);
}


/* =====================================================
   EXPIRY ALERTS
===================================================== */

function checkExpiryAlerts() {
    if (!products.length) return;

    products.forEach(function (product) {
        if (getRemaining(product) <= 0) return;

        const days = getDaysUntilExpiry(product.expiry);

        if (days >= 0 && days <= EXPIRY_ALERT_DAYS) {
            sendExpiryNotification(product, days);
        }
    });
}


async function sendExpiryNotification(product, days) {
    const today = new Date().toISOString().slice(0, 10);

    const notificationKey =
        "expiryNotified_" + product.id + "_" + today;

    if (localStorage.getItem(notificationKey)) return;

    const message =
        days === 0
            ? product.name + " expires today. " +
              getRemaining(product) + " pieces remaining."
            : product.name + " expires in " +
              days + " day(s). " +
              getRemaining(product) + " pieces remaining.";

    localStorage.setItem(notificationKey, "true");

    showToast(message, "🔔");

    if (
        "Notification" in window &&
        Notification.permission === "granted" &&
        "serviceWorker" in navigator
    ) {
        try {
            const registration =
                await navigator.serviceWorker.ready;

            await registration.showNotification(
                "⚠️ Expiry Product Alert",
                {
                    body: message,
                    tag: "expiry-" + product.id,
                    requireInteraction: true,
                    icon: "./icon-192.png"
                }
            );
        } catch (error) {
            console.error("Notification error:", error);
        }
    }
}


/* =====================================================
   ALERT LIST
===================================================== */

function renderAlerts() {
    const container = document.getElementById("alertList");
    if (!container) return;

    const alerts = products.filter(product => {
        const days = getDaysUntilExpiry(product.expiry);

        return (
            getRemaining(product) > 0 &&
            days <= EXPIRY_ALERT_DAYS
        );
    });

    if (alerts.length === 0) {
        container.innerHTML = emptyState(
            "🔔",
            "No Alerts",
            "There are no products needing attention."
        );
        return;
    }

    container.innerHTML = alerts.map(product => {
        const days = getDaysUntilExpiry(product.expiry);

        return `
            <div class="alert-card">
                <h3>
                    ⚠️ ${escapeHTML(product.name)}
                </h3>

                <p>
                    Remaining:
                    <strong>${getRemaining(product)}</strong>
                </p>

                <p>
                    Expiry:
                    ${formatDate(product.expiry)}
                </p>

                <p>
                    ${
                        days < 0
                            ? "Expired"
                            : days === 0
                            ? "Expires Today"
                            : "Expires in " + days + " day(s)"
                    }
                </p>
            </div>
        `;
    }).join("");
}


/* =====================================================
   BILLING
===================================================== */

let billCart = [];

function setupBilling() {
    document.getElementById("billingSearch")
        ?.addEventListener("input", renderBillingProducts);

    document.getElementById("generateBillBtn")
        ?.addEventListener("click", generateBill);

    document.getElementById("printReceiptBtn")
        ?.addEventListener("click", printReceipt);

    renderBillingProducts();
    renderBillCart();
    renderBillList();
}


function renderBillingProducts() {
    const container = document.getElementById("billingProducts");
    if (!container) return;

    const search =
        (document.getElementById("billingSearch")?.value || "")
            .trim()
            .toLowerCase();

    const list = products.filter(product => {
        if (!product.name && !product.code) return false;

        const name = String(product.name || "").toLowerCase();
        const code = String(product.code || "").toLowerCase();

        if (search && !name.includes(search) && !code.includes(search)) {
            return false;
        }

        return getRemaining(product) > 0;
    });

    if (list.length === 0) {
        container.innerHTML = emptyState(
            "📦",
            "No Products Available",
            "Add products with stock first."
        );
        return;
    }

    container.innerHTML = list.map(product => {
        const remaining = getRemaining(product);
        const price = Number(product.price) || 0;

        return `
            <div class="bill-product-row">
                <div class="bill-product-info">
                    <strong>${escapeHTML(product.name)}</strong>
                    <small>
                        ID: ${escapeHTML(product.code)} • Stock: ${remaining} • ₹${price}
                    </small>
                </div>

                <button
                    type="button"
                    class="bill-add-btn"
                    onclick="addToBill('${escapeAttribute(product.id)}')">
                    +
                </button>
            </div>
        `;
    }).join("");
}


function addToBill(productId) {
    const product = products.find(
        item => String(item.id) === String(productId)
    );

    if (!product) {
        showToast("Product not found", "❌");
        return;
    }

    const remaining = getRemaining(product);

    if (remaining <= 0) {
        showToast("No stock available", "⚠️");
        return;
    }

    const existing = billCart.find(
        item => String(item.productId) === String(productId)
    );

    const currentQty = existing ? existing.qty : 0;

    if (currentQty >= remaining) {
        showToast("Not enough stock", "⚠️");
        return;
    }

    if (existing) {
        existing.qty += 1;
    } else {
        billCart.push({
            productId: product.id,
            name: product.name,
            code: product.code,
            price: Number(product.price) || 0,
            qty: 1
        });
    }

    renderBillCart();
    showToast(product.name + " added to bill", "🛒");
}


function removeFromBill(productId) {
    billCart = billCart.filter(
        item => String(item.productId) !== String(productId)
    );
    renderBillCart();
}


function changeBillQty(productId, delta) {
    const product = products.find(
        item => String(item.id) === String(productId)
    );

    if (!product) return;

    const remaining = getRemaining(product);
    const item = billCart.find(
        cartItem => String(cartItem.productId) === String(productId)
    );

    if (!item) return;

    const newQty = item.qty + delta;

    if (newQty < 1) {
        removeFromBill(productId);
        return;
    }

    if (newQty > remaining) {
        showToast("Not enough stock", "⚠️");
        return;
    }

    item.qty = newQty;
    renderBillCart();
}


function renderBillCart() {
    const container = document.getElementById("billCart");
    const totalEl = document.getElementById("billTotal");
    const countEl = document.getElementById("billItemCount");

    const count = billCart.reduce((sum, item) => sum + item.qty, 0);

    if (countEl) countEl.textContent = count + " item(s)";

    if (!container) return;

    if (billCart.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🧾</div>
                <h3>Bill is Empty</h3>
                <p>Add products from the left side.</p>
            </div>
        `;

        if (totalEl) totalEl.textContent = "₹0.00";
        return;
    }

    let total = 0;

    container.innerHTML = billCart.map(item => {
        const lineTotal = item.price * item.qty;
        total += lineTotal;

        return `
            <div class="bill-cart-row">
                <div class="bill-cart-info">
                    <strong>${escapeHTML(item.name)}</strong>
                    <small>₹${item.price} × ${item.qty}</small>
                </div>

                <div class="bill-cart-qty">
                    <button
                        type="button"
                        class="qty-btn"
                        onclick="changeBillQty('${escapeAttribute(item.productId)}', -1)">
                        −
                    </button>

                    <span>${item.qty}</span>

                    <button
                        type="button"
                        class="qty-btn"
                        onclick="changeBillQty('${escapeAttribute(item.productId)}', 1)">
                        +
                    </button>
                </div>

                <strong class="bill-cart-line">₹${lineTotal.toFixed(2)}</strong>

                <button
                    type="button"
                    class="qty-btn remove-qty"
                    onclick="removeFromBill('${escapeAttribute(item.productId)}')">
                    ✕
                </button>
            </div>
        `;
    }).join("");

    if (totalEl) totalEl.textContent = "₹" + total.toFixed(2);
}


function generateBill() {
    if (billCart.length === 0) {
        showToast("Bill is empty", "⚠️");
        return;
    }

    for (const item of billCart) {
        const product = products.find(
            p => String(p.id) === String(item.productId)
        );

        if (!product) {
            showToast("A product is missing", "❌");
            return;
        }

        if (item.qty > getRemaining(product)) {
            showToast("Not enough stock for " + product.name, "⚠️");
            return;
        }
    }

    const billNumber = "B" + Date.now().toString().slice(-8);
    let total = 0;

    const billItems = billCart.map(item => {
        const lineTotal = item.price * item.qty;
        total += lineTotal;

        const product = products.find(
            p => String(p.id) === String(item.productId)
        );

        return {
            productId: item.productId,
            name: item.name,
            code: item.code,
            price: item.price,
            qty: item.qty,
            lineTotal
        };
    });

    for (const item of billCart) {
        const product = products.find(
            p => String(p.id) === String(item.productId)
        );

        if (product) {
            product.sold = Number(product.sold) + item.qty;
            saveSaleHistory(product, item.qty, getRemaining(product) + item.qty);
        }
    }

    saveProducts();

    let bills = getBills();
    bills.unshift({
        billNumber,
        items: billItems,
        total,
        date: new Date().toISOString()
    });
    bills = bills.slice(0, 50);
    localStorage.setItem("expiryBills", JSON.stringify(bills));

    billCart = [];
    renderBillCart();
    renderBillingProducts();
    renderBillList();
    updateAll();

    showToast(
        "Bill " + billNumber + " generated. ₹" + total.toFixed(2) + " | Stock updated",
        "🧾"
    );

    openReceipt(billNumber);
}


function getBills() {
    try {
        const saved = localStorage.getItem("expiryBills");
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        return [];
    }
}


function renderBillList() {
    const container = document.getElementById("billList");
    if (!container) return;

    const bills = getBills();

    if (bills.length === 0) {
        container.innerHTML = emptyState(
            "🧾",
            "No Bills Yet",
            "Generated bills will appear here."
        );
        return;
    }

    container.innerHTML = bills.map(bill => {
        const date = new Date(bill.date);

        const formattedDate = date.toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric"
        });

        const formattedTime = date.toLocaleTimeString("en-IN", {
            hour: "2-digit", minute: "2-digit"
        });

        const itemSummary = bill.items
            .map(item => item.name + " ×" + item.qty)
            .join(", ");

        return `
            <div class="bill-history-card">
                <div class="bill-history-head">
                    <strong>#${escapeHTML(bill.billNumber)}</strong>
                    <small>${formattedDate} • ${formattedTime}</small>
                </div>

                <p class="bill-history-items">${escapeHTML(itemSummary)}</p>

                <div class="bill-history-total">
                    <span>${bill.items.length} item type(s)</span>
                    <strong>₹${Number(bill.total || 0).toFixed(2)}</strong>
                </div>

                <button
                    type="button"
                    class="receipt-btn"
                    onclick="openReceipt('${escapeAttribute(bill.billNumber)}')">
                    🖨️ View / Print Receipt
                </button>
            </div>
        `;
    }).join("");
}


/* =====================================================
   RECEIPT
===================================================== */

function openReceipt(billNumber) {
    const bill = getBills().find(
        b => String(b.billNumber) === String(billNumber)
    );

    if (!bill) {
        showToast("Bill not found", "❌");
        return;
    }

    const receiptItems = document.getElementById("receiptItems");
    if (!receiptItems) return;

    const date = new Date(bill.date);

    const formattedDate = date.toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
    });

    const formattedTime = date.toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit"
    });

    let rows = "";

    bill.items.forEach((item, index) => {
        const lineTotal = (Number(item.price) || 0) * Number(item.qty);
        rows += `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHTML(item.name)}</td>
                <td>${Number(item.qty)}</td>
                <td>${Number(item.price).toFixed(2)}</td>
                <td>${lineTotal.toFixed(2)}</td>
            </tr>
        `;
    });

    setText("receiptNumber", "#" + bill.billNumber);
    setText("receiptDate", formattedDate + " • " + formattedTime);
    setText("receiptItemCount", bill.items.length + " item type(s)");
    receiptItems.innerHTML = rows;
    setText("receiptTotal", "₹" + Number(bill.total || 0).toFixed(2));

    document.getElementById("receiptModal")?.classList.remove("hidden");
}


function closeReceipt() {
    document.getElementById("receiptModal")?.classList.add("hidden");
}


function printReceipt() {
    window.print();
}


/* =====================================================
   SALES HISTORY
===================================================== */

function saveSaleHistory(product, quantity, oldRemaining) {
    try {
        let history = getSaleHistory();

        history.unshift({
            id: Date.now().toString(),
            productId: product.id,
            productName: product.name,
            productCode: product.code,
            quantity,
            oldRemaining,
            remaining: getRemaining(product),
            date: new Date().toISOString()
        });

        history = history.slice(0, 100);

        localStorage.setItem(
            "salesHistory",
            JSON.stringify(history)
        );
    } catch (error) {
        console.error("History save error:", error);
    }
}


function getSaleHistory() {
    try {
        const saved = localStorage.getItem("salesHistory");
        const history = saved ? JSON.parse(saved) : [];

        return Array.isArray(history) ? history : [];
    } catch (error) {
        console.error("History load error:", error);
        return [];
    }
}


function renderHistory() {
    const container = document.getElementById("historyList");
    if (!container) return;

    const history = getSaleHistory();

    if (history.length === 0) {
        container.innerHTML = emptyState(
            "📜",
            "No Sales History",
            "Sold products will appear here."
        );
        return;
    }

    container.innerHTML = history.map(item => {
        const date = new Date(item.date);

        const formattedDate = date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

        const formattedTime = date.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

        return `
            <div class="history-card">
                <div class="history-icon">💰</div>

                <div class="history-info">
                    <h3>${escapeHTML(item.productName)}</h3>

                    <p>
                        ID:
                        ${escapeHTML(item.productCode)}
                    </p>

                    <small>
                        ${formattedDate} • ${formattedTime}
                    </small>
                </div>

                <div class="history-quantity">
                    <strong>-${item.quantity}</strong>
                    <span>Sold</span>
                    <small>Stock: ${item.remaining}</small>
                </div>
            </div>
        `;
    }).join("");
}


/* =====================================================
   SERVICE WORKER
===================================================== */

function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
        .register("./service-worker.js")
        .then(registration => {
            console.log(
                "Service Worker registered:",
                registration.scope
            );
        })
        .catch(error => {
            console.error("Service Worker error:", error);
        });
}


/* =====================================================
   TOAST
===================================================== */

function showToast(message, icon = "✓") {
    const toast = document.getElementById("toast");
    const toastText = document.getElementById("toastText");
    const toastIcon = document.getElementById("toastIcon");

    if (!toast || !toastText || !toastIcon) {
        alert(message);
        return;
    }

    toastText.textContent = message;
    toastIcon.textContent = icon;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(function () {
        toast.classList.remove("show");
    }, 3500);
}


/* =====================================================
   HELPERS
===================================================== */

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}


function setInputValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value ?? "";
}


function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {
    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}
