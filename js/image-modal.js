/**
 * Binds the shared image lightbox. Returns { open, close, isOpen }.
 */
function initImageModal() {
    const imageModal = document.getElementById('image-modal');
    const imageModalImg = document.getElementById('image-modal-img');
    const imageModalCaption = document.getElementById('image-modal-caption');
    const imageModalClose = document.getElementById('image-modal-close');

    if (!imageModal || !imageModalImg || !imageModalCaption) {
        return {
            open: () => {},
            close: () => {},
            isOpen: () => false
        };
    }

    const open = (src, caption) => {
        imageModalImg.src = src;
        imageModalImg.alt = caption;
        imageModalCaption.textContent = caption;
        imageModal.classList.add('is-open');
        imageModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    const close = () => {
        imageModal.classList.remove('is-open');
        imageModal.setAttribute('aria-hidden', 'true');
        imageModalImg.src = '';
        imageModalImg.alt = '';
        imageModalCaption.textContent = '';
        document.body.style.overflow = '';
    };

    imageModalClose?.addEventListener('click', close);
    imageModal.addEventListener('click', (event) => {
        if (event.target === imageModal) {
            close();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && imageModal.classList.contains('is-open')) {
            close();
        }
    });

    return {
        open,
        close,
        isOpen: () => imageModal.classList.contains('is-open')
    };
}
