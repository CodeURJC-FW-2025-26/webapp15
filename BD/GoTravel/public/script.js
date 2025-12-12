document.addEventListener('DOMContentLoaded', () => {

    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorModalEl = document.getElementById('errorModal');
    let errorModal;

    if (typeof bootstrap !== 'undefined' && errorModalEl) {
        errorModal = new bootstrap.Modal(errorModalEl);
    }
    const errorModalBody = document.getElementById('errorModalBody');

    const currentForm = document.querySelector('form');

    const dropZone = document.getElementById('dropZone');

    if (dropZone) {
        const imageInput = document.getElementById('imageInput');
        const imagePreview = document.getElementById('imagePreview');
        const promptText = dropZone.querySelector('.drop-zone__prompt');
        const removeBtn = document.getElementById('removeImageBtn');
        const removeImageFlag = document.getElementById('remove_image');

        const isEditing = currentForm.dataset.isEditing === 'true';
        const currentImage = currentForm.dataset.currentImage;

        function updateThumbnail(file) {
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    if (promptText) promptText.style.display = 'none';
                    imagePreview.src = reader.result;
                    imagePreview.style.display = 'block';
                    if (removeBtn) removeBtn.style.display = 'flex';
                    if (removeImageFlag) removeImageFlag.value = "false";
                };
                reader.readAsDataURL(file);
            } else {
                imagePreview.src = '';
                imagePreview.style.display = 'none';
                if (promptText) promptText.style.display = 'block';
                if (removeBtn) removeBtn.style.display = 'none';
            }
        }

        if (isEditing && currentImage && currentImage !== 'default.jpg' && currentImage !== '') {
            imagePreview.src = `/uploads/${currentImage}`;
            imagePreview.style.display = 'block';
            if (promptText) promptText.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'flex';
        }

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        dropZone.addEventListener('dragover', () => dropZone.classList.add('dragover'));
        ['dragleave', 'dragend'].forEach(type => dropZone.addEventListener(type, () => dropZone.classList.remove('dragover')));

        dropZone.addEventListener('drop', (e) => {
            dropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                imageInput.files = files;
                updateThumbnail(files[0]);
            }
        });

        dropZone.addEventListener('click', (e) => {
            if (e.target !== removeBtn) {
                imageInput.click();
            }
        });

        if (imageInput) {
            imageInput.addEventListener('change', () => {
                if (imageInput.files.length) {
                    updateThumbnail(imageInput.files[0]);
                }
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (imageInput) imageInput.value = '';
                updateThumbnail(null);
                if (removeImageFlag) removeImageFlag.value = "true";
            });
        }
    }

    const nameInput = document.getElementById('name');
    const nameFeedback = document.getElementById('nameFeedback');

    function validateField(input) {
        if (input.type === 'hidden' || input.type === 'file') return true;

        let isValid = true;
        input.classList.remove('is-invalid', 'is-valid');

        if (!input.checkValidity()) isValid = false;

        if (input.id === 'name') {
            const val = input.value.trim();
            if (!/^[A-Z]/.test(val)) {
                isValid = false;
                if (nameFeedback) nameFeedback.innerText = "Start with capital letter.";
            } else if (val.length < 3) {
                isValid = false;
                if (nameFeedback) nameFeedback.innerText = "Min 3 chars.";
            }
        }

        if ((input.id === 'description' || input.name === 'description') && (input.value.length > 0 && input.value.length < 10)) isValid = false;

        if (input.id === 'price' && input.value < 0) isValid = false;

        if (!isValid) input.classList.add('is-invalid');
        else if (input.value && input.type !== 'checkbox') input.classList.add('is-valid');

        return isValid;
    }

    if (currentForm) {
        const inputs = currentForm.querySelectorAll('input:not([type=hidden]):not([type=file]), select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => {
                if (input.classList.contains('is-invalid')) input.classList.remove('is-invalid');
            });
        });

        if (nameInput) {
            nameInput.addEventListener('blur', async function() {
                if (!validateField(nameInput)) return;

                const tripIdInput = document.getElementById('tripId');
                const excludeId = tripIdInput ? tripIdInput.value : '';

                try {
                    const response = await fetch(`/api/check-trip-name?name=${encodeURIComponent(this.value.trim())}&excludeId=${excludeId}`);
                    const data = await response.json();

                    if (data.exists) {
                        nameInput.classList.remove('is-valid');
                        nameInput.classList.add('is-invalid');
                        if (nameFeedback) nameFeedback.innerText = "This name already exists.";
                    } else {
                        nameInput.classList.remove('is-invalid');
                        nameInput.classList.add('is-valid');
                    }
                } catch (error) {
                    console.error("Error checking name API", error);
                }
            });
        }

        currentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();

            let isFormValid = true;
            const formInputs = currentForm.querySelectorAll('input:not([type=hidden]):not([type=file]), select, textarea');
            formInputs.forEach(input => {
                if (!validateField(input)) isFormValid = false;
            });

            if (nameInput && nameInput.classList.contains('is-invalid')) isFormValid = false;

            if (!isFormValid) {
                const f = currentForm.querySelector('.is-invalid');
                if (f) f.focus();
                return;
            }

            if (loadingSpinner) loadingSpinner.style.display = 'flex';
            const submitBtn = currentForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            const formData = new FormData(currentForm);

            try {
                const response = await fetch(currentForm.action, {
                    method: 'POST',
                    body: formData
                });

                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    throw new Error("Received non-JSON response from server. Check backend.");
                }

                const result = await response.json();

                if (result.success) {
                    window.location.href = result.redirectUrl;
                } else {
                    if (loadingSpinner) loadingSpinner.style.display = 'none';
                    if (submitBtn) submitBtn.disabled = false;

                    let errorMsg = "<ul>" + (result.errors || []).map(err => `<li>${err}</li>`).join('') + "</ul>";

                    if (errorModal) {
                        errorModalBody.innerHTML = errorMsg;
                        errorModal.show();
                    } else {
                        alert("Errors:\n" + (result.errors || []).join("\n"));
                    }
                }

            } catch (error) {
                console.error(error);
                if (loadingSpinner) loadingSpinner.style.display = 'none';
                if (submitBtn) submitBtn.disabled = false;

                if (errorModal) {
                    errorModalBody.innerText = "Connection error: " + error.message;
                    errorModal.show();
                } else {
                    alert("Error: " + error.message);
                }
            }
        });

        const btnDelete = document.getElementById('btnDelete');

        if (btnDelete) {
            btnDelete.addEventListener('click', async () => {
                if (!confirm("¿Estás seguro de que quieres borrar este viaje?")) return;

                if (loadingSpinner) loadingSpinner.style.display = 'flex';
                btnDelete.disabled = true;

                const id = btnDelete.dataset.id;

                try {
                    const response = await fetch(`/delete/trip/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    const contentType = response.headers.get("content-type");
                    if (!contentType || !contentType.includes("application/json")) {
                        throw new Error("El servidor devolvió HTML (error en router.js)");
                    }

                    const data = await response.json();

                    if (data.success) {
                        window.location.href = '/';
                    } else {
                        alert("Error: " + data.message);
                    }

                } catch (error) {
                    console.error(error);
                    alert("Error de conexión: " + error.message);
                } finally {
                    if (loadingSpinner) loadingSpinner.style.display = 'none';
                    btnDelete.disabled = false;
                }
            });
        }
    }
});