document.addEventListener('DOMContentLoaded', () => {

    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorModalEl = document.getElementById('errorModal');
    let errorModal;

    if (typeof bootstrap !== 'undefined' && errorModalEl) {
        errorModal = new bootstrap.Modal(errorModalEl);
    }
    const errorModalBody = document.getElementById('errorModalBody');

    const currentForm = document.querySelector('form:not(.search-form):not(#addActivityForm)');

    //Validation activities function
    const validateActivities = (input) => {
        const errorDiv = input.parentElement.querySelector('.error-msg');
        let isValid = true;
        let msg = '';
        const val = input.value.trim();
        const name = input.name;

        //Name validation
        if (input.name === 'name') {
            if (val === '') {
                isValid = false;
                msg = 'Name is required.';
            }
            else if (val[0] !== val[0].toUpperCase()) {
                isValid = false;
                msg = 'Start with capital letter.';
            }
            else if (val.length < 3) {
                isValid = false;
                msg = 'Min 3 chars.';
            }
        }

        //Price validation
        if (input.name === 'price') {
            if (val === '') {
                isValid = false;
                msg = 'Price is required.';
            }
            else if (parseFloat(val) <= 0) {
                isValid = false;
                msg = 'Price must be greater than 0.';
            }
        }

        //Duration validation
        if (input.name === 'duration') {
            if (val === '') {
                isValid = false;
                msg = 'Duration is required.';
            }
            else if (parseFloat(val) <= 0) {
                isValid = false;
                msg = 'Duration must be grater than 0.';
            }
        }

        //Description validation
        if (input.name === 'description') {
            if (val === '') {
                isValid = false;
                msg = 'Description is required.';
            }
            else if (val.length < 10) {
                isValid = false;
                msg = 'Min 10 chars.';
            }
            else if (val.length > 300) {
                isValid = false;
                msg = 'Max 300 chars.';
            }
            else if (val[0] !== val[0].toUpperCase()) {
                isValid = false;
                msg = 'Start with capital letter.';
            }
        }

        if (errorDiv) {
            if (!isValid) {
                input.classList.add('is-invalid');
                input.classList.remove('is-valid');
                errorDiv.innerText = msg;
                errorDiv.style.display = 'block';
            } else {
                input.classList.remove('is-invalid');
                input.classList.add('is-valid');
                errorDiv.style.display = 'none';
                errorDiv.innerText = '';
            } 
        } 
        return isValid;
    };
    
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
//Delete activity modal
    let activityIdToDelete = null;
    const btnConfirmDeleteActivity = document.getElementById('btnConfirmDeleteActivity');

    const deleteActivityButtons = document.querySelectorAll('.btnOpenDeleteActivityModal');

    deleteActivityButtons.forEach(button => {
        button.addEventListener('click', function() {
            activityIdToDelete = this.getAttribute('data-id');
        });
    });

    if (btnConfirmDeleteActivity) {
        btnConfirmDeleteActivity.addEventListener('click', async function() {
            if (!activityIdToDelete) return;
            this.disabled = true;

            try {
                const response = await fetch(`/delete/activity/${activityIdToDelete}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                if (data.success) {
                    window.location.reload();
                } else {
                    alert("Error deleting activity " + (data.message || 'Unknown error'));
                }
            } catch (error) {
                console.error(error);
                alert("Connection error trying to delete activity.");
            } finally {
                this.disabled = false;
                const modalEL = document.getElementById('deleteActivityModal');
                if (modalEL) {
                    const modal = bootstrap.Modal.getInstance(modalEL);
                    if (modal) modal.hide();
                }
            }
        });
    }

//Edit activity modal
    const editActivityButtons = document.querySelectorAll('.btnEditActivity');

    editActivityButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const id=this.dataset.id;
            const name=this.dataset.name;
            const price=this.dataset.price;
            const duration=this.dataset.duration;
            const description=this.dataset.description;
            const guide=this.dataset.guide;

            const card = document.getElementById(`activity-card-${id}`);

            const originalHTMl = card.innerHTML;

            card.innerHTML = `
                <form id="editForm-${id}" class="h-100 d-flex flex-column" novalidate>

                    <div class="mb-2">
                        <input type="text" name="name" class="form-control" value="${name}" placeholder="Name" required>
                        <div class="text-danger small error-msg" style="display:none;"></div>
                    </div>
                    <div class="row mb-2">
                        <div class="col">
                            <input type="number" name="price" class="form-control" value="${price}" placeholder="Price" min="0" required>
                            <div class="text-danger small error-msg" style="display:none;"></div>
                        </div>
                        <div class="col">
                            <input type="number" name="duration" class="form-control" value="${duration}" placeholder="Duration (hrs)" min="0" required>
                            <div class="text-danger small error-msg" style="display:none;">
                        </div>
                    </div>
                    <select name="guide_travel" class="form-select mb-2">
                        <option value="YES" ${guide === 'YES' ? 'selected' : ''}>Guide: YES</option>
                        <option value="NO" ${guide === 'NO' ? 'selected' : ''}>Guide: NO</option>
                    </select>
                    <textarea name="description" class="form-control mb-2" rows="3" placeholder="Description" required>${description}</textarea>
                    <div class="text-danger small error-msg" style="display:none;"></div>

                    <div class="mt-auto d-flex justify-content-center gap-2">
                        <button type="button" class="btn btn-secondary btn-sm btnCancelEdit">Cancel</button>
                        <button type="submit" class="btn btn-success btn-sm">Save</button>
                    </div>
                </form>
            `;

            const form= document.getElementById(`editForm-${id}`);
            const cancelBtn = card.querySelector('.btnCancelEdit');

            const inputs = form.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('input', () => validateActivities(input));
                input.addEventListener('blur', () => validateActivities(input));
            });

            cancelBtn.addEventListener('click', () => {
                card.innerHTML = originalHTMl;
                window.location.reload();
            });
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                let isFormValid = true;
                inputs.forEach(input => {
                    if (!validateActivities(input)) isFormValid = false;
                });

                if (!isFormValid) {
                    e.stopPropagation();
                    return;
                }

                const submitBtn = form.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving...';

                const formData = new FormData(form);
                const dataToSend = Object.fromEntries(formData.entries());

                try {
                    const response = await fetch(`/edit/activity/${id}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dataToSend)
                    });

                    const result = await response.json();

                    if (result.success) {
                        window.location.reload();
                    } else {
                        alert("Error updating activity: " + (result.message || 'Unknown error'));
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Save';
                    }
                } catch (error) {
                    console.error(error);
                    alert("Connection error trying to update activity.");
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Save';
                }
            });
        });
    }); 
    
    //Create activity 
    const addActivityForm = document.getElementById('addActivityForm');
    if (addActivityForm) {
        const inputsAdd = addActivityForm.querySelectorAll('input, textarea');

        inputsAdd.forEach(input => {
            input.addEventListener('input', () => validateActivities(input));
            input.addEventListener('blur', () => validateActivities(input));
        });

        addActivityForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            let isFormValid = true;
            inputsAdd.forEach(input => {
                if (!validateActivities(input)) isFormValid = false;
            });

            if (!isFormValid) return;

            const submitBtn = addActivityForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            if (loadingSpinner) loadingSpinner.style.display = 'flex';

            const formData = new FormData(addActivityForm);
            const dataToSend = Object.fromEntries(formData.entries());
            const tripId = addActivityForm.dataset.tripId;

            try {
                const response = await fetch(`/add-activity/${tripId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSend)
                });
                const result = await response.json();
                if (result.success) {
                    addActivityForm.reset();
                    inputsAdd.forEach(i => i.classList.remove('is-valid'));

                    const activitiesContainer = document.getElementById('activitiesContainer');

                    const newCardHTML = `
                    <div class="col-12 col-md-6 col-sm-2" >
                        <div class="p-4 bg-white rounded shadow h-100" id="activity-card-${result.activity._id}">
                            <h3 class="text-center">${result.activity.name}</h3>
                            <ol>
                                <li><strong>Fee: </strong> $${result.activity.price}</li>
                                <li><strong>Duration: </strong> ${result.activity.duration} hours</li>
                                <li><strong>Guide: </strong> ${result.activity.guide_travel}</li>
                            </ol>
                            <p class="item">${result.activity.description}</p>
                            <div class="d-flex justify-content-center gap-2 mt-3">
                                <button type="button" class="btn btn-warning btn-lg btnEditActivity"
                                    data-id="${result.activity._id}" data-name="${result.activity.name}"
                                    data-price="${result.activity.price}" data-duration="${result.activity.duration}"
                                    data-guide="${result.activity.guide_travel}" data-description="${result.activity.description}">
                                    Edit Activity
                                </button>
                                <button type="button" class="btn btn-danger btn-lg btnOpenDeleteActivityModal"
                                    data-id="${result.activity._id}" data-bs-toggle="modal" data-bs-target="#deleteActivityModal">
                                    Delete Activity
                                </button>
                            </div>
                        </div>
                    </div>
                    `;
                    activitiesContainer.insertAdjacentHTML('beforeend', newCardHTML);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    alert("Error adding activity: " + (result.message));
                }
            } catch (error) {
                console.error(error);
                alert("Connection error trying to add activity.");
            } finally {
                submitBtn.disabled = false;
                if (loadingSpinner) loadingSpinner.style.display = 'none';
            }
        });
    }
}); 