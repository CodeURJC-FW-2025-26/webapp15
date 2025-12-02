document.addEventListener('DOMContentLoaded', function() {
    
    const form = document.getElementById('tripForm');
    if (!form) return;

    const dropZone = document.getElementById('dropZone');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const promptText = dropZone.querySelector('.drop-zone__prompt');
    const removeBtn = document.getElementById('removeImageBtn');
    const removeImageFlag = document.getElementById('remove_image');
    

    const isEditing = form.dataset.isEditing === 'true';
    const currentImage = form.dataset.currentImage;


    function updateThumbnail(file) {
        if (file) {

            const reader = new FileReader();
            
            reader.onload = () => {

                if(promptText) promptText.style.display = 'none'; 

                imagePreview.src = reader.result;
                imagePreview.style.display = 'block';

                if(removeBtn) removeBtn.style.display = 'flex';

                if(removeImageFlag) removeImageFlag.value = "false";
            };
            
            reader.readAsDataURL(file); 
        } else {

            imagePreview.src = '';
            imagePreview.style.display = 'none';
            if(promptText) promptText.style.display = 'block';
            if(removeBtn) removeBtn.style.display = 'none';
        }
    }


    if (isEditing && currentImage && currentImage !== 'default.jpg' && currentImage !== '') {
        imagePreview.src = `/uploads/${currentImage}`;
        imagePreview.style.display = 'block';
        if(promptText) promptText.style.display = 'none';
        if(removeBtn) removeBtn.style.display = 'flex';
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
        if(e.target !== removeBtn) {
            imageInput.click();
        }
    });

    imageInput.addEventListener('change', () => {
        if (imageInput.files.length) {
            updateThumbnail(imageInput.files[0]);
        }
    });

    if(removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            imageInput.value = ''; 
            updateThumbnail(null);
            if(removeImageFlag) removeImageFlag.value = "true";
        });
    }


    const nameInput = document.getElementById('name');
    const nameFeedback = document.getElementById('nameFeedback');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorModalEl = document.getElementById('errorModal');
    let errorModal;
    if (typeof bootstrap !== 'undefined' && errorModalEl) errorModal = new bootstrap.Modal(errorModalEl);
    const errorModalBody = document.getElementById('errorModalBody');

    function validateField(input) {
         if(input.type === 'hidden' || input.type === 'file') return true;
         let isValid = true;
         input.classList.remove('is-invalid', 'is-valid');
         if (!input.checkValidity()) isValid = false;
         if (input.id === 'name') {
             const val = input.value.trim();
             if (!/^[A-Z]/.test(val)) { isValid = false; nameFeedback.innerText = "Start with capital letter."; }
             else if (val.length < 3) { isValid = false; nameFeedback.innerText = "Min 3 chars."; }
         }
         if (input.id === 'description' && (input.value.length < 10 || input.value.length > 200)) isValid = false;
         if (input.id === 'duration') { const val = parseInt(input.value); if (val < 1 || val > 100) isValid = false; }
         if (input.id === 'price' && input.value < 0) isValid = false;

         if (!isValid) input.classList.add('is-invalid');
         else if(input.value) input.classList.add('is-valid');
         return isValid;
    }

    const inputs = form.querySelectorAll('input:not([type=hidden]):not([type=file]), select, textarea');
    inputs.forEach(input => {
         input.addEventListener('blur', () => validateField(input));
         input.addEventListener('input', () => { if(input.classList.contains('is-invalid')) input.classList.remove('is-invalid'); });
    });

    nameInput.addEventListener('blur', async function() {
        if (!validateField(nameInput)) return;
        const tripIdInput = document.getElementById('tripId');
        const excludeId = tripIdInput ? tripIdInput.value : '';
        try {
            const response = await fetch(`/api/check-trip-name?name=${encodeURIComponent(this.value.trim())}&excludeId=${excludeId}`);
            const data = await response.json();
            if (data.exists) { nameInput.classList.remove('is-valid'); nameInput.classList.add('is-invalid'); nameFeedback.innerText = "Exists."; }
            else { nameInput.classList.remove('is-invalid'); nameInput.classList.add('is-valid'); }
        } catch (error) {}
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        let isFormValid = true;
        inputs.forEach(input => { if (!validateField(input)) isFormValid = false; });
        if (nameInput.classList.contains('is-invalid')) isFormValid = false;
        if (!isFormValid) { const f = form.querySelector('.is-invalid'); if(f) f.focus(); return; }

        loadingSpinner.style.display = 'flex';
        const formData = new FormData(form);
        try {
            const response = await fetch(form.action, { method: 'POST', body: formData });
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) throw new Error("Server error");
            const result = await response.json();
            if (result.success) window.location.href = result.redirectUrl;
            else {
                loadingSpinner.style.display = 'none';
                let errorMsg = "<ul>" + (result.errors || []).map(err => `<li>${err}</li>`).join('') + "</ul>";
                if(errorModal) { errorModalBody.innerHTML = errorMsg; errorModal.show(); } else alert(result.errors);
            }
        } catch (error) {
            loadingSpinner.style.display = 'none';
            if(errorModal) { errorModalBody.innerText = error.message; errorModal.show(); } else alert(error.message);
        }
    });
});