// ============================================
// Firebase Configuration (ES6 Modules)
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBxSX7TZXnNr3JrxA_IuszoQkxKKCHRMPQ",
    authDomain: "mywebsite-42a2f.firebaseapp.com",
    projectId: "mywebsite-42a2f",
    storageBucket: "mywebsite-42a2f.firebasestorage.app",
    messagingSenderId: "139727328408",
    appId: "1:139727328408:web:cea1aa91d61860e7afeced"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================
// Portfolio Management Variables
// ============================================
let wallets = [0, 0, 0, 0, 0, 0];
let transactions = [];
const PORTFOLIO_DOC_ID = 'main_portfolio';

// ============================================
// Firebase Functions
// ============================================

async function saveToFirebase() {
    try {
        const portfolioRef = doc(db, 'portfolios', PORTFOLIO_DOC_ID);
        await setDoc(portfolioRef, {
            wallets: wallets,
            transactions: transactions,
            lastUpdated: serverTimestamp()
        });
        console.log('✅ تم حفظ البيانات بنجاح');
    } catch (error) {
        console.error('❌ خطأ في حفظ البيانات:', error);
        alert('حدث خطأ في حفظ البيانات');
    }
}

async function loadFromFirebase() {
    try {
        const portfolioRef = doc(db, 'portfolios', PORTFOLIO_DOC_ID);
        const docSnap = await getDoc(portfolioRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            wallets = data.wallets || [0, 0, 0, 0, 0, 0];
            transactions = data.transactions || [];
            console.log('✅ تم تحميل البيانات بنجاح');
        } else {
            console.log('ℹ️ لا توجد بيانات محفوظة، سيتم البدء بمحفظة جديدة');
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات:', error);
        alert('حدث خطأ في تحميل البيانات');
    }
}

// ============================================
// Display Functions
// ============================================

function updateWalletDisplay() {
    // Update sub-wallets
    wallets.forEach((amount, index) => {
        const element = document.getElementById(`wallet${index + 1}`);
        if (element) {
            element.textContent = `${amount.toFixed(2)} ر.س`;
            if (amount < 0) {
                element.classList.add('negative');
            } else {
                element.classList.remove('negative');
            }
        }
    });

    // Update main wallet
    const total = wallets.reduce((sum, amount) => sum + amount, 0);
    const mainElement = document.getElementById('mainWalletAmount');
    if (mainElement) {
        mainElement.textContent = `${total.toFixed(2)} ر.س`;
    }
}

function updateTransactionHistory() {
    const listElement = document.getElementById('transactionList');
    
    if (!listElement) return;

    if (transactions.length === 0) {
        listElement.innerHTML = '<div class="empty-state">لا توجد عمليات بعد</div>';
        return;
    }

    listElement.innerHTML = transactions.map(t => `
        <div class="transaction-item ${t.type}">
            <div class="transaction-info">
                <span class="transaction-type">${t.type === 'deposit' ? 'إيداع' : 'سحب'}</span>
                <span class="transaction-wallet">المحفظة ${getWalletName(t.wallet)}</span>
                <span class="transaction-date">${t.date}</span>
            </div>
            <div class="transaction-amount ${t.type}">
                ${t.type === 'deposit' ? '+' : '-'}${t.amount.toFixed(2)} ر.س
            </div>
        </div>
    `).join('');
}

function getWalletName(walletNumber) {
    const names = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة'];
    return names[walletNumber - 1];
}

// ============================================
// Transaction Functions
// ============================================

async function addTransaction() {
    const type = document.getElementById('transactionType').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const walletIndex = parseInt(document.getElementById('transactionWallet').value) - 1;

    // Validation
    if (!amount || amount <= 0) {
        alert('الرجاء إدخال مبلغ صحيح');
        return;
    }

    // Check if total would be negative
    const currentTotal = wallets.reduce((sum, val) => sum + val, 0);
    const newTotal = type === 'deposit' ? currentTotal + amount : currentTotal - amount;

    if (newTotal < 0) {
        alert('لا يمكن أن يكون الرصيد الكلي بالسالب');
        return;
    }

    // Update wallet
    if (type === 'deposit') {
        wallets[walletIndex] += amount;
    } else {
        wallets[walletIndex] -= amount;
    }

    // Add to transactions history
    const transaction = {
        type: type,
        amount: amount,
        wallet: walletIndex + 1,
        date: new Date().toLocaleString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    transactions.unshift(transaction);

    // Update display
    updateWalletDisplay();
    updateTransactionHistory();

    // Save to Firebase
    await saveToFirebase();

    // Clear form
    document.getElementById('transactionAmount').value = '';
}

// ============================================
// Expose to Global Scope
// ============================================
window.addTransaction = addTransaction;

// ============================================
// Initialize on Load
// ============================================
async function initializePortfolio() {
    await loadFromFirebase();
    updateWalletDisplay();
    updateTransactionHistory();
}

// Run initialization
initializePortfolio();

// Listen for page changes to reload data
setInterval(() => {
    const portfolioPage = document.getElementById('portfolio');
    if (portfolioPage && portfolioPage.classList.contains('active')) {
        // Optional: reload data when switching to portfolio page
        // Uncomment if needed:
        // loadFromFirebase().then(() => {
        //     updateWalletDisplay();
        //     updateTransactionHistory();
        // });
    }
}, 1000);
