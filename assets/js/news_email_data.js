(() => {
    const storageKey = 'vintora_newsletter_emails';

    const loadEmails = () => {
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
            return Array.isArray(saved) ? saved : [];
        } catch (err) {
            console.error('Email list parse error:', err);
            return [];
        }
    };

    const saveEmails = (list) => {
        localStorage.setItem(storageKey, JSON.stringify(list));
    };

    const createToast = () => {
        let toast = document.querySelector('.newsletter-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'newsletter-toast';
            document.body.appendChild(toast);
        }
        return toast;
    };

    const showToast = (toastEl, message, type = 'success') => {
        toastEl.textContent = message;
        toastEl.classList.remove('show', 'error');
        if (type === 'error') toastEl.classList.add('error');
        requestAnimationFrame(() => {
            toastEl.classList.add('show');
            setTimeout(() => toastEl.classList.remove('show'), 2500);
        });
    };

    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('newsletter-form');
        if (!form) return;

        const emailInput = form.querySelector('input[name="email"]');
        const toast = createToast();
        let emails = loadEmails();

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = (emailInput.value || '').trim().toLowerCase();
            const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

            if (!isValid) {
                showToast(toast, 'Lütfen geçerli bir e-posta girin.', 'error');
                return;
            }

            if (!emails.includes(email)) {
                emails.push(email);
                saveEmails(emails);
            }

            emailInput.value = '';
            showToast(toast, 'Abone oldunuz! Teşekkürler.');
        });

        // Expose list for debugging or other scripts
        window.newsEmailData = {
            getList: () => [...emails]
        };
    });
})();
