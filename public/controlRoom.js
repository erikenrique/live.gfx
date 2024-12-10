const socket = io(`http://${window.location.hostname}:${window.location.port}`);

document.addEventListener('DOMContentLoaded', () => {

    ///////////////////////////// SOCKET

    socket.on('connect', () => {
        console.log('socket connected:', socket.id);
        console.log('socket is now connected... right:', socket.connected); 
    
        socket.on('elementPreviewStateChanged', ({ id, state }) => {
            console.log(`Updating cue button style for element ID: ${id}, New state: ${state}`);
        
            // Directly select the button with the correct data-element-id
            const cueButton = document.querySelector(`.cue-btn[data-element-id="${id}"]`);
        
            if (cueButton) {
                updateCueButtonStyle(cueButton, state);
            } else {
                console.warn(`Cue button "${id}" not found`);
            }
        });
    
        socket.on('elementsReordered', ({ elements }) => {
            const elementsList = document.querySelector('.elements-list');
            elementsList.innerHTML = ''; // Clear the current list
        
            // Render the updated elements
            elements.forEach((element) => {
                const elementHTML = renderElementHTML(element); // Use the pre-defined render function
                elementsList.insertAdjacentHTML('beforeend', elementHTML);
            });
        
            console.log('Updated elements rendered based on new order:', elements);
        });
        
        
        
    });

    /////////////////////////////////////////////////////////////////////
    ////// VARIABLES + EVENT LISTENERS
    /////////////////////////////////////////////////////////////////////

    console.log("Hello! Loaded controlRoom.js");

    const projectId = document.querySelector('body').dataset.projectId;
    const sceneId = document.querySelector('body').dataset.sceneId;
    const adminBaseUrl = document.querySelector('body').dataset.publicBaseUrl;
    const localBaseUrl = document.querySelector('body').dataset.localBaseUrl;

    console.log('Project ID:', projectId);
    console.log('Scene ID:', sceneId);
    console.log('Admin Base URL:', adminBaseUrl);
    console.log('Local Base URL:', localBaseUrl);

    const addElementBtn = document.querySelector('#addElementBtn');
    const toggleEditBtn = document.querySelector('#toggleEditBtn');
    const runBtn = document.querySelector('#runBtn');
    const elementsList = document.querySelector('.elements-list');
    const addElementPanel = document.querySelector('#addElementPanel');
    const editElementPanel = document.querySelector('#editElementPanel');
    const closeAddPanelBtn = document.querySelector('#closeAddPanelBtn');
    const closeEditPanelBtn = document.querySelector('#closeEditPanelBtn');
    const editElementForm = document.querySelector('#editElementForm');

    let editingElementId = null;
    let isEditing = false;

    // Add Element Panel Toggle
    addElementBtn.addEventListener('click', () => {
        if (addElementPanel.classList.contains('visible')) {
            addElementPanel.classList.remove('visible');
            addElementPanel.style.minWidth = '0rem';
            addElementPanel.style.maxWidth = '0rem';
        } else {
            addElementPanel.classList.add('visible');
            addElementPanel.style.minWidth = '20rem';
            addElementPanel.style.maxWidth = '20rem';
            editElementPanel.classList.remove('visible');
        }
    });

    closeAddPanelBtn.addEventListener('click', () => {
        addElementPanel.classList.remove('visible');
        addElementPanel.style.minWidth = '0rem';
        addElementPanel.style.maxWidth = '0rem';
    });

    // Toggle Edit Mode
    toggleEditBtn.addEventListener('click', () => {
        isEditing = !isEditing;
        toggleEditBtn.textContent = isEditing ? 'Lock' : 'Edit';
        document.querySelectorAll('.editable-controls').forEach((control) => {
            if (isEditing) {
                control.classList.remove('hidden');
            } else {
                control.classList.add('hidden');
            }
        });
        document.body.dataset.isEditing = isEditing;
    });

    // Run Button
    if (runBtn) {
        runBtn.addEventListener('click', async () => {
            try {
                await fetch(getApiEndpoint(`/project/${projectId}/scene/${sceneId}/elements/run-preview`), {
                    method: 'POST',
                    credentials: 'include',
                });
                console.log("Preview changes applied");
            } catch (error) {
                console.error("Failed to apply preview changes:", error);
            }
        });
    }

    // Toggle Edit Element Panel
    if (elementsList) {
        elementsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-panel-btn')) {
                editingElementId = e.target.dataset.elementId;
                editElementPanel.classList.add('visible');
                editElementPanel.style.minWidth = '20rem';
                editElementPanel.style.maxWidth = '20rem';
                addElementPanel.classList.remove('visible');
            }
        });
    } else {
        console.warn("No elements list found. Skipping edit panel setup.");
    }

    closeEditPanelBtn.addEventListener('click', () => {
        editElementPanel.classList.remove('visible');
        editElementPanel.style.minWidth = '0rem';
        editElementPanel.style.maxWidth = '0rem';
        editingElementId = null;
    });

    // Save Edited Element
    editElementForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const content = document.querySelector('#elementContent').value;
        const position = document.querySelector('#elementPosition').value;

        try {
            const apiEndpoint = getApiEndpoint(`/elements/${editingElementId}`);
            const response = await fetch(apiEndpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, position }),
                credentials: 'include',
            });

            if (response.ok) {
                socket.emit('updateElement', { id: editingElementId, content, position });
                editElementPanel.classList.remove('visible');
                editElementPanel.style.minWidth = '0rem';
                editElementPanel.style.maxWidth = '0rem';
            } else {
                console.error('Failed to update element:', await response.text());
            }
        } catch (error) {
            console.error('Error updating element:', error);
        }
    });

    // Add Element Functionality
    const addElementTypeButtons = addElementPanel.querySelectorAll('.btn');
    addElementTypeButtons.forEach((button) => {
        button.addEventListener('click', async () => {
            const elementType = button.textContent.trim();
            const apiEndpoint = getApiEndpoint(`/admin/project/${projectId}/scene/${sceneId}/elements`);

            try {
                const response = await fetch(apiEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: elementType }),
                    credentials: 'include',
                });

                if (response.ok) {
                    const newElement = await response.json();
                    socket.emit('elementAdded', newElement.element);
                    addElementPanel.classList.remove('visible');
                    addElementPanel.style.minWidth = '0rem';
                    addElementPanel.style.maxWidth = '0rem';
                } else {
                    console.error('Failed to create element:', await response.json());
                }
            } catch (error) {
                console.error('Error creating element:', error);
            }
        });
    });

    // Handle Z-Index Changes
    elementsList.addEventListener('click', async (e) => {
        const elementItem = e.target.closest('.element-item');
        console.log(elementItem)
        console.log(elementItem.previousElementSibling)
        console.log(elementItem.nextElementSibling)
        console.log(e.target, e.target.classList)

        if (!elementItem) return;

        const elementId = elementItem.querySelector('.toggle-btn').dataset.elementId;

        console.log(elementId)

        // MOVE IT UP
        if (e.target.classList.contains('z-up-btn')) {
            const prevElement = elementItem.previousElementSibling;
            
            if (!prevElement) return; // already at top

            const newOrder = Number(prevElement.dataset.order);
            await updateOrder(elementId, newOrder);

            elementsList.insertBefore(elementItem, prevElement);
        }

        // MOVE IT DOWN
        if (e.target.classList.contains('z-down-btn')) {
            const nextElement = elementItem.nextElementSibling;
            if (!nextElement) return; // already at bottom

            const newOrder = Number(nextElement.dataset.order);
            await updateOrder(elementId, newOrder);

            elementsList.insertBefore(nextElement, elementItem);
        }
    });
// lower third was 2, clicked down 



    // Handle Element Deletion
    elementsList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const elementId = e.target.closest('.element-item').dataset.elementId;

            try {
                await fetch(getApiEndpoint(`/project/${projectId}/scene/${sceneId}/elements/${elementId}`), {
                    method: 'DELETE',
                });

                e.target.closest('.element-item').remove();
                console.log(`Element ${elementId} deleted`);
            } catch (error) {
                console.error(`Failed to delete element ${elementId}`, error);
            }
        }
    });

    // Handle Cue and Toggle Button Actions
    elementsList.addEventListener('click', async (e) => {
        let elementId;
        let elementItem;
    
        if (e.target.dataset.elementId) {
            elementItem = e.target;
            elementId = e.target.dataset.elementId;
        } else {
            elementItem = e.target.closest('.element-item').childNodes[3];
            elementId = elementItem.dataset.elementId;
        }
    
        if (!elementItem) {
            console.error('No .element-item found in the ancestor chain of the clicked target.');
            return;
        }
    
        console.log('Element ID:', elementId);
        console.log('Element Item:', elementItem);
    
        // Handle Cue Button
        if (elementItem.classList.contains('cue-btn')) {
            console.log(`Cue button clicked for Element ID: ${elementId}`);
            try {
                const response = await fetch(getApiEndpoint(`/admin/project/${projectId}/scene/${sceneId}/elements/${elementId}/preview-cue`), {
                    method: 'POST',
                    credentials: 'include',
                });
                const result = await response.json();
    
                if (response.ok) {
                    console.log(`Element state updated to: ${result.element.state}`);
                    console.log(`Emitting socket event for Element ID: ${elementId}, State: ${result.element.state}`);
                    socket.emit('elementPreviewStateChanged', {
                        id: elementId,
                        state: result.element.state,
                    }); // Emit socket event
                } else {
                    console.error('Failed to toggle preview state:', result.error);
                }
            } catch (error) {
                console.error('Error toggling preview state:', error);
            }
        }
    
        // Handle Toggle Button
        if (e.target.classList.contains('toggle-btn')) {
            console.log(`Toggle button clicked for Element ID: ${elementId}`);
            try {
                const currentStateResponse = await fetch(getApiEndpoint(`/admin/project/${projectId}/scene/${sceneId}/elements/${elementId}`), {
                    method: 'GET',
                    credentials: 'include',
                });
    
                if (!currentStateResponse.ok) {
                    console.error('Failed to fetch current state');
                    return;
                }
    
                const currentState = (await currentStateResponse.json()).element.state;
                const newState = currentState === 'on' ? 'off' : 'on';
                console.log('Current state: ', currentState, ' New state: ', newState);
    
                const response = await fetch(getApiEndpoint(`/admin/project/${projectId}/scene/${sceneId}/elements/${elementId}`), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ state: newState }),
                    credentials: 'include',
                });
    
                const result = await response.json();
    
                if (response.ok) {
                    console.log(`Element state toggled. New state: ${result.element.state}`);
                    socket.emit('elementPreviewStateChanged', {
                        id: elementId,
                        state: result.element.state,
                    }); // Emit socket event
                } else {
                    console.error('Failed to toggle element state:', result.error);
                }
            } catch (error) {
                console.error('Error toggling element state:', error);
            }
        }
    });


    /////////////////////////////////////////////////////////////////////
    //////////// HELPER FUNCTIONS
    /////////////////////////////////////////////////////////////////////

    function getApiEndpoint(resourcePath) {
        return `${adminBaseUrl}${resourcePath}`;
    }
    
    // Update Order Function
    async function updateOrder(elementId, newOrder) {
        try {
            const response = await fetch(getApiEndpoint(`/admin/project/${projectId}/scene/${sceneId}/elements/${elementId}/reorder`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newOrder }),
                credentials: 'include',
            });

            const result = await response.json();
            console.log(result)

            if (response.ok) {
                console.log(`Element ${elementId} order updated to ${newOrder}`);
            } else {
                console.error('Failed to update order:', result.error);
            }
        } catch (error) {
            console.error('Error updating order:', error);
        }   
    }


    function updateCueButtonStyle(cueButton, state) {
        console.log(`Updating button style:`, { cueButton, state });
        if (!cueButton) {
            console.warn('Cue button is null or undefined');
            return;
        }
    
        cueButton.classList.remove('preview-on', 'on', 'preview-off', 'off');
    
        if (state === 'preview on') {
            cueButton.classList.add('preview-on');
        } else if (state === 'on') {
            cueButton.classList.add('on');
        } else if (state === 'preview off') {
            cueButton.classList.add('preview-off');
        } else {
            cueButton.classList.add('off');
        }
    }
    
    function renderElementHTML(element) {
        return `
            <div class="element-item flex justify-between items-center rounded p-2" data-order="${element.order}">
                <!-- Cue Button -->
                <button
                    class="cue-btn w-8 h-8 rounded-full transition ${element.state === 'preview on' ? 'preview-on' : element.state === 'on' ? 'on' : element.state === 'preview off' ? 'preview-off' : ''}"
                    data-element-id="${element._id}">
                </button>
    
                <!-- Toggle Button -->
                <button
                    class="toggle-btn flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded flex-grow"
                    data-element-id="${element._id}">
                    <span class="icon mr-2">
                        ${element.type === 'Image' ? '🖼️' : 
                           element.type === 'Lower Third' ? '📺' : 
                           element.type === 'Message' ? '✉️' : '📜'}
                    </span>
                    <div class="text-wrapper">
                        <div class="text-xxs text-gray-400">${element.type}</div>
                        <div class="font-semibold">${element.content || 'No content set'}</div>
                    </div>
                </button>
    
                <!-- Editing Controls -->
                <div class="editable-controls flex space-x-2" style="display: ${isEditing ? 'flex' : 'none'};">
                    <button
                        class="z-up-btn w-10 h-10 bg-gray-700 hover:bg-gray-600 text-white rounded"
                        data-element-id="${element._id}">↑</button>
                    <button
                        class="z-down-btn w-10 h-10 bg-gray-700 hover:bg-gray-600 text-white rounded"
                        data-element-id="${element._id}">↓</button>
                    <button
                        class="edit-panel-btn w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded"
                        data-element-id="${element._id}">✏️</button>
                    <button
                        class="delete-btn w-10 h-10 bg-red-600 hover:bg-red-500 text-white rounded"
                        data-element-id="${element._id}">🗑️</button>
                </div>
            </div>
        `;
    }
    

    // Socket.IO Element Updates
    // socket.on('elementAdded', (newElement) => {
    //     if (elementsList) {
    //         const elementItem = document.createElement('div');
    //         elementItem.className = 'element-item flex justify-between items-center bg-gray-800 rounded p-2 mb-2';
    //         elementItem.dataset.elementId = newElement.id;

    //         elementItem.innerHTML = `
    //             <button
    //                 class="cue-btn rounded border-2 transition focus:outline-none w-8 h-8"
    //                 style="border-color: gray; background-color: transparent;"
    //             ></button>
    //             <div class="flex-1 mx-4">
    //                 <p class="font-medium text-sm">${newElement.type}</p>
    //                 <span class="text-xs text-gray-400">${newElement.content || 'No content provided'}</span>
    //             </div>
    //             <div class="editable-controls flex space-x-2" style="display: ${isEditing ? 'flex' : 'none'}">
    //                 <button class="z-up-btn w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded">↑</button>
    //                 <button class="z-down-btn w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded">↓</button>
    //                 <button class="edit-btn w-8 h-8 bg-blue-600 hover:bg-blue-500 text-white rounded">✏️</button>
    //                 <button class="delete-btn w-8 h-8 bg-red-600 hover:bg-red-500 text-white rounded">🗑️</button>
    //             </div>
    //         `;

    //         elementsList.appendChild(elementItem);
    //     } else {
    //         console.error("No elements list found to append the new element.");
    //     }
    // });
    
    

});
