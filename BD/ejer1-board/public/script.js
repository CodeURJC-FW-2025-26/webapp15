
document.addEventListener('DOMContentLoaded', () => {

    
    const tripResultsContainer = document.getElementById('trip-results');
    const paginationControlsContainer = document.getElementById('pagination-controls');
    const searchInput = document.getElementById('trip-search');
    const filterButtons = document.querySelectorAll('.filter-btn');

    
    let currentState = {
        page: 1,
        search: '',
        category: ''
    };

    /**
     * Función principal para obtener y renderizar los viajes
     */
    async function fetchAndRenderTrips() {
        
        const { page, search, category } = currentState;
        let url = `/api/trips?page=${page}&limit=6`; 

        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }
        if (category) {
            url += `&category=${encodeURIComponent(category)}`;
        }

        try {
            
            tripResultsContainer.innerHTML = '<p class="text-center text-muted">Cargando viajes...</p>';
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            
            renderTrips(data.trips);
            renderPagination(data.totalPages, data.currentPage);

        } catch (error) {
            console.error('Error fetching trips:', error);
            tripResultsContainer.innerHTML = '<p class="text-center text-danger">Error al cargar los viajes. Inténtalo de nuevo más tarde.</p>';
        }
    }

    /**
     * Renderiza la lista de viajes en el DOM
     * @param {Array} trips - Array de objetos de viaje
     */
    function renderTrips(trips) {
        
        tripResultsContainer.innerHTML = '';

        if (trips.length === 0) {
            tripResultsContainer.innerHTML = '<p class="text-center text-muted">No se encontraron viajes con esos criterios.</p>';
            return;
        }

        
        trips.forEach(trip => {
            const tripCard = document.createElement('div');
            tripCard.className = 'col-lg-4 col-md-6 col-sm-12';
            
            
            tripCard.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <img src="/uploads/${trip.image}" class="card-img-top" alt="${trip.Title}">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${trip.Title} (${trip.Main_city})</h5>
                        <p class="card-text flex-grow-1">${trip.description.substring(0, 100)}...</p>
                        <span class="badge bg-primary align-self-start mb-2">${trip.t_trip}</span>
                        <p class="card-text text-end h4"><strong>${trip.price}€</strong></p>
                        
                        <a href="#" class="btn btn-dark mt-auto">Ver Detalles</a> 
                    </div>
                </div>
            `;


            tripResultsContainer.appendChild(tripCard);
        });
    }

    /**
     * Renderiza los controles de paginación
     * @param {number} totalPages - Número total de páginas
     * @param {number} currentPage - Página actual
     */
    function renderPagination(totalPages, currentPage) {
        
        paginationControlsContainer.innerHTML = '';

        if (totalPages <= 1) return; 

        
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}">Anterior</a>`;
        paginationControlsContainer.appendChild(prevLi);

        
        for (let i = 1; i <= totalPages; i++) {
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
            pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            paginationControlsContainer.appendChild(pageLi);
        }

        
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage + 1}">Siguiente</a>`;
        paginationControlsContainer.appendChild(nextLi);
    }

    
    paginationControlsContainer.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target;
        
        
        if (target.tagName === 'A' && !target.closest('.page-item').classList.contains('disabled')) {
            const page = parseInt(target.dataset.page);
            if (page !== currentState.page) {
                currentState.page = page;
                fetchAndRenderTrips();
            }
        }
    });

    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            
            
            if (currentState.category === category) {
                currentState.category = '';
                button.classList.remove('active');
            } else {
                
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                button.classList.add('active');
                currentState.category = category;
            }
            
            
            currentState.page = 1;
            fetchAndRenderTrips();
        });
    });
    
    
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        
        clearTimeout(searchTimeout);
        
        
        searchTimeout = setTimeout(() => {
            currentState.search = searchInput.value.trim();
            
            currentState.page = 1;
            fetchAndRenderTrips();
        }, 300);
    });



if (window.INITIAL_DATA) {
    renderPagination(window.INITIAL_DATA.totalPages, window.INITIAL_DATA.currentPage);
} else {
    
    fetchAndRenderTrips();
}

});